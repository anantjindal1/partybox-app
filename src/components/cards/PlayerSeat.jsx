import { useState, useEffect } from 'react'
import { PlayingCard } from './PlayingCard'
import { parseCard } from '../../multiplayer/deck'
import { AiTag } from '../BotControls'
import { getHandStep } from './seatLayout'
import { useCardVariant } from './cardVariant'

// The exposed-hand fan is the ONLY one ever tapped (GameLead always sees
// the dummy at the front seat, and only GameLead gets onExposedCardTap), so
// it matches own-hand card size exactly — that's where mis-taps happen.
const EXPOSED_FRONT_CARD_WIDTH = 46
const EXPOSED_FRONT_TARGET_WIDTH = 340
const ROYAL_FRONT_CARD_WIDTH = 62

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
 * The fan grows UPWARD into the open margin above the table — only the
 * front seat ever gets one (CardTable shows a side seat's exposed hand as
 * its own row below the table instead).
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
  selectedExposedCardIds = [],
  variant: variantProp
}) {
  const variant = useCardVariant(variantProp)
  const royal = variant === 'royal'
  const glowStyle = isActiveTurn ? { '--turn-glow-color': `rgb(var(--color-accent-${accent}-rgb))` } : {}
  const interactive = !!onExposedCardTap

  // Mirrors CardTable's own-hand play-out animation exactly, so tapping
  // a card in the dummy's hand feels the same as playing from your own
  // — tied to the card actually disappearing from real data (never a
  // guessed timeout), and blocking the rest of the fan mid-animation so
  // a second tap can't race the first one's network round-trip.
  const [playingCardId, setPlayingCardId] = useState(null)
  useEffect(() => {
    if (playingCardId && !(exposedCards ?? []).includes(playingCardId)) {
      setPlayingCardId(null)
    }
  }, [exposedCards, playingCardId])

  function handleExposedTap(cardId) {
    if (playingCardId) return
    setPlayingCardId(cardId)
    onExposedCardTap(cardId)
  }

  function renderFanRow(cards, targetWidth, cardWidth, size) {
    const step = getHandStep(cards.length, cardWidth, targetWidth)
    return (
      <div className="flex items-end w-max mx-auto">
        {cards.map((cardId, i) => {
          const { rank, suit } = parseCard(cardId)
          const isDisabled = disabledExposedCardIds.includes(cardId)
          const isHighlighted = highlightedExposedCardIds.includes(cardId)
          const isSelected = selectedExposedCardIds.includes(cardId)
          const isPlaying = playingCardId === cardId
          const Wrapper = interactive ? 'button' : 'div'
          const disabledClass = !isDisabled ? '' : royal ? 'royal-dim pointer-events-none' : 'grayscale opacity-40 pointer-events-none'
          return (
            <Wrapper
              key={cardId}
              type={interactive ? 'button' : undefined}
              disabled={interactive ? (isDisabled || (!!playingCardId && !isPlaying)) : undefined}
              onClick={interactive ? () => handleExposedTap(cardId) : undefined}
              className={`${isPlaying ? 'animate-play-out' : 'transition-transform duration-150'} ${disabledClass}`}
              style={{
                marginLeft: i === 0 ? 0 : step - cardWidth,
                transform: isPlaying ? undefined : isSelected ? 'translateY(-8px)' : undefined,
                zIndex: isSelected || isPlaying ? 50 : i
              }}
            >
              <PlayingCard
                face="up"
                rank={rank}
                suit={suit}
                size={size}
                highlighted={isHighlighted}
                variant={variant}
                glow={royal && interactive && !isDisabled}
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
        className={royal
          ? `royal-avatar relative flex items-center justify-center w-11 h-11 rounded-full ${isActiveTurn ? 'royal-avatar-active' : ''}`
          : `relative flex items-center justify-center w-11 h-11 rounded-full bg-surfaceElevated border-[1.5px] border-border ${isActiveTurn ? 'animate-turn-glow' : ''}`}
        style={royal ? undefined : glowStyle}
      >
        <span className="text-xl leading-none">{player?.avatar ?? '🎮'}</span>
      </div>
      <span className="flex items-center">
        <span
          className={royal
            ? `royal-name text-[11px] truncate max-w-[80px] ${isActiveTurn ? '!text-[#f6d690]' : ''}`
            : `text-xs truncate max-w-[64px] ${isActiveTurn ? 'font-extrabold' : 'font-semibold text-textPrimary'}`}
          style={isActiveTurn && !royal ? { color: `rgb(var(--color-accent-${accent}-rgb))` } : undefined}
        >
          {player?.name ?? 'Player'}
        </span>
        {player?.isBot && <AiTag />}
      </span>
      {label && (royal
        ? (
          <span className="flex flex-wrap justify-center gap-1 max-w-[150px]">
            {label.split(' · ').map(part => (
              <span key={part} className="royal-pill text-[8.5px] px-2 py-0.5 whitespace-nowrap">{part}</span>
            ))}
          </span>
        )
        : <span className="text-[10px] text-textMuted -mt-1">{label}</span>)}
      {exposedCards ? (
        // Absolutely positioned (not in normal flow) so a large exposed
        // hand doesn't inflate this seat's own height — CardTable centers
        // each seat wrapper on its avatar+name via -translate-y-1/2, and a
        // 12-card grid counted in that height would push the anchor (and
        // everything above it, like a game's score bar) far off target.
        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2">
          {royal
            ? renderFanRow(exposedCards, EXPOSED_FRONT_TARGET_WIDTH, ROYAL_FRONT_CARD_WIDTH, 'lg')
            : renderFanRow(exposedCards, EXPOSED_FRONT_TARGET_WIDTH, EXPOSED_FRONT_CARD_WIDTH, 'md')}
        </div>
      ) : (
        <div className="relative h-[45px]" style={{ width: 32 + (Math.min(cardCount, 3) - 1) * 8 }}>
          {Array.from({ length: Math.min(cardCount, 3) }, (_, i) => (
            <PlayingCard
              key={i}
              face="down"
              size="sm"
              variant={variant}
              className="absolute top-0"
              style={{ left: i * 8 }}
            />
          ))}
          {cardCount > 0 && (
            <span className={`absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${royal ? 'royal-gold-pill !rounded-full !tracking-normal !px-1' : 'bg-maroon text-onMaroon'}`}>
              {cardCount}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
