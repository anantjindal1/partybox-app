import { useEffect, useRef, useState } from 'react'

/**
 * 10-second countdown for Spot the Jugaad. Uses requestAnimationFrame + performance.now() for accuracy.
 * Calls onEnd() when time runs out. Lightweight, no heavy animation lib.
 */
const TOTAL_MS = 10000

export function Timer({ running, onEnd }) {
  const [timeLeft, setTimeLeft] = useState(TOTAL_MS)
  const startRef = useRef(null)
  const rafRef = useRef(null)
  const firedRef = useRef(false)
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  useEffect(() => {
    if (!running) {
      setTimeLeft(TOTAL_MS)
      startRef.current = null
      firedRef.current = false
      return
    }
    startRef.current = performance.now()
    firedRef.current = false

    function tick(now) {
      const start = startRef.current
      if (start == null) return
      const elapsed = now - start
      const remaining = Math.max(0, TOTAL_MS - elapsed)
      setTimeLeft(Math.ceil(remaining / 1000) * 1000)
      if (remaining <= 0) {
        if (!firedRef.current) {
          firedRef.current = true
          onEndRef.current()
        }
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [running])

  const seconds = Math.ceil(timeLeft / 1000)
  const pct = (timeLeft / TOTAL_MS) * 100

  return (
    <div className="flex flex-col items-center gap-2" aria-label={`${seconds} seconds remaining`}>
      <div className="w-20 h-20 rounded-full border-4 border-zinc-700 flex items-center justify-center bg-zinc-800/80">
        <span className="text-2xl font-black tabular-nums text-amber-400">{seconds}</span>
      </div>
      <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden max-w-[200px]">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-100"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
