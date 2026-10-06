import { useState, useEffect } from 'react'
import { PlayingCard } from './PlayingCard'
import { PlayerSeat } from './PlayerSeat'
import { parseCard } from '../../multiplayer/deck'
import { CARD_GAME_ACCENT_CLASSES } from '../cardGameAccent'
import { getSeatPosition, getHandStep } from './seatLayout'
import { useCardVariant } from './cardVariant'
import { tapHaptic, turnHaptic } from '../../lib/haptics'

const HAND_CARD_WIDTH = 46 // matches PlayingCard's 'md' size
// Royal hands use 'lg' cards up to 13 (spaced to fit a 375px phone); a
// bigger hand (Bhabhi/Satti deal up to 17, two-deck Bluff far more) drops
// to 'md' so each card keeps a readable sliver.
const ROYAL_LG_MAX_CARDS = 13
const ROYAL_LG_TARGET_WIDTH = 316
const ROYAL_MD_TARGET_WIDTH = 330
const SIDE_EXPOSED_CARD_WIDTH = 32 // 'sm'

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
  dealing = false,
  // 'play' (default): tapping a card immediately plays it — locks further
  // taps until the card actually leaves myHand, driving the play-out
  // animation. 'toggle': tapping just adds/removes the card from
  // selectedCardIds (e.g. Bluff, which lets a player stage several cards
  // before submitting) — no lock, no play-out animation, since the card
  // never actually leaves the hand on tap.
  tapMode = 'play',
  // 'royal': the dark felt table with gold-rimmed rings and glowing cards
  // (see .royal-* in index.css). Omitted, every game renders as before.
  variant: variantProp
}) {
  const variant = useCardVariant(variantProp)
  const [playingCardId, setPlayingCardId] = useState(null)
  const royal = variant === 'royal'
  const accentClasses = CARD_GAME_ACCENT_CLASSES[accent] ?? CARD_GAME_ACCENT_CLASSES.maroon
  const royalLarge = royal && myHand.length <= ROYAL_LG_MAX_CARDS
  const handCardWidth = royalLarge ? 62 : HAND_CARD_WIDTH
  const step = !royal
    ? getHandStep(myHand.length, handCardWidth)
    : getHandStep(myHand.length, handCardWidth, royalLarge ? ROYAL_LG_TARGET_WIDTH : ROYAL_MD_TARGET_WIDTH)
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
  // A side seat's exposed hand (Teri's dummy, seen by a defender) can't fit
  // beside the play area on a phone — it renders as its own row between
  // the table and my hand instead. It's display-only: the only viewer who
  // ever taps the dummy (GameLead) always sees it at the front seat.
  const sideExposedSeat = otherSeats.find((seat, i) => seat.exposedCards && !(hasFrontSeat && i === middleIndex))
  // The exposed-hand fan now uses full "md" cards (see PlayerSeat.jsx),
  // taller than the "sm" cards this margin was originally tuned for —
  // widened accordingly so the taller fan doesn't push the seat's own
  // avatar/name above the table's top clearance again (a real bug hit
  // once already, see PlayerSeat.jsx's absolute-positioning comment).
  const tableTopMargin = frontSeatHasExposedHand ? (royal ? 'mt-[200px]' : 'mt-56') : hasFrontSeat ? 'mt-32' : 'mt-10'

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

  useEffect(() => {
    if (myIsActiveTurn) turnHaptic()
  }, [myIsActiveTurn])

  function handleTap(cardId) {
    tapHaptic()
    if (tapMode === 'toggle') {
      onCardTap?.(cardId)
      return
    }
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
        className={royal
          ? `royal-table w-full ${tableTopMargin}`
          : `relative w-full ${tableTopMargin} rounded-[50%] border-[3px] shadow-inner ${accentClasses.border} ${accentClasses.soft}`}
        style={{ aspectRatio: royal ? '1.8 / 1' : '2.1 / 1', minHeight: 140 }}
      >
        {royal && <RoyalTableSurface />}
        {otherSeats.map((seat, i) => {
          const pos = getSeatPosition(i, otherSeats.length)
          const isFrontSeat = hasFrontSeat && i === middleIndex
          const isSideExposed = seat === sideExposedSeat
          return (
            <div
              key={seat.player.id}
              className={`absolute -translate-x-1/2 ${isFrontSeat ? 'bottom-full mb-2' : '-translate-y-1/2'}`}
              style={isFrontSeat ? { left: pos.left } : { left: pos.left, top: pos.top }}
            >
              <PlayerSeat
                player={seat.player}
                cardCount={isSideExposed ? 0 : seat.cardCount}
                isActiveTurn={seat.isActiveTurn}
                accent={accent}
                label={seat.label}
                exposedCards={isSideExposed ? undefined : seat.exposedCards}
                onExposedCardTap={seat.onExposedCardTap}
                disabledExposedCardIds={seat.disabledExposedCardIds}
                highlightedExposedCardIds={seat.highlightedExposedCardIds}
                selectedExposedCardIds={seat.selectedExposedCardIds}
                variant={variant}
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
                <PlayingCard face="up" rank={rank} suit={suit} size={royal ? 'md' : 'sm'} variant={variant} glow={royal} />
                {entry.playerName && (
                  <span className={royal ? 'royal-name text-[9px]' : 'text-[10px] text-textMuted'}>{entry.playerName}</span>
                )}
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
      {sideExposedSeat && (
        <SideExposedRow seat={sideExposedSeat} variant={variant} />
      )}

      {myIsActiveTurn && (royal ? (
        <p className="text-center -mb-1">
          <span className="royal-gold-pill inline-block text-xs px-4 py-1.5">Your Turn</span>
        </p>
      ) : (
        <p className={`text-center text-xs font-extrabold uppercase tracking-wide -mb-2 ${accentClasses.text}`}>
          Your Turn
        </p>
      ))}
      <div className={royal ? '' : 'overflow-x-auto'}>
        <div
          className={`flex justify-center items-end w-fit mx-auto ${royal ? 'px-1' : 'px-2'} pb-1 pt-3 rounded-2xl border-2 ${
            myIsActiveTurn && !royal ? `${accentClasses.soft} ${accentClasses.border}` : 'border-transparent'
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
            // Royal: a hand that simply isn't on turn stays bright (just
            // unglowing); only illegal cards on my own turn dim down.
            const disabledClass = !isDisabled ? '' : !royal
              ? 'grayscale opacity-35 pointer-events-none'
              : myIsActiveTurn ? 'royal-dim pointer-events-none' : 'pointer-events-none'
            return (
              <button
                key={cardId}
                type="button"
                disabled={isDisabled || (!!playingCardId && !isPlaying)}
                onClick={() => handleTap(cardId)}
                className={`${dealing ? 'animate-deal-in' : ''} ${isPlaying ? 'animate-play-out' : 'transition-transform duration-150'} ${disabledClass}`}
                style={{
                  marginLeft: i === 0 ? 0 : step - handCardWidth,
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
                  size={royalLarge ? 'lg' : 'md'}
                  highlighted={isHighlighted && !isPlaying}
                  variant={variant}
                  glow={royal && myIsActiveTurn && !isDisabled}
                  className={isPlaying && !royal ? `border-2 ${accentClasses.border}` : ''}
                />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Copper rim, gold line, dark ring, gold hairline, lit felt, inner rings —
// purely decorative layers behind the seats and play area.
function RoyalTableSurface() {
  return (
    <>
      <div className="royal-ring royal-rim inset-0" />
      <div className="royal-ring inset-[10px] bg-gradient-to-b from-[#f7dca0] to-[#b98a3e]" />
      <div className="royal-ring inset-[12px] bg-[#082224]" />
      <div className="royal-ring inset-[17px] border border-[#f0cf8e]/55" />
      <div className="royal-ring royal-felt inset-[18px]">
        <div className="royal-beam left-[18%]" />
        <div className="royal-beam left-[46%] !w-[34px]" />
        <div className="royal-beam left-[70%]" />
      </div>
      <div className="royal-ring inset-[30px] border border-white/10" />
      <div className="royal-ring inset-[44px] border border-dashed border-[#f0cf8e]/10" />
    </>
  )
}

function SideExposedRow({ seat, variant }) {
  const royal = variant === 'royal'
  const cards = seat.exposedCards
  const highlighted = seat.highlightedExposedCardIds ?? []
  const step = getHandStep(cards.length, SIDE_EXPOSED_CARD_WIDTH, 330)
  return (
    <div className="flex flex-col items-center gap-1.5 -mt-1">
      <p className={royal ? 'royal-name text-[10px]' : 'text-xs font-semibold text-textMuted'}>
        {seat.player?.name ?? 'Player'} · Open hand
      </p>
      <div className="flex items-end">
        {cards.map((cardId, i) => {
          const { rank, suit } = parseCard(cardId)
          return (
            <PlayingCard
              key={cardId}
              face="up"
              rank={rank}
              suit={suit}
              size="sm"
              variant={variant}
              highlighted={highlighted.includes(cardId)}
              style={{ marginLeft: i === 0 ? 0 : step - SIDE_EXPOSED_CARD_WIDTH, zIndex: i }}
            />
          )
        })}
      </div>
    </div>
  )
}
