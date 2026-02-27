import { db } from '../firebase'
import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore'

function generateCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

export async function createRoom(hostId, hostName, gameSlug) {
  const code = generateCode()
  await setDoc(doc(db, 'rooms', code), {
    code,
    hostId,
    gameSlug,
    players: [{ id: hostId, name: hostName }],
    status: 'waiting',
    state: {},
    createdAt: serverTimestamp()
  })
  return code
}

export async function joinRoom(code, playerId, playerName) {
  const ref = doc(db, 'rooms', code)
  await updateDoc(ref, {
    players: arrayUnion({ id: playerId, name: playerName })
  })
}

export function subscribeToRoom(code, callback) {
  const ref = doc(db, 'rooms', code)
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) callback(snap.data())
  })
}

export async function sendRoomAction(code, action) {
  const ref = doc(db, 'rooms', code)
  await updateDoc(ref, { state: action })
}
