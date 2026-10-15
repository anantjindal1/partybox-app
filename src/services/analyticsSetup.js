/**
 * PartyBox-specific wiring for the portable src/lib/analytics module.
 * This is the ONLY file that connects the generic analytics core to this
 * app's Firebase instance and device-identity system — everything else
 * (Room.jsx, individual games) imports from src/lib/analytics directly.
 */
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { db, auth, enableFirebaseAnalytics } from '../firebase'
import { getConsent, subscribeConsent } from '../lib/consent'
import { configureAnalytics, onConsentChange, startSession, trackEvent } from '../lib/analytics/core'
import { getDeviceId, isTestIdentity, wasDeviceIdCreatedThisLoad } from './profile'

const INTERNAL_KEY = 'partybox_internal'
const AUTH_WAIT_MS = 3000

let _initialized = false

function getPlatform() {
  if (Capacitor.isNativePlatform()) return `${Capacitor.getPlatform()}_app`
  if (window.matchMedia?.('(display-mode: standalone)').matches) return 'pwa'
  return 'web'
}

// Visiting any page with ?internal=1 marks this device as yours for good,
// so dashboards can exclude it; ?internal=0 undoes it.
function isInternal() {
  try {
    const flag = new URLSearchParams(window.location.search).get('internal')
    if (flag === '1') localStorage.setItem(INTERNAL_KEY, '1')
    if (flag === '0') localStorage.removeItem(INTERNAL_KEY)
    return import.meta.env.DEV || isTestIdentity() || localStorage.getItem(INTERNAL_KEY) === '1'
  } catch {
    return false
  }
}

const appVersionPromise = Capacitor.isNativePlatform()
  ? App.getInfo().then(info => `${info.version} (${info.build})`).catch(() => null)
  : Promise.resolve(typeof __APP_BUILD__ !== 'undefined' ? __APP_BUILD__ : null)

// Anonymous sign-in is async; wait briefly so early events (session_start)
// still carry the uid, but never hold analytics hostage to auth.
const uidPromise = auth
  ? Promise.race([
      auth.authStateReady().then(() => auth.currentUser?.uid ?? null),
      new Promise(resolve => setTimeout(() => resolve(null), AUTH_WAIT_MS)),
    ]).catch(() => null)
  : Promise.resolve(null)

async function getCommonProps() {
  const [uid, appVersion] = await Promise.all([uidPromise, appVersionPromise])
  return { uid: auth?.currentUser?.uid ?? uid, appVersion, isInternal: isInternal() }
}

function consentGiven() {
  const consent = getConsent()
  return consent === null ? null : consent === 'granted'
}

export function initAnalytics() {
  if (_initialized) return
  _initialized = true
  configureAnalytics({
    db,
    getDeviceId: () => getDeviceId(),
    getPlatform,
    getCommonProps,
    getConsent: consentGiven,
    // Lets endSession() use sendBeacon on tab-close, which a normal async
    // Firestore write can't reliably survive — see core.js's configureAnalytics
    // doc comment. Falls back to best-effort if either env var is missing.
    restBeacon: {
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    },
  })
  startSession()
  if (wasDeviceIdCreatedThisLoad()) trackEvent('first_open', null)

  const enableIfConsented = () => { if (getConsent() === 'granted') enableFirebaseAnalytics() }
  enableIfConsented()
  subscribeConsent(() => {
    enableIfConsented()
    onConsentChange()
  })
}
