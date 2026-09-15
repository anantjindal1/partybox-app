import { useState, useEffect } from 'react'
import { PlayingCard } from './PlayingCard'
import { PlayerSeat } from './PlayerSeat'
import { parseCard } from '../../multiplayer/deck'
import { CARD_GAME_ACCENT_CLASSES } from '../cardGameAccent'
import { getSeatPosition, getHandStep } from './seatLayout'

const HAND_CARD_WIDTH = 46 // matches PlayingCard's 'md' size

/**
 * Shared card-table layout: an oval "table" surface with other players'
 * seats positioned around its top arc (face-down stacks + count), a
 * center zone for cards currently in play, and the current player's own
 * hand fanned out below it. This is a controlled, dumb rendering
 * component — it doesn't own selection or turn logic, since different
 * card games need different per-turn semantics (play exactly one card
 * vs. select several before committing). Every future card game
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
  const [playingCardId, setPlayingCardId] = useState(null)
  const accentClasses = CARD_GAME_ACCENT_CLASSES[accent] ?? CARD_GAME_ACCENT_CLASSES.maroon
  const step = getHandStep(myHand.length, HAND_CARD_WIDTH)
  const midIndex = (myHand.length - 1) / 2

  // The seat directly opposite the viewer (when one exists — only an
  // ODD opponent count puts any seat exactly at the top of the arc;
  // an even count has two seats straddling that point, neither of
  // them truly "opposite") sits fully OUTSIDE the table instead of
  // straddling its edge — a real seat, and its cards, wouldn't be
  // drawn half-on-half-off the table rim. This needs real clearance
  // above the oval, more again when that seat also has an exposed
  // hand growing further upward from it.
  const middleIndex = Math.floor((otherSeats.length - 1) / 2)
  const hasFrontSeat = otherSeats.length % 2 === 1
  const frontSeatHasExposedHand = hasFrontSeat && !!otherSeats[middleIndex]?.exposedCards
  const tableTopMargin = frontSeatHasExposedHand ? 'mt-44' : hasFrontSeat ? 'mt-32' : 'mt-10'

  // Once the real state update actually removes the played card from
  // myHand, clear the local "mid-animation" flag — tying the play-out
  // animation's lifecycle to real data instead of a guessed timeout, so
  // it never "snaps back" if the network round-trip is slower than an
  // arbitrary delay would assume.
  useEffect(() => {
    if (playingCardId && !myHand.includes(playingCardId)) {
      setPlayingCardId(null)
    }
  }, [myHand, playingCardId])

  function handleTap(cardId) {
    if (playingCardId) return
    setPlayingCardId(cardId)
    onCardTap?.(cardId)
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Table surface — an oval with other seats positioned around its
          top arc via getSeatPosition, "me" always below/outside it.
          The top margin gives seats room to sit partly ON the table's
          edge (as a real seat would) without colliding with whatever
          renders above CardTable (e.g. a game's score bar) — bigger
          specifically when the front seat has an exposed hand growing
          upward into that same space (see tableTopMargin above). */}
      <div
        className={`relative w-full ${tableTopMargin} rounded-[50%] border-[3px] shadow-inner ${accentClasses.border} ${accentClasses.soft}`}
        style={{ aspectRatio: '2.1 / 1', minHeight: 140 }}
      >
        {otherSeats.map((seat, i) => {
          const pos = getSeatPosition(i, otherSeats.length)
          const isFrontSeat = hasFrontSeat && i === middleIndex
          // Which side of the table this seat sits on — an exposed hand
          // (Teri's dummy) needs to grow away from the center play area,
          // not into it, and which direction "away" is depends on this.
          const exposedHandSide = isFrontSeat ? 'front' : i < middleIndex ? 'left' : 'right'
          return (
            <div
              key={seat.player.id}
              className={`absolute -translate-x-1/2 ${isFrontSeat ? 'bottom-full mb-2' : '-translate-y-1/2'}`}
              style={isFrontSeat ? { left: pos.left } : { left: pos.left, top: pos.top }}
            >
              <PlayerSeat
                player={seat.player}
                cardCount={seat.cardCount}
                isActiveTurn={seat.isActiveTurn}
                accent={accent}
                label={seat.label}
                exposedCards={seat.exposedCards}
                exposedHandSide={exposedHandSide}
                onExposedCardTap={seat.onExposedCardTap}
                disabledExposedCardIds={seat.disabledExposedCardIds}
                highlightedExposedCardIds={seat.highlightedExposedCardIds}
                selectedExposedCardIds={seat.selectedExposedCardIds}
              />
            </div>
          )
        })}

        {/* Cards currently in play — inset well within the seat ring so
            this reads as a distinct play area rather than sharing the
            exact same rect the seats are positioned on. The vertical
            inset is deliberately larger than the horizontal one: the
            oval is wide and short (2.1:1), so seats above/below (the
            front seat's own face-down stack in particular) sit much
            closer to the play area vertically than opponents do
            horizontally — without the extra vertical squeeze, trick
            cards can still touch a seat's card stack. A game with
            unusual center-zone needs (e.g. Bluff's face-down claim
            pile) passes centerSlot instead of relying on this default
            face-up rendering. */}
        <div className="absolute inset-x-[15%] inset-y-[30%] flex items-center justify-center gap-2 px-2 flex-wrap">
          {centerSlot ?? centerCards.map((entry, i) => {
            const { rank, suit } = parseCard(entry.card)
            return (
              <div key={entry.card} className="flex flex-col items-center gap-1 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <PlayingCard face="up" rank={rank} suit={suit} size="sm" />
                {entry.playerName && <span className="text-[10px] text-textMuted">{entry.playerName}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* My hand — width-tuned via getHandStep so a 13-17 card hand still
          fits a phone-width screen; overflow-x-auto is a safety net for
          anything beyond that tuned range. A flat muted background was
          too subtle a cue for "it's your turn" on a small phone screen —
          an explicit label plus the game's own accent color reads clearly
          without needing to spot a faint tint. */}
      {myIsActiveTurn && (
        <p className={`text-center text-xs font-extrabold uppercase tracking-wide -mb-2 ${accentClasses.text}`}>
          Your Turn
        </p>
      )}
      <div className="overflow-x-auto">
        <div
          className={`flex justify-center items-end w-fit mx-auto px-2 pb-1 pt-3 rounded-2xl border-2 ${
            myIsActiveTurn ? `${accentClasses.soft} ${accentClasses.border}` : 'border-transparent'
          }`}
        >
          {myHand.map((cardId, i) => {
            const { rank, suit } = parseCard(cardId)
            const offset = i - midIndex
            const rotate = offset * 3.5
            const isSelected = selectedCardIds.includes(cardId)
            const isDisabled = disabledCardIds.includes(cardId)
            const isHighlighted = highlightedCardIds.includes(cardId)
            const isPlaying = playingCardId === cardId
            return (
              <button
                key={cardId}
                type="button"
                disabled={isDisabled || (!!playingCardId && !isPlaying)}
                onClick={() => handleTap(cardId)}
                className={`${dealing ? 'animate-deal-in' : ''} ${isPlaying ? 'animate-play-out' : 'transition-transform duration-150'} ${
                  isDisabled ? 'grayscale opacity-35 pointer-events-none' : ''
                }`}
                style={{
                  marginLeft: i === 0 ? 0 : step - HAND_CARD_WIDTH,
                  transform: isPlaying ? undefined : `rotate(${rotate}deg) translateY(${isSelected ? -14 : 0}px)`,
                  zIndex: isSelected || isPlaying ? 50 : i,
                  animationDelay: dealing ? `${i * 50}ms` : undefined,
                  '--deal-from': 'translateY(-50px) scale(0.6)'
                }}
              >
                <PlayingCard
                  face="up"
                  rank={rank}
                  suit={suit}
                  size="md"
                  highlighted={isHighlighted && !isPlaying}
                  className={isPlaying ? `border-2 ${accentClasses.border}` : ''}
                />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
