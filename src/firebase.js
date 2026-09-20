import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Only initialize Firebase when config is provided — app runs offline-only without it
let app = null
let db = null
let analytics = null
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
  } catch (e) {
    console.warn('Firebase init failed — running in offline-only mode', e)
  }
}

// Google Analytics only starts once the user has accepted it (see
// lib/consent.js) — `analytics` stays null, and trackEvent a no-op, until then.
export function enableFirebaseAnalytics() {
  if (analytics || !app || !firebaseConfig.measurementId) return
  try {
    analytics = getAnalytics(app)
  } catch (e) {
    console.warn('Firebase Analytics init failed', e)
  }
}

export { db, analytics }
