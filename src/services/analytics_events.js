/**
 * Anonymous usage analytics written to Firestore.
 * Device identity comes from the existing profile UUID — no login required.
 * This service MUST NEVER throw. All calls are fire-and-forget.
 *
 * Collections:
 *   analytics_events  — one doc per event
 *   analytics_devices — one doc per device, upserted on session start
 *   analytics_daily   — one doc per calendar day (YYYY-MM-DD)
 */
import { db } from '../firebase'
import {
  collection,
  doc,
  addDoc,
  setDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { getProfile } from './profile'

function todayStr() {
  return new Date().toISOString().substring(0, 10)
}

function simplifyPlatform() {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad/i.test(ua)) return 'ios'
  if (/windows/i.test(ua)) return 'windows'
  if (/mac/i.test(ua)) return 'mac'
  return 'other'
}

// Maps event name → analytics_daily field to increment
const DAILY_FIELD = {
  session_start:     'sessions',
  game_start:        'gamesStarted',
  game_complete:     'gamesCompleted',
  game_abandon:      'gamesAbandoned',
  rematch:           'rematches',
  question_answered: 'questionsAnswered',
}

/**
 * Track an analytics event.
 *
 * @param {string} event   One of: session_start | game_start | game_complete |
 *                         game_abandon | rematch | question_answered | question_timeout
 * @param {string|null} game  'firstbell' | 'thinkfast' | 'dumb-charades' | null
 * @param {object} props   Optional extra data
 */
export async function trackEvent(event, game, props = {}) {
  if (!db) return
  try {
    let deviceId = 'anonymous'
    try {
      const profile = await getProfile()
      if (profile?.id) deviceId = profile.id
    } catch (_) {
      // Profile unavailable — use anonymous
    }

    const today = todayStr()

    // 1. Write event document
    await addDoc(collection(db, 'analytics_events'), {
      event,
      deviceId,
      game: game ?? null,
      ts: serverTimestamp(),
      props: props ?? {},
    })

    // 2. Upsert device document
    //    sessionCount and firstSeen are only written on session_start.
    //    Note: firstSeen uses merge:true so it will update on each session_start
    //    (true "set on create only" semantics would require a transaction).
    const deviceUpdate = {
      deviceId,
      lastSeen: serverTimestamp(),
      platform: simplifyPlatform(),
    }
    if (event === 'session_start') {
      deviceUpdate.firstSeen = serverTimestamp()
      deviceUpdate.sessionCount = increment(1)
    }
    await setDoc(doc(db, 'analytics_devices', deviceId), deviceUpdate, { merge: true })

    // 3. Upsert daily document — increment only the field for this event type
    const dailyField = DAILY_FIELD[event]
    if (dailyField) {
      await setDoc(
        doc(db, 'analytics_daily', today),
        { date: today, [dailyField]: increment(1) },
        { merge: true }
      )
    }
  } catch (err) {
    console.warn('[analytics_events] trackEvent failed silently:', err)
  }
}
