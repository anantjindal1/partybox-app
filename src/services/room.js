import { db } from '../firebase'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore'

const ROOM_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours

function generateCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

export function isRoomExpired(room) {
  if (!room?.createdAt?.toMillis) return false
  return Date.now() - room.createdAt.toMillis() > ROOM_TTL_MS
}

export async function createRoom(hostId, hostName, gameSlug, hostAvatar) {
  const code = generateCode()
  await setDoc(doc(db, 'rooms', code), {
    code,
    hostId,
    gameSlug,
    players: [{ id: hostId, name: hostName, avatar: hostAvatar ?? '🎲' }],
    status: 'waiting',
    state: {},
    createdAt: serverTimestamp()
  })
  return code
}

export async function joinRoom(code, playerId, playerName, playerAvatar) {
  const ref = doc(db, 'rooms', code)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('room-not-found')
  const room = snap.data()
  if (isRoomExpired(room)) throw new Error('room-expired')
  await updateDoc(ref, {
    players: arrayUnion({ id: playerId, name: playerName, avatar: playerAvatar ?? '🎲' })
  })
}

export function subscribeToRoom(code, callback) {
  const ref = doc(db, 'rooms', code)
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) callback(snap.data())
  })
}

export function subscribeToActions(code, callback) {
  const ref = collection(db, 'rooms', code, 'actions')
  return onSnapshot(ref, (snap) => {
    const actions = snap.docs.map(d => d.data())
    callback(actions)
  })
}

export async function writeAction(code, playerId, action) {
  const ref = doc(db, 'rooms', code, 'actions', playerId)
  await setDoc(ref, { playerId, action, ts: serverTimestamp() })
}

export async function clearActions(code) {
  const ref = collection(db, 'rooms', code, 'actions')
  const snap = await getDocs(ref)
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

export async function updateRoomState(code, state) {
  const ref = doc(db, 'rooms', code)
  await updateDoc(ref, { state })
}

export async function deleteRoom(code) {
  await deleteDoc(doc(db, 'rooms', code))
}

export async function kickPlayer(code, playerId) {
  const ref = doc(db, 'rooms', code)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const room = snap.data()
  const player = room.players.find(p => p.id === playerId)
  if (!player) return
  await updateDoc(ref, { players: arrayRemove(player) })
}

// Deprecated — use updateRoomState instead
export async function sendRoomAction(code, action) {
  return updateRoomState(code, action)
}
