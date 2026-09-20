/**
 * PartyBox-specific wiring for the portable src/lib/analytics module.
 * This is the ONLY file that connects the generic analytics core to this
 * app's Firebase instance and device-identity system — everything else
 * (Room.jsx, individual games) imports from src/lib/analytics directly.
 */
import { db, enableFirebaseAnalytics } from '../firebase'
import { getConsent, subscribeConsent } from '../lib/consent'
import { configureAnalytics, startSession } from '../lib/analytics/core'
import { getDeviceId } from './profile'

let _initialized = false

export function initAnalytics() {
  if (_initialized) return
  _initialized = true
  configureAnalytics({
    db,
    getDeviceId: () => getDeviceId(),
    // Lets endSession() use sendBeacon on tab-close, which a normal async
    // Firestore write can't reliably survive — see core.js's configureAnalytics
    // doc comment. Falls back to best-effort if either env var is missing.
    restBeacon: {
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    },
  })
  startSession()

  const enableIfConsented = () => { if (getConsent() === 'granted') enableFirebaseAnalytics() }
  enableIfConsented()
  subscribeConsent(enableIfConsented)
}
