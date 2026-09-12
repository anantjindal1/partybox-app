import { SUIT_ICONS, SUIT_COLOR } from './suitIcons'

const SIZES = {
  sm: { w: 32, h: 45, rank: 'text-[10px]', suit: 14, glyph: 16 },
  md: { w: 46, h: 64, rank: 'text-xs', suit: 16, glyph: 26 },
  lg: { w: 62, h: 87, rank: 'text-sm', suit: 20, glyph: 34 }
}

/**
 * A single playing card, face-up or face-down. Size is a fixed pixel
 * footprint (not a Tailwind scale step) since cards need a precise,
 * consistent aspect ratio across hand/table/opponent-stack contexts.
 */
export function PlayingCard({ face = 'up', rank, suit, size = 'md', className = '', style }) {
  const dims = SIZES[size]
  const boxStyle = { width: dims.w, height: dims.h, ...style }

  if (face === 'down') {
    return (
      <div
        className={`rounded-md border border-maroon shadow-soft ${className}`}
        style={{
          ...boxStyle,
          background:
            'repeating-linear-gradient(45deg, var(--color-accent-maroon), var(--color-accent-maroon) 6px, var(--color-accent-gold) 6px, var(--color-accent-gold) 7px)'
        }}
      />
    )
  }

  const SuitGlyph = SUIT_ICONS[suit]
  const colorClass = SUIT_COLOR[suit] === 'cardRed' ? 'text-cardRed' : 'text-cardBlack'

  return (
    <div
      className={`rounded-md border border-border bg-cardFace shadow-soft flex flex-col justify-between p-1 ${className}`}
      style={boxStyle}
    >
      <div className={`flex flex-col items-start leading-none ${dims.rank} font-bold ${colorClass}`}>
        <span>{rank}</span>
        <SuitGlyph width={dims.suit} height={dims.suit} />
      </div>
      <div className={`flex-1 flex items-center justify-center ${colorClass}`}>
        <SuitGlyph width={dims.glyph} height={dims.glyph} />
      </div>
    </div>
  )
}
