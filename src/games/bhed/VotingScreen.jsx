import { useState } from 'react'
import { SecretWordBanner } from './SecretWordBanner'

export function VotingScreen({ players, myId, isBhed, secretWord, votesIn, totalPlayers, onVote, voted, isHost, onEndVoting }) {
  const [localVote, setLocalVote] = useState(null)
  const others = players.filter(p => p.id !== myId)

  function handlePick(playerId) {
    if (voted || localVote) return
    setLocalVote(playerId)
    onVote(playerId)
  }

  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <SecretWordBanner isBhed={isBhed} secretWord={secretWord} />
      <p className="text-xl font-bold font-display text-textPrimary text-center">Who is the Bhed?</p>

      <div className="grid grid-cols-2 gap-3 w-full">
        {others.map(p => {
          const selected = localVote === p.id
          return (
            <button
              key={p.id}
              onClick={() => handlePick(p.id)}
              disabled={!!localVote}
              className={`min-h-[56px] rounded-2xl border-[1.5px] flex flex-col items-center justify-center gap-1 px-3 py-3 transition-colors disabled:opacity-60 ${
                selected ? 'bg-emerald text-onEmerald border-emerald' : 'bg-surfaceElevated text-textPrimary border-border hover:border-emerald/50'
              }`}
            >
              <span className="text-lg leading-none">{p.avatar}</span>
              <span className="text-sm font-semibold truncate max-w-full">{p.name}</span>
            </button>
          )
        })}
      </div>

      {localVote && <p className="text-sm text-textMuted">Vote locked in — waiting for the room…</p>}

      <div className="w-full flex flex-col items-center gap-3 mt-auto pt-3">
        <p className="text-sm font-semibold text-textMuted">{votesIn} of {totalPlayers} voted</p>
        {isHost && (
          <button
            onClick={onEndVoting}
            disabled={votesIn === 0}
            className="min-h-[44px] w-full rounded-xl border-[1.5px] border-emerald text-emerald font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            End Voting & Reveal →
          </button>
        )}
      </div>
    </div>
  )
}
