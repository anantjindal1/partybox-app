import { useState } from 'react'
import { RANKS } from '../../multiplayer/deck'

export function BluffControls({ isMyTurn, canChallenge, selectedCardIds, onPlay, onChallenge }) {
  const [claimedRank, setClaimedRank] = useState(null)

  if (!isMyTurn) {
    return <p className="text-center text-textMuted text-sm py-2">Waiting for your turn...</p>
  }

  const canPlay = selectedCardIds.length >= 1 && selectedCardIds.length <= 4 && !!claimedRank

  function handlePlay() {
    onPlay(selectedCardIds, claimedRank)
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

      <div className="flex gap-3">
        <button
          onClick={handlePlay}
          disabled={!canPlay}
          className="flex-1 min-h-[44px] rounded-xl bg-indigo text-onIndigo font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Play {selectedCardIds.length || ''} Card{selectedCardIds.length === 1 ? '' : 's'} →
        </button>
        {canChallenge && (
          <button
            onClick={onChallenge}
            className="min-h-[44px] px-4 rounded-xl border-[1.5px] border-error text-error font-bold"
          >
            Call Bluff!
          </button>
        )}
      </div>
    </div>
  )
}
