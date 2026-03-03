import { useState, useEffect, useRef } from 'react'

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.8)
    setTimeout(() => ctx.close(), 1000)
  } catch (_) {}
}

export function Timer({ seconds, running, onEnd, devMode = false, onForceEnd }) {
  const [timeLeft, setTimeLeft] = useState(seconds)
  const endFiredRef = useRef(false)

  // Reset when seconds prop changes (new round)
  useEffect(() => {
    setTimeLeft(seconds)
    endFiredRef.current = false
  }, [seconds])

  useEffect(() => {
    if (!running) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          if (!endFiredRef.current) {
            endFiredRef.current = true
            playBeep()
            navigator.vibrate?.([200, 100, 200, 100, 200])
            onEnd()
          }
          return 0
        }
        if (prev <= 5) navigator.vibrate?.(50)
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [running, onEnd])

  const pct = seconds > 0 ? (timeLeft / seconds) * 100 : 0
  const isUrgent = timeLeft <= 10
  const color = timeLeft > 20 ? '#22c55e' : timeLeft > 10 ? '#f59e0b' : '#ef4444'
  const r = 44
  const circ = 2 * Math.PI * r

  return (
    <div className="relative flex flex-col items-center">
      <div className={`relative inline-flex items-center justify-center ${isUrgent ? 'animate-pulse' : ''}`}>
        <svg width="100" height="100" className="-rotate-90" aria-label={`${timeLeft} seconds remaining`}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s' }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-2xl font-black tabular-nums"
          style={{ color }}
        >
          {timeLeft}
        </span>
      </div>
      {devMode && onForceEnd && (
        <button
          onClick={onForceEnd}
          className="mt-2 px-4 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold"
        >
          ⚡ End Timer
        </button>
      )}
    </div>
  )
}
