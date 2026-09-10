import { PlayingCard } from '../../components/cards/PlayingCard'
import { SUIT_ICONS, SUIT_COLOR } from '../../components/cards/suitIcons'
import { RANKS, SUITS } from '../../multiplayer/deck'

/**
 * Four suits build independently and simultaneously, unlike every other
 * card game's single center trick — so this can't be expressed with
 * CardTable's default centerCards row, and is passed in via centerSlot
 * instead (same mechanism Bluff used for its claim pile).
 */
export function SattiBoard({ board }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {SUITS.map(suit => {
        const SuitGlyph = SUIT_ICONS[suit]
        const colorClass = SUIT_COLOR[suit] === 'cardRed' ? 'text-cardRed' : 'text-cardBlack'
        const { low, high } = board[suit]
        return (
          <div key={suit} className="flex items-center gap-2 rounded-lg border border-border bg-surfaceElevated px-2 py-1.5">
            <SuitGlyph width={16} height={16} className={`shrink-0 ${colorClass}`} />
            {low === null ? (
              <span className="text-xs text-textMuted italic">Not started</span>
            ) : (
              <div className="flex gap-1 overflow-x-auto">
                {RANKS.slice(low, high + 1).map(rank => (
                  <PlayingCard key={rank} face="up" rank={rank} suit={suit} size="sm" />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
