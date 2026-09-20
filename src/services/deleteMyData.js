import { db } from '../firebase'
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore'
import { getDeviceId } from './profile'

const BATCH_LIMIT = 400

async function deleteAll(refs) {
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    refs.slice(i, i + BATCH_LIMIT).forEach(ref => batch.delete(ref))
    await batch.commit()
  }
}

/**
 * Erases everything PartyBox holds about this device — the synced profile
 * and per-game stats, the analytics device record and its events — then
 * clears local storage so the next visit starts as a brand-new device.
 * Room data is not touched: it belongs to the room and expires on its own.
 */
export async function deleteMyData() {
  const deviceId = getDeviceId()
  if (db) {
    const [stats, events] = await Promise.all([
      getDocs(collection(db, 'profiles', deviceId, 'stats')),
      getDocs(query(collection(db, 'analytics_events'), where('deviceId', '==', deviceId)))
    ])
    await deleteAll([
      ...stats.docs.map(d => d.ref),
      ...events.docs.map(d => d.ref),
      doc(db, 'profiles', deviceId),
      doc(db, 'analytics_devices', deviceId)
    ])
  }
  localStorage.clear()
  sessionStorage.clear()
  await new Promise(resolve => {
    const request = indexedDB.deleteDatabase('partybox')
    request.onsuccess = request.onerror = request.onblocked = () => resolve()
  })
}
