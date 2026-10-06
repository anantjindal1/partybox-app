/**
 * Portable, framework-light usage-analytics core.
 *
 * No hardcoded app coupling — call `configureAnalytics()` once at startup
 * with a Firestore `db` instance and a `getDeviceId()` function, then call
 * `trackEvent()` / `startSession()` from anywhere (any game, any screen).
 * Designed to be lifted into another app wholesale: copy this file plus
 * the matching Firestore rules block (see README.md), wire
 * `configureAnalytics()` once, done.
 *
 * This module MUST NEVER throw — every call is fire-and-forget. A failure
 * here should never affect the app it's embedded in.
 *
 * Firestore shape (three flat collections, no subcollections):
 *   analytics_events  — one doc per event: { event, deviceId, game, ts,
 *                       clientTs, sessionId, platform, os, ...commonProps,
 *                       props }
 *   analytics_devices — one doc per device, upserted on every event:
 *                       { deviceId, firstSeen, lastSeen, sessionCount,
 *                         platform, os, ...commonProps, totalTimeMs }
 *   analytics_daily   — one doc per calendar day (YYYY-MM-DD), counters
 *                       incremented per event type, e.g. { date, sessions,
 *                       gamesStarted, gamesCompleted, gamesAbandoned,
 *                       rematches, totalTimeMs, consentGranted,
 *                       consentDenied }
 */
import {
  collection,
  doc,
  addDoc,
  setDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore'

// Caps memory if consent is never answered in a long-lived tab.
const MAX_PENDING = 100

let _db = null
let _getDeviceId = async () => 'anonymous'
let _getPlatform = detectOs
let _getCommonProps = async () => ({})
let _getConsent = () => true
let _forward = null
let _beaconUrl = null
let _common = {}
let _lastDeviceId = null
let _sessionId = null
const _pending = []

/**
 * Wire this module up to a host app. Call once, before the first
 * trackEvent()/startSession() — subsequent calls before configuration
 * simply no-op (never throw).
 *
 * @param {object} config
 * @param {object} config.db - a Firestore instance (from getFirestore())
 * @param {() => Promise<string>|string} [config.getDeviceId] - resolves to
 *   a stable anonymous id for the current user/device.
 * @param {() => string} [config.getPlatform] - overrides platform detection
 *   (e.g. to tell a native app shell apart from the same OS's browser).
 *   The user-agent OS is always recorded separately as `os`.
 * @param {() => Promise<object>|object} [config.getCommonProps] - flat
 *   string/number/boolean fields stamped on every event and the device doc
 *   (e.g. `{ uid, appVersion, isInternal }`).
 * @param {() => boolean|null} [config.getConsent] - true = record, false =
 *   drop, null = not answered yet (events queue in memory until
 *   `onConsentChange()` is called). Defaults to always recording.
 * @param {(event: string, game: string|null, props: object) => void} [config.forward] -
 *   also hands every consented event to another sink (e.g. Google
 *   Analytics). Not called for the tab-close beacon.
 * @param {{projectId: string, apiKey: string}} [config.restBeacon] -
 *   optional. Lets `endSession()` use `navigator.sendBeacon()` on tab
 *   close, which browsers deliver even as the page unloads; a normal
 *   Firestore SDK write often loses that race.
 */
export function configureAnalytics({ db, getDeviceId, getPlatform, getCommonProps, getConsent, forward, restBeacon } = {}) {
  _db = db ?? null
  if (getDeviceId) _getDeviceId = getDeviceId
  if (getPlatform) _getPlatform = getPlatform
  if (getCommonProps) _getCommonProps = getCommonProps
  if (getConsent) _getConsent = getConsent
  if (forward) _forward = forward
  if (restBeacon?.projectId && restBeacon?.apiKey) {
    _beaconUrl = `https://firestore.googleapis.com/v1/projects/${restBeacon.projectId}/databases/(default)/documents/analytics_events?key=${restBeacon.apiKey}`
  }
}

function detectOs() {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad/i.test(ua)) return 'ios'
  if (/windows/i.test(ua)) return 'windows'
  if (/mac/i.test(ua)) return 'mac'
  return 'other'
}

function todayStr() {
  return new Date().toISOString().substring(0, 10)
}

function newSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

function consentState() {
  try {
    return _getConsent()
  } catch (_) {
    return null
  }
}

async function resolveDeviceId() {
  try {
    _lastDeviceId = (await _getDeviceId()) || 'anonymous'
  } catch (_) {
    _lastDeviceId = 'anonymous'
  }
  return _lastDeviceId
}

// Firestore rejects `undefined` fields, so drop them here once.
async function resolveCommon() {
  try {
    const props = (await _getCommonProps()) ?? {}
    _common = Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined))
  } catch (_) {
    // keep the last good values
  }
  return _common
}

// Maps event name -> analytics_daily counter field to increment.
// Events not listed here (e.g. a game's own custom event names) still get
// logged to analytics_events/analytics_devices, just with no daily rollup.
const DAILY_FIELD = {
  session_start: 'sessions',
  game_start: 'gamesStarted',
  game_complete: 'gamesCompleted',
  game_abandon: 'gamesAbandoned',
  rematch: 'rematches',
}

function bumpDaily(fields) {
  const today = todayStr()
  return setDoc(doc(_db, 'analytics_daily', today), { date: today, ...fields }, { merge: true })
}

/**
 * Track a single analytics event. Safe to call from anywhere (a shared
 * shell component, or a specific game wanting a richer, game-specific
 * event) — every call writes the same three collections, so a dashboard
 * built against this shape works regardless of who's calling it.
 *
 * @param {string} event - e.g. 'first_open' | 'session_start' |
 *   'game_start' | 'game_complete' | 'game_abandon' | 'rematch', or any
 *   custom name
 * @param {string|null} game - a game/screen slug, or null for app-level events
 * @param {object} [props] - arbitrary extra data (kept small — this is
 *   fire-and-forget usage analytics, not a general event store)
 */
export async function trackEvent(event, game, props = {}) {
  if (!_db) return
  const consent = consentState()
  if (consent === false) return
  if (consent === null) {
    if (_pending.length < MAX_PENDING) _pending.push([event, game, props, Date.now(), _sessionId])
    return
  }
  await writeEvent(event, game, props, Date.now(), _sessionId)
}

/**
 * Call whenever the host's consent answer changes. Flushes the events
 * queued while consent was unanswered (granted) or discards them (denied),
 * and counts the decision in analytics_daily with no identifiers attached,
 * so the opt-in rate stays measurable even for people who decline.
 */
export async function onConsentChange() {
  const consent = consentState()
  if (!_db || consent === null) return
  const queued = _pending.splice(0)
  try {
    await bumpDaily({ [consent ? 'consentGranted' : 'consentDenied']: increment(1) })
  } catch (err) {
    console.warn('[analytics] consent count failed silently:', err)
  }
  if (consent) {
    for (const args of queued) await writeEvent(...args)
  }
}

async function writeEvent(event, game, props, clientTs, sessionId) {
  try {
    _forward?.(event, game, props)
  } catch (err) {
    console.warn('[analytics] forward failed silently:', err)
  }
  try {
    const deviceId = await resolveDeviceId()
    const common = await resolveCommon()
    const context = { platform: _getPlatform(), os: detectOs(), ...common }

    await addDoc(collection(_db, 'analytics_events'), {
      event,
      deviceId,
      game: game ?? null,
      ts: serverTimestamp(),
      clientTs: new Date(clientTs),
      sessionId: sessionId ?? null,
      ...context,
      props: props ?? {},
    })

    const deviceUpdate = { deviceId, lastSeen: serverTimestamp(), ...context }
    if (event === 'first_open') deviceUpdate.firstSeen = serverTimestamp()
    if (event === 'session_start') deviceUpdate.sessionCount = increment(1)
    if (event === 'session_end' && typeof props.durationMs === 'number') {
      deviceUpdate.totalTimeMs = increment(props.durationMs)
    }
    await setDoc(doc(_db, 'analytics_devices', deviceId), deviceUpdate, { merge: true })

    const dailyUpdate = {}
    const dailyField = DAILY_FIELD[event]
    if (dailyField) dailyUpdate[dailyField] = increment(1)
    if (event === 'session_end' && typeof props.durationMs === 'number') {
      dailyUpdate.totalTimeMs = increment(props.durationMs)
    }
    if (Object.keys(dailyUpdate).length > 0) await bumpDaily(dailyUpdate)
  } catch (err) {
    console.warn('[analytics] trackEvent failed silently:', err)
  }
}

// ── App-level session / screen-time tracking ────────────────────────────────
// Deliberately simple: one timestamp at start, one duration computed at
// end — no heartbeat/interval polling, so this adds no ongoing overhead.
// Hiding the app (tab switch, phone home button) logs the time spent so
// far; coming back within SESSION_RESUME_MS continues the same session (as
// GA4 does), otherwise starts a new one — so quick app switches don't
// inflate session counts.
const SESSION_RESUME_MS = 30 * 60 * 1000
let _sessionStartedAt = null
let _endedAt = null
let _listenersAttached = false

function resumeSession() {
  if (_sessionStartedAt) return
  if (_sessionId && _endedAt && Date.now() - _endedAt < SESSION_RESUME_MS) {
    _sessionStartedAt = Date.now()
  } else {
    startSession()
  }
}

/**
 * Call once per app load. Idempotent — a second call before endSession()
 * is a no-op, so it's safe to call from multiple entry points without
 * double-counting.
 */
export function startSession() {
  if (_sessionStartedAt) return
  _sessionStartedAt = Date.now()
  _sessionId = newSessionId()
  trackEvent('session_start', null)

  if (typeof document !== 'undefined' && !_listenersAttached) {
    _listenersAttached = true
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) endSession()
      else resumeSession()
    })
    window.addEventListener('pagehide', () => endSession())
  }
}

/**
 * Ends the current session and logs its duration. Safe to call multiple
 * times (a second call is a no-op) — both the tab-hidden and pagehide
 * listeners above call this, and only the first one does anything.
 */
export function endSession() {
  if (!_sessionStartedAt) return
  _endedAt = Date.now()
  const durationMs = _endedAt - _sessionStartedAt
  _sessionStartedAt = null

  if (_beaconUrl && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    if (consentState() === true) sendSessionEndBeacon(durationMs)
  } else {
    trackEvent('session_end', null, { durationMs })
  }
}

function toRestValue(v) {
  if (v === null || v === undefined) return { nullValue: null }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  return { stringValue: String(v) }
}

// A beacon can only make one, fire-and-forget HTTP request — no follow-up
// reads, no multi-document transaction — so unlike the normal trackEvent()
// path, this writes ONLY the raw analytics_events log entry, skipping the
// analytics_devices/analytics_daily rollup increments. A dashboard should
// sum `session_end` events' `durationMs` straight from the event log for
// session-time metrics, since this event can arrive via either path.
// Uses the last resolved device id and common props: resolving afresh
// during unload could outlive the page, or mint a new id if storage was
// just cleared.
function sendSessionEndBeacon(durationMs) {
  if (!_lastDeviceId) return
  try {
    const now = new Date().toISOString()
    const context = { platform: _getPlatform(), os: detectOs(), ..._common }
    const fields = {
      event: { stringValue: 'session_end' },
      deviceId: { stringValue: _lastDeviceId },
      game: { nullValue: null },
      // Client-supplied timestamp, not serverTimestamp() — the REST
      // create-document API has no request-time-function equivalent
      // simple enough for a one-shot beacon body.
      ts: { timestampValue: now },
      clientTs: { timestampValue: now },
      sessionId: toRestValue(_sessionId),
      props: { mapValue: { fields: { durationMs: { integerValue: String(durationMs) } } } },
    }
    for (const [k, v] of Object.entries(context)) fields[k] = toRestValue(v)
    navigator.sendBeacon(_beaconUrl, new Blob([JSON.stringify({ fields })], { type: 'application/json' }))
  } catch (err) {
    console.warn('[analytics] sendSessionEndBeacon failed silently:', err)
  }
}
