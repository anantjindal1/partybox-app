import { PlayingCard } from './PlayingCard'
import { parseCard } from '../../multiplayer/deck'

/**
 * Holds a completed trick's 4 cards on screen with the winner called out
 * (and highlighted) for a beat, instead of the trick vanishing the instant
 * the last card lands. Meant for CardTable's `centerSlot` — pairs with a
 * host-side pause between persisting the trick result and clearing it
 * (see Teri's applyPlay for the reference implementation of that pause).
 */
export function TrickWinnerOverlay({ centerCards, trickWinnerId, trickWinnerName, accentColorClass = 'text-cobalt', unitLabel = 'trick' }) {
  if (!trickWinnerId) return null
  return (
    <div className="flex flex-col items-center gap-1.5 animate-trick-settle">
      <div className="flex gap-2 flex-wrap justify-center">
        {centerCards.map(entry => {
          const { rank, suit } = parseCard(entry.card)
          const isWinningCard = entry.playerId === trickWinnerId
          return (
            <div key={entry.card} className="flex flex-col items-center gap-1">
              <PlayingCard
                face="up"
                rank={rank}
                suit={suit}
                size="sm"
                className={isWinningCard ? 'shadow-[0_0_0_3px_var(--color-accent-gold)]' : ''}
              />
              {entry.playerName && <span className="text-[10px] text-textMuted">{entry.playerName}</span>}
            </div>
          )
        })}
      </div>
      <p className={`text-xs font-bold ${accentColorClass}`}>{trickWinnerName} won the {unitLabel}!</p>
    </div>
  )
}
