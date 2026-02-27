import { getDB } from './db'
import { getProfile, saveProfile } from './profile'
import { db } from '../firebase'
import { doc, setDoc } from 'firebase/firestore'
import { generateId } from '../utils/id'

export async function awardXP(amount) {
  // 1. Write locally
  const profile = await getProfile()
  const updated = await saveProfile({ xp: profile.xp + amount })

  // 2. Queue sync
  const idb = await getDB()
  await idb.put('syncQueue', { id: generateId(), userId: profile.id, xp: updated.xp, ts: Date.now() })

  // 3. Attempt sync if online
  if (navigator.onLine) await syncXP()

  return updated.xp
}

export async function syncXP() {
  if (!db) return  // Firebase not configured — skip sync
  const idb = await getDB()
  const queue = await idb.getAll('syncQueue')
  if (!queue.length) return

  const profile = await getProfile()
  try {
    await setDoc(doc(db, 'profiles', profile.id), { xp: profile.xp }, { merge: true })
    for (const item of queue) await idb.delete('syncQueue', item.id)
  } catch (e) {
    // Silent fail — will retry on next online event
  }
}
