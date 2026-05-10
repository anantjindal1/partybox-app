import { useState, useEffect, useRef, useCallback } from 'react'
import { db } from '../firebase'
import { doc, setDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore'
import FloatingReactions from './FloatingReactions'

const EMOJIS = ['😂', '🔥', '😮', '👏', '😭', '❤️']
const RATE_LIMIT_MS = 3000
const EXPIRE_MS = 5000

export function ReactionBar({ roomCode }) {
  const [floatingBurst, setFloatingBurst] = useState([])
  const [cooldown, setCooldown] = useState(false)
  const seenRef = useRef(new Set())
  const myId = localStorage.getItem('partybox_device_id')

  useEffect(() => {
    if (!db || !roomCode) return
    const ref = collection(db, 'rooms', roomCode, 'reactions')
    return onSnapshot(ref, snap => {
      const now = Date.now()
      const fresh = []
      snap.docs.forEach(d => {
        const r = d.data()
        if (!r.createdAt?.toMillis) return
        if (now - r.createdAt.toMillis() > EXPIRE_MS) return
        const key = `${r.playerId}-${r.createdAt.seconds}`
        if (seenRef.current.has(key)) return
        seenRef.current.add(key)
        fresh.push(r)
      })
      if (fresh.length > 0) {
        setFloatingBurst(fresh.slice(-3))
      }
    })
  }, [roomCode])

  const sendReaction = useCallback(async (emoji) => {
    if (!db || !myId || !roomCode || cooldown) return
    setCooldown(true)
    setTimeout(() => setCooldown(false), RATE_LIMIT_MS)
    try {
      await setDoc(doc(db, 'rooms', roomCode, 'reactions', myId), {
        emoji,
        playerId: myId,
        createdAt: serverTimestamp(),
      })
    } catch {
      // fire-and-forget
    }
  }, [roomCode, myId, cooldown])

  if (!db || !roomCode) return null

  return (
    <>
      <FloatingReactions reactions={floatingBurst} />
      <div className="flex justify-center gap-4 px-4 py-2">
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            disabled={cooldown}
            className={`text-2xl transition-transform active:scale-125 ${cooldown ? 'opacity-40' : 'hover:scale-110'}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  )
}
