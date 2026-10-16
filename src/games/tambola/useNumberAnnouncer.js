import { useEffect, useRef, useState } from 'react'

const MUTE_KEY = 'partybox_tambola_tts_muted'

// lang 'hi' reads numbers in Hindi (needs a Hindi voice on the device; most
// Android phones have one, otherwise the browser falls back to its default).
export function useNumberAnnouncer(currentNumber, lang = 'en') {
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === 'true')
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const lastAnnounced = useRef(null)

  useEffect(() => {
    if (!supported || muted) return
    if (currentNumber == null || currentNumber === lastAnnounced.current) return
    lastAnnounced.current = currentNumber
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(String(currentNumber))
      if (lang === 'hi') utterance.lang = 'hi-IN'
      window.speechSynthesis.speak(utterance)
    } catch {
      // Some webviews advertise speechSynthesis but throw on use — never block the game.
    }
  }, [currentNumber, muted, supported, lang])

  function toggleMuted() {
    setMuted(prev => {
      const next = !prev
      localStorage.setItem(MUTE_KEY, String(next))
      return next
    })
  }

  return { muted, toggleMuted, supported }
}
