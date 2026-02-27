import { useState, useEffect } from 'react'
import { subscribeToRoom } from '../services/room'

export function useRoom(code) {
  const [room, setRoom] = useState(null)

  useEffect(() => {
    if (!code) return
    const unsub = subscribeToRoom(code, setRoom)
    return unsub
  }, [code])

  return room
}
