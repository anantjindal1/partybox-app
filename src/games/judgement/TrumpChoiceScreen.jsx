import { SpadeIcon, HeartIcon, DiamondIcon, ClubIcon } from '../../components/cards/suitIcons'

const SUITS = [
  { suit: 'spades', Icon: SpadeIcon, colorClass: 'text-cardBlack' },
  { suit: 'hearts', Icon: HeartIcon, colorClass: 'text-cardRed' },
  { suit: 'diamonds', Icon: DiamondIcon, colorClass: 'text-cardRed' },
  { suit: 'clubs', Icon: ClubIcon, colorClass: 'text-cardBlack' }
]

export function TrumpChoiceScreen({ isChooser, chooserName, onChoose }) {
  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">
        {isChooser ? 'You Won the Bid — Choose Trump' : 'Choosing Trump…'}
      </p>

      {isChooser ? (
        <div className="grid grid-cols-2 gap-3 w-full">
          {SUITS.map(({ suit, Icon, colorClass }) => (
            <button
              key={suit}
              onClick={() => onChoose(suit)}
              className="flex flex-col items-center gap-2 py-6 rounded-2xl border-[1.5px] border-border bg-surfaceElevated hover:border-peridot transition-colors"
            >
              <Icon width="36" height="36" className={colorClass} />
              <span className="text-sm font-bold text-textPrimary capitalize">{suit}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-center text-textMuted text-sm py-8">
          {chooserName} bid the highest — waiting for them to choose trump…
        </p>
      )}
    </div>
  )
}
