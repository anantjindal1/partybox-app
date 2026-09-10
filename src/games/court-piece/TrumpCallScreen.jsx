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
  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">
        {isCaller ? 'Your 5 Cards — Call Trump' : 'Calling Trump…'}
      </p>

      <div className="flex gap-1.5">
        {myHand.map(cardId => {
          const { rank, suit } = parseCard(cardId)
          return <PlayingCard key={cardId} face="up" rank={rank} suit={suit} size="md" />
        })}
      </div>

      {isCaller ? (
        <div className="grid grid-cols-2 gap-3 w-full">
          {SUITS.map(({ suit, Icon, colorClass }) => (
            <button
              key={suit}
              onClick={() => onCall(suit)}
              className="flex flex-col items-center gap-2 py-6 rounded-2xl border-[1.5px] border-border bg-surfaceElevated hover:border-jade transition-colors"
            >
              <Icon width="36" height="36" className={colorClass} />
              <span className="text-sm font-bold text-textPrimary capitalize">{suit}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-center text-textMuted text-sm py-8">
          {callerName} won the last hand — waiting for them to call trump…
        </p>
      )}
    </div>
  )
}
