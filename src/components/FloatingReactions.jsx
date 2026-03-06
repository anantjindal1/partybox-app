import { useState, useEffect } from 'react'

const FLOAT_DURATION_MS = 2500
const H_OFFSETS = [-80, 0, 80, -40, 40, -120, 120]

export default function FloatingReactions({ reactions }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(true)
    const t = setTimeout(() => setVisible(false), FLOAT_DURATION_MS)
    return () => clearTimeout(t)
  }, [reactions])

  if (!visible || !reactions?.length) return null

  return (
    <>
      <style>{`
        @keyframes rfbFloatUp {
          0%   { opacity: 1;   transform: translateY(0)     scale(1.2); }
          70%  { opacity: 0.9; transform: translateY(-110px) scale(1.4); }
          100% { opacity: 0;   transform: translateY(-170px) scale(0.8); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        {reactions.map((r, i) => (
          <div
            key={`${r.playerId}-${i}`}
            style={{
              position: 'absolute',
              bottom: '90px',
              left: `calc(50% + ${H_OFFSETS[i % H_OFFSETS.length]}px)`,
              fontSize: '2.2rem',
              lineHeight: 1,
              animation: `rfbFloatUp 2.5s ease-out ${i * 200}ms both`,
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>
    </>
  )
}
