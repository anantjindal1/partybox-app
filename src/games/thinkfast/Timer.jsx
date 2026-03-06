/**
 * 10-second countdown timer. Uses performance.now() for accuracy within 100ms.
 * Auto-dispatches TIMEOUT when time runs out. Lightweight (no ticking sound in code).
 */
import { useEffect, useRef } from 'react'

const TOTAL_MS = 10000

export function Timer({ questionStartTime, phase, onTimeout }) {
  const rafRef = useRef(null)

  useEffect(() => {
    if (phase !== 'question_show' || !questionStartTime) return
    const start = typeof questionStartTime === 'number' ? questionStartTime : performance.now()

    function check() {
      const now = performance.now()
      const elapsed = now - start
      if (elapsed >= TOTAL_MS - 50) {
        onTimeout()
        return
      }
      rafRef.current = requestAnimationFrame(check)
    }
    rafRef.current = requestAnimationFrame(check)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [questionStartTime, phase, onTimeout])

  return null
}
