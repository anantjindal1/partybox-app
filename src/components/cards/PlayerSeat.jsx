import { PlayingCard } from './PlayingCard'

/**
 * One opponent's seat: avatar, name, a shallow face-down card stack (always
 * 3 backs regardless of real hand size — suggests "a hand" without
 * rendering N overlapping cards) plus the real count, and a glowing border
 * when it's this player's turn. `accent` is the owning game's accent color
 * name (e.g. 'gold') — this component is shared across many future games,
 * so it never hard-codes a color.
 */
export function PlayerSeat({ player, cardCount, isActiveTurn, accent = 'maroon', label, style, className = '' }) {
  const glowStyle = isActiveTurn ? { '--turn-glow-color': `rgb(var(--color-accent-${accent}-rgb))` } : {}

  return (
    <div
      className={`flex flex-col items-center gap-1 ${className}`}
      style={style}
    >
      <div
        className={`relative flex items-center justify-center w-11 h-11 rounded-full bg-surfaceElevated border-[1.5px] border-border ${isActiveTurn ? 'animate-turn-glow' : ''}`}
        style={glowStyle}
      >
        <span className="text-xl leading-none">{player?.avatar ?? '🎮'}</span>
      </div>
      <span className="text-xs font-semibold text-textPrimary truncate max-w-[64px]">{player?.name ?? 'Player'}</span>
      {label && <span className="text-[10px] text-textMuted -mt-1">{label}</span>}
      <div className="relative h-[45px]" style={{ width: 32 + (Math.min(cardCount, 3) - 1) * 8 }}>
        {Array.from({ length: Math.min(cardCount, 3) }, (_, i) => (
          <PlayingCard
            key={i}
            face="down"
            size="sm"
            className="absolute top-0"
            style={{ left: i * 8 }}
          />
        ))}
        {cardCount > 0 && (
          <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-maroon text-onMaroon text-[10px] font-bold flex items-center justify-center">
            {cardCount}
          </span>
        )}
      </div>
    </div>
  )
}
