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

export async function createRoom(hostId, hostName, gameSlug, hostAvatar, roomType = 'casual') {
  const code = generateCode()
  await setDoc(doc(db, 'rooms', code), {
    code,
    hostId,
    gameSlug,
    roomType,
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
    // Always call back, even when the doc is gone — a caller that only
    // hears about existence can't tell "no snapshot yet" (still
    // connecting) apart from "confirmed deleted" (host ended the game),
    // and silently swallowing the latter is what left a client that
    // reconnects after deletion stuck on "Connecting..." forever.
    callback(snap.exists() ? snap.data() : null)
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
  await setDoc(ref, {
    playerId,
    type: action.type,
    payload: action.payload,
    createdAt: serverTimestamp()
  })
}

export async function deleteAction(code, playerId) {
  await deleteDoc(doc(db, 'rooms', code, 'actions', playerId))
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

export async function joinAsSpectator(code, id, name, avatar) {
  const ref = doc(db, 'rooms', code)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('room-not-found')
  const room = snap.data()
  if (isRoomExpired(room)) throw new Error('room-expired')
  await updateDoc(ref, {
    spectators: arrayUnion({ id, name, avatar: avatar ?? '🎲' })
  })
}

// Voluntarily giving up a seat mid-series (between hands only — each
// game's own UI gates when this is offered). The seat's id stays in
// the game's turnOrder untouched; openSeats is just a marker that lets
// every game's UI show "empty seat" for it and block dealing the next
// hand until claimSeat below fills it back in.
export async function leaveSeat(code, playerId) {
  const ref = doc(db, 'rooms', code)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const room = snap.data()
  const player = room.players.find(p => p.id === playerId)
  if (!player) return
  const updates = {
    players: arrayRemove(player),
    spectators: arrayUnion(player),
    openSeats: arrayUnion(playerId)
  }
  // The host taking a seat with them would otherwise leave every host-
  // only control (kick, end game, deal the next hand) permanently stuck
  // to someone who's now just a spectator — hand it to whoever's left.
  if (room.hostId === playerId) {
    const nextHost = room.players.find(p => p.id !== playerId)
    if (nextHost) updates.hostId = nextHost.id
  }
  await updateDoc(ref, updates)
}

// A spectator taking over an open seat. `statePatch` lets the calling
// game remap any of its OWN state fields that reference the departed
// player's id beyond turnOrder itself (e.g. Teri's shufflerId, if the
// person who left happened to hold that role) — this function only
// knows about the generic players/spectators/openSeats bookkeeping,
// never a specific game's state shape.
export async function claimSeat(code, spectatorId, spectatorName, spectatorAvatar, seatPlayerId, statePatch = {}) {
  const ref = doc(db, 'rooms', code)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const room = snap.data()
  const spectator = (room.spectators ?? []).find(p => p.id === spectatorId)
  const updates = {
    players: arrayUnion({ id: spectatorId, name: spectatorName, avatar: spectatorAvatar ?? '🎲' }),
    openSeats: arrayRemove(seatPlayerId)
  }
  if (spectator) updates.spectators = arrayRemove(spectator)
  for (const [key, value] of Object.entries(statePatch)) {
    updates[`state.${key}`] = value
  }
  await updateDoc(ref, updates)
}

export async function kickSpectator(code, id) {
  const ref = doc(db, 'rooms', code)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const room = snap.data()
  const spectator = (room.spectators ?? []).find(p => p.id === id)
  if (!spectator) return
  await updateDoc(ref, { spectators: arrayRemove(spectator) })
}

// Deprecated — use updateRoomState instead
export async function sendRoomAction(code, action) {
  return updateRoomState(code, action)
}
