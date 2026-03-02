import { db } from '../firebase'
import { doc, setDoc, increment } from 'firebase/firestore'
import { getProfile } from './profile'

/**
 * Writes per-game stats to /profiles/{userId}/stats/{gameSlug}.
 * Uses Firestore increment() so concurrent writes are safe.
 *
 * @param {string} slug - game slug (e.g. 'lucky-number')
 * @param {{ won: boolean, gamesPlayed?: number }} stats
 */
export async function writeGameStats(slug, { won, gamesPlayed = 1 }) {
  if (!db) return
  const profile = await getProfile()
  const ref = doc(db, 'profiles', profile.id, 'stats', slug)
  await setDoc(
    ref,
    { wins: increment(won ? 1 : 0), gamesPlayed: increment(gamesPlayed) },
    { merge: true }
  )
}
