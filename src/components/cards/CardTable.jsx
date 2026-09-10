import { PlayingCard } from './PlayingCard'
import { PlayerSeat } from './PlayerSeat'
import { parseCard } from '../../multiplayer/deck'

/**
 * Shared card-table layout: other players' seats across the top (face-down
 * stacks + count), a center zone for cards currently in play, and the
 * current player's own hand fanned out at the bottom. This is a controlled,
 * dumb rendering component — it doesn't own selection or turn logic, since
 * different card games need different per-turn semantics (play exactly one
 * card vs. select several before committing). Every future card game
 * composes this the same way, passing its own `accent` color.
 */
export function CardTable({
  otherSeats = [],
  myHand = [],
  myIsActiveTurn = false,
  centerCards = [],
  centerSlot = null,
  selectedCardIds = [],
  disabledCardIds = [],
  highlightedCardIds = [],
  onCardTap,
  accent = 'maroon',
  dealing = false
}) {
  const midIndex = (myHand.length - 1) / 2

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Other players, spread across the top */}
      <div className="flex items-start justify-center gap-6 flex-wrap min-h-[90px] pt-1">
        {otherSeats.map(seat => (
          <PlayerSeat
            key={seat.player.id}
            player={seat.player}
            cardCount={seat.cardCount}
            isActiveTurn={seat.isActiveTurn}
            accent={accent}
          />
        ))}
      </div>

      {/* Cards currently in play — a game with unusual center-zone needs
          (e.g. Bluff's face-down claim pile) passes centerSlot instead of
          relying on this default face-up rendering, so its own layout
          never fights this built-in empty zone for space. */}
      <div className="flex-1 flex items-center justify-center gap-2 min-h-[70px] py-2">
        {centerSlot ?? centerCards.map((entry, i) => {
          const { rank, suit } = parseCard(entry.card)
          return (
            <div key={entry.card} className="flex flex-col items-center gap-1 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <PlayingCard face="up" rank={rank} suit={suit} size="md" />
              {entry.playerName && <span className="text-[10px] text-textMuted">{entry.playerName}</span>}
            </div>
          )
        })}
      </div>

      {/* My hand */}
      <div
        className={`flex justify-center items-end px-2 pb-1 pt-3 rounded-2xl ${
          myIsActiveTurn ? 'bg-surfaceMuted' : ''
        }`}
      >
        {myHand.map((cardId, i) => {
          const { rank, suit } = parseCard(cardId)
          const offset = i - midIndex
          const rotate = offset * 3.5
          const isSelected = selectedCardIds.includes(cardId)
          const isDisabled = disabledCardIds.includes(cardId)
          const isHighlighted = highlightedCardIds.includes(cardId)
          return (
            <button
              key={cardId}
              type="button"
              disabled={isDisabled}
              onClick={() => onCardTap?.(cardId)}
              className={`${dealing ? 'animate-deal-in' : ''} transition-transform duration-150 ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
              style={{
                marginLeft: i === 0 ? 0 : -18,
                transform: `rotate(${rotate}deg) translateY(${isSelected ? -14 : 0}px)`,
                zIndex: isSelected ? 50 : i,
                animationDelay: dealing ? `${i * 50}ms` : undefined,
                '--deal-from': 'translateY(-50px) scale(0.6)'
              }}
            >
              <PlayingCard
                face="up"
                rank={rank}
                suit={suit}
                size="lg"
                className={isHighlighted ? 'animate-turn-glow' : ''}
                style={isHighlighted ? { '--turn-glow-color': 'var(--color-accent-gold)' } : undefined}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
