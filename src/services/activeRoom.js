import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { isRoomExpired } from './room'
import { getDeviceId } from './profile'

const KEY = 'partybox_active_room'

// The online table this device is seated at. Android kills a backgrounded
// WebView freely (a call, WhatsApp), and a cold start always opens at "/" —
// this is what lets the app find its way back to the table.
export function rememberActiveRoom(code) {
  try { localStorage.setItem(KEY, code) } catch { /* storage unavailable */ }
}

export function forgetActiveRoom(code) {
  try {
    if (!code || localStorage.getItem(KEY) === code) localStorage.removeItem(KEY)
  } catch { /* storage unavailable */ }
}

export function isRejoinable(room, playerId) {
  if (!room || isRoomExpired(room)) return false
  if (room.state?.phase === 'results') return false
  return (room.players ?? []).some(p => p.id === playerId)
}

// Resolves to the remembered room if this device still holds a seat in it,
// otherwise clears the stale marker and resolves to null.
export async function findActiveRoom() {
  let code
  try { code = localStorage.getItem(KEY) } catch { return null }
  if (!code) return null
  try {
    const snap = await getDoc(doc(db, 'rooms', code))
    const room = snap.exists() ? snap.data() : null
    if (isRejoinable(room, getDeviceId())) return room
  } catch {
    return null
  }
  forgetActiveRoom(code)
  return null
}
