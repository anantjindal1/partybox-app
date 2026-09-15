import { PlayingCard } from './PlayingCard'
import { parseCard } from '../../multiplayer/deck'
import { getHandStep } from './seatLayout'

const EXPOSED_CARD_WIDTH = 32
const EXPOSED_TARGET_WIDTH = 150
// The front seat sits centered above the table with the same open room
// "my hand" gets below it — no reason to cram it into the same narrow
// width the left/right rows need to avoid running off a phone's edge.
// Scaled from HAND_CARD_WIDTH's own 340 target by the sm/md card-width
// ratio, so the fan reads with roughly the same density as a real hand.
const EXPOSED_FRONT_TARGET_WIDTH = 240

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
 * `exposedHandSide` ('front' | 'left' | 'right', default 'front') controls
 * which way that fan grows: a "front" seat (the one opposite the viewer)
 * grows UPWARD, into the open margin above the table, since growing
 * downward would run straight into the center play area; a "left"/"right"
 * seat instead wraps into two shorter rows below the avatar, since there's
 * no equivalent open margin to its side on a narrow phone screen.
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
  exposedHandSide = 'front',
  style,
  className = '',
  onExposedCardTap,
  disabledExposedCardIds = [],
  highlightedExposedCardIds = [],
  selectedExposedCardIds = []
}) {
  const glowStyle = isActiveTurn ? { '--turn-glow-color': `rgb(var(--color-accent-${accent}-rgb))` } : {}
  const interactive = !!onExposedCardTap

  function renderFanRow(cards, targetWidth = EXPOSED_TARGET_WIDTH) {
    const step = getHandStep(cards.length, EXPOSED_CARD_WIDTH, targetWidth)
    return (
      <div className="flex items-end w-max mx-auto">
        {cards.map((cardId, i) => {
          const { rank, suit } = parseCard(cardId)
          const isDisabled = disabledExposedCardIds.includes(cardId)
          const isHighlighted = highlightedExposedCardIds.includes(cardId)
          const isSelected = selectedExposedCardIds.includes(cardId)
          const Wrapper = interactive ? 'button' : 'div'
          return (
            <Wrapper
              key={cardId}
              type={interactive ? 'button' : undefined}
              disabled={interactive ? isDisabled : undefined}
              onClick={interactive ? () => onExposedCardTap(cardId) : undefined}
              className={`transition-transform duration-150 ${isDisabled ? 'grayscale opacity-40 pointer-events-none' : ''}`}
              style={{
                marginLeft: i === 0 ? 0 : step - EXPOSED_CARD_WIDTH,
                transform: isSelected ? 'translateY(-8px)' : undefined,
                zIndex: isSelected ? 50 : i
              }}
            >
              <PlayingCard
                face="up"
                rank={rank}
                suit={suit}
                size="sm"
                highlighted={isHighlighted}
              />
            </Wrapper>
          )
        })}
      </div>
    )
  }

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
      <span
        className={`text-xs truncate max-w-[64px] ${isActiveTurn ? 'font-extrabold' : 'font-semibold text-textPrimary'}`}
        style={isActiveTurn ? { color: `rgb(var(--color-accent-${accent}-rgb))` } : undefined}
      >
        {player?.name ?? 'Player'}
      </span>
      {label && <span className="text-[10px] text-textMuted -mt-1">{label}</span>}
      {exposedCards ? (
        // Absolutely positioned (not in normal flow) so a large exposed
        // hand doesn't inflate this seat's own height — CardTable centers
        // each seat wrapper on its avatar+name via -translate-y-1/2, and a
        // 12-card grid counted in that height would push the anchor (and
        // everything above it, like a game's score bar) far off target.
        exposedHandSide === 'front' ? (
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2">
            {renderFanRow(exposedCards, EXPOSED_FRONT_TARGET_WIDTH)}
          </div>
        ) : (
          // Anchored from the edge nearer this seat's own position (not
          // centered) and growing toward the table's center — a side seat
          // already sits close to the screen edge, so centering a
          // multi-card fan under it would push cards straight off-screen.
          <div
            className={`absolute top-full mt-1 flex flex-col gap-1 ${
              exposedHandSide === 'left' ? 'left-0' : 'right-0'
            }`}
          >
            {renderFanRow(exposedCards.slice(0, Math.ceil(exposedCards.length / 2)))}
            {renderFanRow(exposedCards.slice(Math.ceil(exposedCards.length / 2)))}
          </div>
        )
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
