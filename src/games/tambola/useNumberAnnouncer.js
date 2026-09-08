import { useEffect, useRef, useState } from 'react'

const MUTE_KEY = 'partybox_tambola_tts_muted'

export function useNumberAnnouncer(currentNumber) {
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === 'true')
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const lastAnnounced = useRef(null)

  useEffect(() => {
    if (!supported || muted) return
    if (currentNumber == null || currentNumber === lastAnnounced.current) return
    lastAnnounced.current = currentNumber
    try {
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(String(currentNumber)))
    } catch {
      // Some webviews advertise speechSynthesis but throw on use — never block the game.
    }
  }, [currentNumber, muted, supported])

  function toggleMuted() {
    setMuted(prev => {
      const next = !prev
      localStorage.setItem(MUTE_KEY, String(next))
      return next
    })
  }

  return { muted, toggleMuted, supported }
}
