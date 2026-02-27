/**
 * 60-second countdown. Uses Date.now() — roundStartTime must also be Date.now().
 * Auto-calls onTimeout when time runs out. Renders nothing (display is in RoundScreen).
 */
import { useEffect, useRef } from 'react'

const TOTAL_MS = 60000

export function Timer({ roundStartTime, phase, onTimeout }) {
  const intervalRef = useRef(null)
  const calledRef = useRef(false)

  useEffect(() => {
    calledRef.current = false
  }, [roundStartTime])

  useEffect(() => {
    if (phase !== 'round_active' || !roundStartTime) return

    function check() {
      const elapsed = Date.now() - roundStartTime
      if (elapsed >= TOTAL_MS - 100 && !calledRef.current) {
        calledRef.current = true
        onTimeout()
      }
    }

    intervalRef.current = setInterval(check, 200)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [roundStartTime, phase, onTimeout])

  return null
}
