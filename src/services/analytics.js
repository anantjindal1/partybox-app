/**
 * Google Analytics (GA4) sink for the analytics core — every consented
 * event goes here as well as to Firestore. The native SDK runs in the app
 * (installs, updates, AdMob revenue, app-stream retention); the web SDK
 * runs in browsers. Games call trackEvent from src/lib/analytics/core,
 * never this file.
 */
import { Capacitor } from '@capacitor/core'
import { FirebaseAnalytics } from '@capacitor-firebase/analytics'
import { logEvent, setAnalyticsCollectionEnabled, setUserId, setUserProperties } from 'firebase/analytics'
import { analytics, enableFirebaseAnalytics } from '../firebase'

const native = Capacitor.isNativePlatform()

// GA4 records these itself; logging them manually is rejected or duplicated.
const GA_AUTOMATIC = new Set(['first_open', 'session_start', 'session_end'])

// GA4 params must be flat strings/numbers.
function toParams(game, props) {
  const params = game ? { game } : {}
  for (const [key, value] of Object.entries(props ?? {})) {
    if (typeof value === 'string' || typeof value === 'number') params[key] = value
    else if (typeof value === 'boolean') params[key] = value ? 1 : 0
  }
  return params
}

function silently(fn) {
  try {
    Promise.resolve(fn()).catch(() => {})
  } catch {
    // analytics is non-critical
  }
}

export function logToGoogleAnalytics(event, game, props) {
  if (GA_AUTOMATIC.has(event)) return
  const params = toParams(game, props)
  if (native) silently(() => FirebaseAnalytics.logEvent({ name: event, params }))
  else if (analytics) silently(() => logEvent(analytics, event, params))
}

export function setGoogleAnalyticsEnabled(enabled) {
  if (native) return silently(() => FirebaseAnalytics.setEnabled({ enabled }))
  if (enabled) enableFirebaseAnalytics()
  if (analytics) silently(() => setAnalyticsCollectionEnabled(analytics, enabled))
}

// Only identity and the internal-traffic flag: GA4 already records
// platform and app version per event.
export function setGoogleAnalyticsUser({ uid, isInternal, appVersion }) {
  const properties = { is_internal: isInternal ? 'true' : 'false' }
  if (!native && appVersion) properties.web_build = appVersion
  if (native) {
    if (uid) silently(() => FirebaseAnalytics.setUserId({ userId: uid }))
    for (const [key, value] of Object.entries(properties)) {
      silently(() => FirebaseAnalytics.setUserProperty({ key, value }))
    }
  } else if (analytics) {
    if (uid) silently(() => setUserId(analytics, uid))
    silently(() => setUserProperties(analytics, properties))
  }
}

export function resetGoogleAnalytics() {
  if (native) silently(() => FirebaseAnalytics.resetAnalyticsData())
}
