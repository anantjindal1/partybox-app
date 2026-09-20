import { useState } from 'react'
import { HandWinnerOverlay } from './HandWinnerOverlay'
import { CARD_GAME_ACCENT_CLASSES } from '../cardGameAccent'

/**
 * "View Last Hand" button + modal — the live winner overlay clears itself
 * after ~1.5s, so this is the only way to look back at the hand just
 * played. Reuses HandWinnerOverlay so the review matches the live reveal.
 * `lastHand` is `{ cards: [{ playerId, card }], winnerId, message? }`, as
 * each game persists it when a hand completes.
 */
export function LastHandButton({ lastHand, players, accent = 'maroon' }) {
  const [open, setOpen] = useState(false)
  if (!lastHand) return null
  const accentClasses = CARD_GAME_ACCENT_CLASSES[accent] ?? CARD_GAME_ACCENT_CLASSES.maroon
  const winnerName = players.find(p => p.id === lastHand.winnerId)?.name ?? 'Player'
  const centerCards = lastHand.cards.map(({ playerId, card }) => ({
    card,
    playerId,
    playerName: players.find(p => p.id === playerId)?.name
  }))

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`self-center text-sm font-bold border-[1.5px] rounded-xl px-4 py-2 ${accentClasses.text} ${accentClasses.border} ${accentClasses.soft}`}
      >
        View Last Hand
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4 py-8 overflow-y-auto">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-4">
            <div className="flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="text-textMuted hover:text-textPrimary text-sm font-semibold px-3 py-1"
              >
                Close
              </button>
            </div>
            <HandWinnerOverlay
              centerCards={centerCards}
              handWinnerId={lastHand.winnerId}
              handWinnerName={winnerName}
              accentColorClass={accentClasses.text}
              settle={false}
              message={lastHand.message}
            />
          </div>
        </div>
      )}
    </>
  )
}
