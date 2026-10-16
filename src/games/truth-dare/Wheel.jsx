import { useEffect, useRef, useState } from 'react'
import { SPIN_MS, segmentAt } from './logic'

const R = 96
const point = (deg, r) => {
  const a = (deg * Math.PI) / 180
  return [Math.sin(a) * r, -Math.cos(a) * r]
}

const FILLS = [
  { fill: 'var(--color-accent-rose)', ink: 'var(--on-rose)' },
  { fill: 'var(--color-surface-muted)', ink: 'var(--color-text-primary)' },
  { fill: 'rgb(var(--color-accent-rose-rgb) / 0.35)', ink: 'var(--color-text-primary)' },
]

function fillFor(i, n) {
  if (n % 2 === 1 && i === n - 1) return FILLS[2]
  return FILLS[i % 2]
}

// Static segmented wheel with a needle that spins like the bottle. `settled`
// starts at the current rotation, so a late joiner or a reload lands straight
// on the result instead of replaying the spin.
export function Wheel({ names, rotation, highlight, onSpinEnd }) {
  const n = Math.max(names.length, 1)
  const seg = 360 / n
  const [settled, setSettled] = useState(rotation)
  const animate = rotation !== settled
  const onEnd = useRef(onSpinEnd)
  onEnd.current = onSpinEnd

  useEffect(() => {
    if (rotation === settled) return
    const id = setTimeout(() => {
      setSettled(rotation)
      onEnd.current?.(rotation)
    }, SPIN_MS + 50)
    return () => clearTimeout(id)
  }, [rotation, settled])

  const landed = !animate && highlight ? segmentAt(rotation, n) : -1
  const fontSize = n <= 4 ? 13 : n <= 8 ? 11 : 9
  const maxChars = n <= 6 ? 12 : 9

  return (
    <div className="relative w-full max-w-[320px] aspect-square mx-auto overflow-hidden">
      <svg viewBox="-100 -100 200 200" className="w-full h-full">
        <circle r={R + 3} fill="var(--color-border)" />
        {names.map((name, i) => {
          const a0 = i * seg
          const a1 = (i + 1) * seg
          const [x0, y0] = point(a0, R)
          const [x1, y1] = point(a1, R)
          const { fill, ink } = fillFor(i, n)
          const mid = a0 + seg / 2
          const [tx, ty] = point(mid, R * 0.72)
          const label = name.length > maxChars ? `${name.slice(0, maxChars - 1)}…` : name
          const path = n === 1
            ? `M 0 ${-R} A ${R} ${R} 0 1 1 -0.01 ${-R} Z`
            : `M 0 0 L ${x0} ${y0} A ${R} ${R} 0 ${seg > 180 ? 1 : 0} 1 ${x1} ${y1} Z`
          return (
            <g key={i}>
              <path
                d={path}
                fill={fill}
                stroke="var(--color-surface)"
                strokeWidth="1.5"
                opacity={landed >= 0 && landed !== i ? 0.45 : 1}
              />
              <text
                x={tx}
                y={ty}
                fill={ink}
                fontSize={fontSize}
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${mid <= 180 ? mid - 90 : mid + 90} ${tx} ${ty})`}
              >
                {label}
              </text>
            </g>
          )
        })}
      </svg>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: animate ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.6, 0.15, 1)` : 'none',
        }}
      >
        <svg viewBox="-100 -100 200 200" className="w-full h-full">
          <path d="M 0 -46 L 6 -6 L -6 -6 Z" fill="var(--color-text-primary)" />
          <circle r="12" fill="var(--color-text-primary)" />
          <circle r="5" fill="var(--color-surface)" />
        </svg>
      </div>
    </div>
  )
}
