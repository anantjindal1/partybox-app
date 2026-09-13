import { PlayingCard } from './PlayingCard'
import { parseCard } from '../../multiplayer/deck'
import { getHandStep } from './seatLayout'

const EXPOSED_CARD_WIDTH = 32
const EXPOSED_TARGET_WIDTH = 150

/**
 * One opponent's seat: avatar, name, a shallow face-down card stack (always
 * 3 backs regardless of real hand size — suggests "a hand" without
 * rendering N overlapping cards) plus the real count, and a glowing border
 * when it's this player's turn. `accent` is the owning game's accent color
 * name (e.g. 'gold') — this component is shared across many future games,
 * so it never hard-codes a color. `exposedCards` (optional array of card
 * ids) renders this seat's actual hand face-up, fanned the same way a
 * player's own hand is (overlapping, not laid out flat) — for a dummy-hand
 * rule (e.g. Teri) where a partner's cards are visible to everyone.
 * `onExposedCardTap` (optional) makes that fan directly tappable — used
 * when GameLead is playing a card on the dummy's behalf; omitted, the
 * exposed hand is a pure display with no interaction. Default `undefined`
 * for all of these — every other game's face-down rendering is unchanged.
 */
export function PlayerSeat({
  player,
  cardCount,
  isActiveTurn,
  accent = 'maroon',
  label,
  exposedCards,
  style,
  className = '',
  onExposedCardTap,
  disabledExposedCardIds = [],
  highlightedExposedCardIds = [],
  selectedExposedCardIds = []
}) {
  const glowStyle = isActiveTurn ? { '--turn-glow-color': `rgb(var(--color-accent-${accent}-rgb))` } : {}
  const exposedStep = exposedCards ? getHandStep(exposedCards.length, EXPOSED_CARD_WIDTH, EXPOSED_TARGET_WIDTH) : 0

  return (
    <div
      className={`relative flex flex-col items-center gap-1 ${className}`}
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
      {exposedCards ? (
        // Absolutely positioned (not in normal flow) so a large exposed
        // hand doesn't inflate this seat's own height — CardTable centers
        // each seat wrapper on its avatar+name via -translate-y-1/2, and a
        // 12-card grid counted in that height would push the anchor (and
        // everything above it, like a game's score bar) far off target.
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 flex items-end w-max">
          {exposedCards.map((cardId, i) => {
            const { rank, suit } = parseCard(cardId)
            const isDisabled = disabledExposedCardIds.includes(cardId)
            const isHighlighted = highlightedExposedCardIds.includes(cardId)
            const isSelected = selectedExposedCardIds.includes(cardId)
            const interactive = !!onExposedCardTap
            const Wrapper = interactive ? 'button' : 'div'
            return (
              <Wrapper
                key={cardId}
                type={interactive ? 'button' : undefined}
                disabled={interactive ? isDisabled : undefined}
                onClick={interactive ? () => onExposedCardTap(cardId) : undefined}
                className={`transition-transform duration-150 ${isDisabled ? 'grayscale opacity-40 pointer-events-none' : ''}`}
                style={{
                  marginLeft: i === 0 ? 0 : exposedStep - EXPOSED_CARD_WIDTH,
                  transform: isSelected ? 'translateY(-8px)' : undefined,
                  zIndex: isSelected ? 50 : i
                }}
              >
                <PlayingCard
                  face="up"
                  rank={rank}
                  suit={suit}
                  size="sm"
                  className={isHighlighted ? 'shadow-[0_0_0_2px_var(--color-accent-gold)]' : ''}
                />
              </Wrapper>
            )
          })}
        </div>
      ) : (
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
      )}
    </div>
  )
}
