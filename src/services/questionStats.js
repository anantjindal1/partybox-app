import { db } from '../firebase'
import {
  collection,
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { increment } from 'firebase/firestore'

const COLLECTION = 'question_stats'

function getQuestionId(q) {
  if (q.id) return q.id
  return q.question
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 40)
}

/**
 * Record that a batch of questions were shown to players.
 * source: 'firstbell' | 'thinkfast'
 * Never throws — tracking must never break the game.
 */
export async function recordQuestionsShown(questions, source) {
  if (!db || !questions?.length) return
  try {
    const batch = writeBatch(db)
    for (const q of questions) {
      const id = getQuestionId(q)
      const ref = doc(db, COLLECTION, id)
      batch.set(
        ref,
        {
          count: increment(1),
          question: (q.question ?? '').substring(0, 80),
          category: q.category ?? 'unknown',
          source,
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      )
    }
    await batch.commit()
  } catch (err) {
    console.warn('[questionStats] Failed to record questions shown:', err)
  }
}

/**
 * Fetch all question stats, sorted by count descending.
 * Returns [{ id, question, category, count, lastSeen }]
 */
export async function getQuestionStats() {
  if (!db) return []
  try {
    const snap = await getDocs(collection(db, COLLECTION))
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
  } catch (err) {
    console.warn('[questionStats] Failed to fetch stats:', err)
    return []
  }
}
