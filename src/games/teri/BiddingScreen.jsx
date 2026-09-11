import { useState } from 'react'
import { SpadeIcon, HeartIcon, DiamondIcon, ClubIcon } from '../../components/cards/suitIcons'
import { PlayingCard } from '../../components/cards/PlayingCard'
import { parseCard } from '../../multiplayer/deck'

const SUITS = [
  { suit: 'spades', Icon: SpadeIcon, colorClass: 'text-cardBlack' },
  { suit: 'hearts', Icon: HeartIcon, colorClass: 'text-cardRed' },
  { suit: 'diamonds', Icon: DiamondIcon, colorClass: 'text-cardRed' },
  { suit: 'clubs', Icon: ClubIcon, colorClass: 'text-cardBlack' }
]

export function BiddingScreen({ myHand, isMyTurn, isFirstTurn, currentHighBid, currentBidderName, onBid, onPass }) {
  const [selectedNumber, setSelectedNumber] = useState(null)
  const [selectedSuit, setSelectedSuit] = useState(null)

  const minNumber = currentHighBid ? currentHighBid.number + 1 : 7
  const numbers = []
  for (let n = minNumber; n <= 13; n++) numbers.push(n)

  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 gap-4 max-w-lg w-full mx-auto">
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider text-center">
        {currentHighBid
          ? `High bid: ${currentHighBid.number} in ${currentHighBid.suit}`
          : 'No bids yet'}
      </p>

      <div className="flex flex-wrap justify-center gap-1.5">
        {myHand.map(cardId => {
          const { rank, suit } = parseCard(cardId)
          return <PlayingCard key={cardId} face="up" rank={rank} suit={suit} size="sm" />
        })}
      </div>

      {isMyTurn ? (
        <div className="flex flex-col gap-3 w-full">
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider text-center">
            {isFirstTurn ? 'Bid 7 or higher, and a suit' : 'Bid higher, or pass'}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {numbers.map(n => (
              <button
                key={n}
                onClick={() => setSelectedNumber(n)}
                className={`min-h-[44px] rounded-xl border-[1.5px] font-bold text-sm ${
                  selectedNumber === n ? 'border-cobalt bg-cobalt/10 text-cobalt' : 'border-border bg-surfaceElevated text-textPrimary'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {SUITS.map(({ suit, Icon, colorClass }) => (
              <button
                key={suit}
                onClick={() => setSelectedSuit(suit)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-[1.5px] ${
                  selectedSuit === suit ? 'border-cobalt bg-cobalt/10' : 'border-border bg-surfaceElevated'
                }`}
              >
                <Icon width="22" height="22" className={colorClass} />
              </button>
            ))}
          </div>
          <button
            onClick={() => onBid(selectedNumber, selectedSuit)}
            disabled={!selectedNumber || !selectedSuit}
            className="min-h-[48px] rounded-xl bg-cobalt text-onCobalt font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {selectedNumber && selectedSuit ? `Bid ${selectedNumber} in ${selectedSuit} →` : 'Pick a number and a suit'}
          </button>
          {!isFirstTurn && (
            <button
              onClick={onPass}
              className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-semibold"
            >
              Pass
            </button>
          )}
        </div>
      ) : (
        <p className="text-center text-textMuted text-sm py-8">
          Waiting for {currentBidderName}…
        </p>
      )}
    </div>
  )
}
