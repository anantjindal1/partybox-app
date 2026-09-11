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

export function TrumpCallScreen({ isCaller, callerName, myHand, onCall }) {
  const [selectedSuit, setSelectedSuit] = useState(null)

  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">
        {isCaller
          ? selectedSuit
            ? 'Declare It or Keep It Hidden?'
            : 'Your 5 Cards — Call Trump'
          : 'Calling Trump…'}
      </p>

      <div className="flex gap-1.5">
        {myHand.map(cardId => {
          const { rank, suit } = parseCard(cardId)
          return <PlayingCard key={cardId} face="up" rank={rank} suit={suit} size="md" />
        })}
      </div>

      {isCaller ? (
        selectedSuit ? (
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => onCall(selectedSuit, 'declared')}
              className="min-h-[56px] rounded-2xl border-[1.5px] border-orchid bg-orchid/10 text-textPrimary font-bold"
            >
              Declare Trump — everyone sees it
            </button>
            <button
              onClick={() => onCall(selectedSuit, 'hidden')}
              className="min-h-[56px] rounded-2xl border-[1.5px] border-border bg-surfaceElevated text-textPrimary font-bold"
            >
              Keep It Hidden — revealed only if asked
            </button>
            <button
              onClick={() => setSelectedSuit(null)}
              className="text-center text-sm text-textMuted"
            >
              ← Pick a different suit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 w-full">
            {SUITS.map(({ suit, Icon, colorClass }) => (
              <button
                key={suit}
                onClick={() => setSelectedSuit(suit)}
                className="flex flex-col items-center gap-2 py-6 rounded-2xl border-[1.5px] border-border bg-surfaceElevated hover:border-orchid transition-colors"
              >
                <Icon width="36" height="36" className={colorClass} />
                <span className="text-sm font-bold text-textPrimary capitalize">{suit}</span>
              </button>
            ))}
          </div>
        )
      ) : (
        <p className="text-center text-textMuted text-sm py-8">
          {callerName} is targeting 5 this hand — waiting for them to call trump…
        </p>
      )}
    </div>
  )
}
