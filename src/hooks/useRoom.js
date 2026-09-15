import { useState, useEffect } from 'react'
import { subscribeToRoom } from '../services/room'

export function useRoom(code) {
  const [room, setRoom] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!code) return
    const unsub = subscribeToRoom(code, (r) => {
      setRoom(r)
      setLoaded(true)
    })
    return unsub
  }, [code])

  // Distinct from "room is null because we haven't heard back yet" —
  // this only becomes true once a real snapshot has confirmed the room
  // doesn't exist (deleted, or the code never matched anything).
  const notFound = loaded && !room

  return { room, notFound }
}
