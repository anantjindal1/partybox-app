import { PlayingCard } from './PlayingCard'
import { parseCard } from '../../multiplayer/deck'

/**
 * Holds a completed hand's (1 card from each player) 4 cards on screen
 * with the winner called out (and highlighted) for a beat, instead of it
 * vanishing the instant the last card lands. Meant for CardTable's
 * `centerSlot` — pairs with a host-side pause between persisting the
 * hand result and clearing it (see Teri's applyPlay for the reference
 * implementation of that pause).
 *
 * `settle` drives the fade-and-shrink-to-nothing animation for that live,
 * transient use — pass `settle={false}` when reusing this for a static
 * "review this hand again" view (its `forwards` fill mode otherwise
 * leaves a freshly-mounted copy sitting at opacity 0 once it finishes).
 * `message` replaces the default "X won the hand!" line, for games whose
 * hand outcome isn't a plain win (e.g. Bhabhi's discard / pick-up).
 */
export function HandWinnerOverlay({ centerCards, handWinnerId, handWinnerName, accentColorClass = 'text-cobalt', unitLabel = 'hand', settle = true, message }) {
  if (!handWinnerId) return null
  return (
    <div className={`flex flex-col items-center gap-1.5 ${settle ? 'animate-hand-settle' : ''}`}>
      <div className="flex gap-2 flex-wrap justify-center">
        {centerCards.map(entry => {
          const { rank, suit } = parseCard(entry.card)
          const isWinningCard = entry.playerId === handWinnerId
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
      <p className={`text-xs font-bold ${accentColorClass}`}>{message ?? `${handWinnerName} won the ${unitLabel}!`}</p>
    </div>
  )
}
