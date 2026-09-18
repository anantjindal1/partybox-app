import { db } from '../firebase'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore'

const WORD_STATS_COL    = 'dc_word_stats'
const SESSION_STATS_COL = 'dc_session_stats'

function getWordDocId(word) {
  return word.toLowerCase().replace(/[^a-z0-9]/g, '_')
}

function getTodayId() {
  return new Date().toISOString().split('T')[0] // YYYY-MM-DD
}

/**
 * Ensure today's session doc exists, then apply dot-notation increments.
 * Uses setDoc({ merge: true }) first so updateDoc never fails on a missing doc.
 * Never throws.
 */
async function updateSessionDoc(scalarUpdates, dotNotationUpdates = {}) {
  if (!db) return
  const today = getTodayId()
  const ref = doc(db, SESSION_STATS_COL, today)
  try {
    await setDoc(ref, { date: today, ...scalarUpdates }, { merge: true })
    if (Object.keys(dotNotationUpdates).length > 0) {
      await updateDoc(ref, dotNotationUpdates)
    }
  } catch (err) {
    console.warn('[dcStats] session stats update failed:', err)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Record a word being shown to the actor.
 * Increments timesShown on dc_word_stats and wordsShown + category/difficulty
 * breakdowns on dc_session_stats.
 * Fire and forget — never throws.
 */
export async function recordWordShown(word, category, difficulty) {
  if (!db || !word) return
  try {
    // dc_word_stats — word-level tracking
    const wordRef = doc(db, WORD_STATS_COL, getWordDocId(word))
    await setDoc(
      wordRef,
      {
        word,
        category,
        difficulty,
        timesShown:  increment(1),
        lastSeen:    serverTimestamp(),
      },
      { merge: true }
    )
  } catch (err) {
    console.warn('[dcStats] recordWordShown (word) failed:', err)
  }

  // dc_session_stats — aggregate tracking
  await updateSessionDoc(
    { wordsShown: increment(1) },
    {
      [`categoryBreakdown.${category}`]:   increment(1),
      [`difficultyBreakdown.${difficulty}`]: increment(1),
    }
  )
}

/**
 * Record the outcome of a word.
 * result: 'correct' | 'skip' | 'timeout'
 * Fire and forget — never throws.
 */
export async function recordWordResult(word, category, difficulty, result) {
  if (!db || !word) return
  const wordField = { correct: 'timesCorrect', skip: 'timesSkipped', timeout: 'timesTimeout' }[result]
  const sessField = { correct: 'wordsCorrect', skip: 'wordsSkipped', timeout: 'wordsTimeout' }[result]
  if (!wordField) return

  try {
    const wordRef = doc(db, WORD_STATS_COL, getWordDocId(word))
    await setDoc(
      wordRef,
      { word, category, difficulty, [wordField]: increment(1) },
      { merge: true }
    )
  } catch (err) {
    console.warn('[dcStats] recordWordResult (word) failed:', err)
  }

  await updateSessionDoc({ [sessField]: increment(1) })
}

/**
 * Record a turn completing.
 * wordCount: how many words were shown during this turn.
 * Fire and forget — never throws.
 */
export async function recordTurnEnd(wordCount) {
  if (!db) return
  await updateSessionDoc({
    turnsPlayed:       increment(1),
    totalWordsPerTurn: increment(wordCount),
  })
}

/**
 * Record a game starting (settings confirmed, word queue built).
 * categories: string[] of category slugs; difficulty: string.
 * Fire and forget — never throws.
 */
export async function recordGameStart(categories, difficulty) {
  if (!db) return
  await updateSessionDoc({ gamesPlayed: increment(1) })
}

/**
 * Fetch all dc_word_stats documents.
 * Returns array sorted by timesShown descending.
 */
export async function getDCWordStats() {
  if (!db) return []
  try {
    const snap = await getDocs(collection(db, WORD_STATS_COL))
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.timesShown ?? 0) - (a.timesShown ?? 0))
  } catch (err) {
    console.warn('[dcStats] getDCWordStats failed:', err)
    return []
  }
}
