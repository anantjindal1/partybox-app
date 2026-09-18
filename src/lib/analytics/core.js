/**
 * Portable, framework-light usage-analytics core.
 *
 * No hardcoded app coupling — call `configureAnalytics()` once at startup
 * with a Firestore `db` instance and a `getDeviceId()` function, then call
 * `trackEvent()` / `startSession()` from anywhere (any game, any screen).
 * Designed to be lifted into another app wholesale: copy this file plus
 * the matching Firestore rules block (see bottom of this comment), wire
 * `configureAnalytics()` once, done.
 *
 * This module MUST NEVER throw — every call is fire-and-forget. A failure
 * here should never affect the app it's embedded in.
 *
 * Firestore shape (three flat collections, no subcollections):
 *   analytics_events  — one doc per event: { event, deviceId, game, ts, props }
 *   analytics_devices — one doc per device, upserted every session:
 *                       { deviceId, firstSeen, lastSeen, sessionCount,
 *                         platform, totalTimeMs }
 *   analytics_daily   — one doc per calendar day (YYYY-MM-DD), counters
 *                       incremented per event type, e.g. { date, sessions,
 *                       gamesStarted, gamesCompleted, gamesAbandoned,
 *                       rematches, totalTimeMs }
 *
 * Matching Firestore rules (anonymous, fire-and-forget writes; dashboards
 * read via the REST API, not the SDK, so no client read rule is required):
 *   match /analytics_events/{docId}  { allow read, write: if true; }
 *   match /analytics_devices/{docId} { allow read, write: if true; }
 *   match /analytics_daily/{docId}   { allow read, write: if true; }
 */
import {
  collection,
  doc,
  addDoc,
  setDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore'

let _db = null
let _getDeviceId = async () => 'anonymous'
let _getPlatform = defaultPlatform
let _beaconUrl = null

/**
 * Wire this module up to a host app. Call once, before the first
 * trackEvent()/startSession() — subsequent calls before configuration
 * simply no-op (never throw).
 *
 * @param {object} config
 * @param {object} config.db - a Firestore instance (from getFirestore())
 * @param {() => Promise<string>|string} [config.getDeviceId] - resolves to
 *   a stable anonymous id for the current user/device. Defaults to a
 *   random-per-session id if not provided (still works, just won't
 *   dedupe returning visitors).
 * @param {() => string} [config.getPlatform] - overrides platform detection
 * @param {{projectId: string, apiKey: string}} [config.restBeacon] -
 *   optional. Without this, `endSession()` on tab close is BEST-EFFORT:
 *   a normal Firestore SDK write is an async network call, and a browser
 *   can (and often does) discard the page before it completes once
 *   `pagehide` fires — the exact same limitation Google Analytics has,
 *   for the same reason. Providing project/key here lets `endSession()`
 *   use `navigator.sendBeacon()` instead for that one write, which
 *   browsers guarantee to deliver even as the page unloads.
 */
export function configureAnalytics({ db, getDeviceId, getPlatform, restBeacon } = {}) {
  _db = db ?? null
  if (getDeviceId) _getDeviceId = getDeviceId
  if (getPlatform) _getPlatform = getPlatform
  if (restBeacon?.projectId && restBeacon?.apiKey) {
    _beaconUrl = `https://firestore.googleapis.com/v1/projects/${restBeacon.projectId}/databases/(default)/documents/analytics_events?key=${restBeacon.apiKey}`
  }
}

function defaultPlatform() {
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

/**
 * Track a single analytics event. Safe to call from anywhere (a shared
 * shell component, or a specific game wanting a richer, game-specific
 * event) — every call writes the same three collections, so a dashboard
 * built against this shape works regardless of who's calling it.
 *
 * @param {string} event - e.g. 'session_start' | 'game_start' |
 *   'game_complete' | 'game_abandon' | 'rematch', or any custom name
 * @param {string|null} game - a game/screen slug, or null for app-level events
 * @param {object} [props] - arbitrary extra data (kept small — this is
 *   fire-and-forget usage analytics, not a general event store)
 */
export async function trackEvent(event, game, props = {}) {
  if (!_db) return
  try {
    let deviceId = 'anonymous'
    try {
      deviceId = (await _getDeviceId()) || 'anonymous'
    } catch (_) {
      // deviceId provider failed — fall back to anonymous rather than throw
    }

    const today = todayStr()

    await addDoc(collection(_db, 'analytics_events'), {
      event,
      deviceId,
      game: game ?? null,
      ts: serverTimestamp(),
      props: props ?? {},
    })

    const deviceUpdate = {
      deviceId,
      lastSeen: serverTimestamp(),
      platform: _getPlatform(),
    }
    if (event === 'session_start') {
      deviceUpdate.firstSeen = serverTimestamp()
      deviceUpdate.sessionCount = increment(1)
    }
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
    if (Object.keys(dailyUpdate).length > 0) {
      await setDoc(doc(_db, 'analytics_daily', today), { date: today, ...dailyUpdate }, { merge: true })
    }
  } catch (err) {
    console.warn('[analytics] trackEvent failed silently:', err)
  }
}

// ── App-level session / screen-time tracking ────────────────────────────────
// Deliberately simple: one timestamp at start, one duration computed at
// end — no heartbeat/interval polling, so this adds no ongoing overhead.
let _sessionStartedAt = null
let _listenersAttached = false

/**
 * Call once per app load (e.g. on the Home screen mounting). Idempotent —
 * a second call before endSession() is a no-op, so it's safe to call from
 * multiple entry points without double-counting.
 */
export function startSession() {
  if (_sessionStartedAt) return
  _sessionStartedAt = Date.now()
  trackEvent('session_start', null)

  if (typeof document !== 'undefined' && !_listenersAttached) {
    _listenersAttached = true
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) endSession()
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
  const durationMs = Date.now() - _sessionStartedAt
  _sessionStartedAt = null

  if (_beaconUrl && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    sendSessionEndBeacon(durationMs)
  } else {
    trackEvent('session_end', null, { durationMs })
  }
}

// A beacon can only make one, fire-and-forget HTTP request — no follow-up
// reads, no multi-document transaction — so unlike the normal trackEvent()
// path, this writes ONLY the raw analytics_events log entry, skipping the
// analytics_devices/analytics_daily rollup increments. Nothing is lost: a
// dashboard should sum `session_end` events' `durationMs` straight from
// the event log for session-time metrics (see tools/analytics-dashboard.html)
// rather than depend on those pre-aggregated counters, since this is the
// one event type that can legitimately arrive via either path.
async function sendSessionEndBeacon(durationMs) {
  let deviceId = 'anonymous'
  try {
    deviceId = (await _getDeviceId()) || 'anonymous'
  } catch (_) {
    // deviceId provider failed — fall back to anonymous rather than throw
  }
  try {
    const body = JSON.stringify({
      fields: {
        event: { stringValue: 'session_end' },
        deviceId: { stringValue: deviceId },
        game: { nullValue: null },
        // Client-supplied timestamp, not serverTimestamp() — the REST
        // create-document API has no request-time-function equivalent
        // simple enough for a one-shot beacon body. A few seconds of
        // clock skew doesn't matter for this specific event.
        ts: { timestampValue: new Date().toISOString() },
        props: { mapValue: { fields: { durationMs: { integerValue: String(durationMs) } } } },
      },
    })
    navigator.sendBeacon(_beaconUrl, new Blob([body], { type: 'application/json' }))
  } catch (err) {
    console.warn('[analytics] sendSessionEndBeacon failed silently:', err)
  }
}
