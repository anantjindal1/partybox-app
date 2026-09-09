import { useState } from 'react'
import { RANKS } from '../../multiplayer/deck'

export function BluffControls({
  isMyTurn,
  roundOpen,
  amLatestHandOwner,
  selectedCardIds,
  onOpenRound,
  onAdd,
  onPass,
  onChallenge
}) {
  const [claimedRank, setClaimedRank] = useState(null)

  if (!isMyTurn) {
    return <p className="text-center text-textMuted text-sm py-2">Waiting for your turn...</p>
  }

  const cardCountValid = selectedCardIds.length >= 1 && selectedCardIds.length <= 4

  // State 1: no round open — must open with a rank + cards.
  if (!roundOpen) {
    const canOpen = cardCountValid && !!claimedRank

    function handleOpenRound() {
      onOpenRound(selectedCardIds, claimedRank)
      setClaimedRank(null)
    }

    return (
      <div className="flex flex-col gap-3 pb-2">
        <div>
          <p className="text-xs text-textMuted uppercase tracking-wider mb-1.5 text-center">Claim a rank for your selected cards</p>
          <div className="grid grid-cols-7 gap-1.5">
            {RANKS.map(rank => (
              <button
                key={rank}
                onClick={() => setClaimedRank(rank)}
                className={`min-h-[36px] rounded-lg border-[1.5px] text-sm font-bold transition-colors ${
                  claimedRank === rank
                    ? 'bg-indigo text-onIndigo border-indigo'
                    : 'bg-surfaceElevated text-textPrimary border-border'
                }`}
              >
                {rank}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleOpenRound}
          disabled={!canOpen}
          className="min-h-[44px] rounded-xl bg-indigo text-onIndigo font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Open Round with {selectedCardIds.length || ''} Card{selectedCardIds.length === 1 ? '' : 's'} →
        </button>
      </div>
    )
  }

  function handleAdd() {
    onAdd(selectedCardIds)
  }

  // State 3: round wrapped back to the latest-hand owner — Pass (burn) or Add only.
  if (amLatestHandOwner) {
    return (
      <div className="flex gap-3 pb-2">
        <button
          onClick={onPass}
          className="flex-1 min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-bold"
        >
          Pass (burn pile)
        </button>
        <button
          onClick={handleAdd}
          disabled={!cardCountValid}
          className="flex-1 min-h-[44px] rounded-xl bg-indigo text-onIndigo font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add {selectedCardIds.length || ''} Card{selectedCardIds.length === 1 ? '' : 's'}
        </button>
      </div>
    )
  }

  // State 2: round open, not the latest-hand owner — Pass / Add / Challenge.
  return (
    <div className="flex flex-col gap-3 pb-2">
      <button
        onClick={handleAdd}
        disabled={!cardCountValid}
        className="min-h-[44px] rounded-xl bg-indigo text-onIndigo font-bold disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Add {selectedCardIds.length || ''} Card{selectedCardIds.length === 1 ? '' : 's'}
      </button>
      <div className="flex gap-3">
        <button
          onClick={onPass}
          className="flex-1 min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-bold"
        >
          Pass
        </button>
        <button
          onClick={onChallenge}
          className="flex-1 min-h-[44px] rounded-xl border-[1.5px] border-error text-error font-bold"
        >
          Call Bluff!
        </button>
      </div>
    </div>
  )
}
