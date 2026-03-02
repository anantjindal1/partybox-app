import { useState, useEffect, useRef } from 'react'
import {
  subscribeToRoom,
  subscribeToActions,
  writeAction,
  updateRoomState,
  clearActions as clearActionsService,
  deleteRoom,
  kickPlayer as kickPlayerService,
  isRoomExpired
} from '../services/room'
import { getProfile } from '../services/profile'
import { useOnlineStatus } from './useOnlineStatus'

export function useOnlineRoom(code) {
  const [room, setRoom] = useState(null)
  const [actions, setActions] = useState([])
  const [myId, setMyId] = useState(null)
  const [expired, setExpired] = useState(false)
  const connected = useOnlineStatus()
  const expiredChecked = useRef(false)

  useEffect(() => {
    getProfile().then(p => setMyId(p.id))
  }, [])

  useEffect(() => {
    if (!code) return
    const unsub = subscribeToRoom(code, (r) => {
      if (!expiredChecked.current) {
        expiredChecked.current = true
        if (isRoomExpired(r)) {
          setExpired(true)
          return
        }
      }
      setRoom(r)
    })
    return unsub
  }, [code])

  useEffect(() => {
    if (!code) return
    const unsub = subscribeToActions(code, setActions)
    return unsub
  }, [code])

  const isHost = room && myId ? room.hostId === myId : false
  const roomState = room?.state ?? {}
  const players = room?.players ?? []

  async function sendAction(action) {
    if (!myId) return
    await writeAction(code, myId, action)
  }

  async function setState(newState) {
    await updateRoomState(code, newState)
  }

  async function clearActions() {
    await clearActionsService(code)
  }

  async function endGame() {
    await deleteRoom(code)
  }

  async function kickPlayer(playerId) {
    await kickPlayerService(code, playerId)
  }

  return {
    room,
    roomState,
    actions,
    sendAction,
    setState,
    clearActions,
    endGame,
    kickPlayer,
    isHost,
    players,
    connected,
    expired,
    myId
  }
}
