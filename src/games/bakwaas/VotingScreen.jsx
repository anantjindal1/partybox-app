import { useState } from 'react'

export function VotingScreen({ prompt, answers, myId, votesIn, totalPlayers, onVote, voted, isHost, onEndVoting, currentRound, roundCount, t }) {
  const [localVote, setLocalVote] = useState(null)
  const others = answers.filter((a) => a.authorId !== myId)

  function handlePick(authorId) {
    if (voted || localVote) return
    setLocalVote(authorId)
    onVote(authorId)
  }

  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">
        {t('round')} {currentRound} {t('of')} {roundCount}
      </p>

      <div className="bg-surfaceElevated border-[1.5px] border-fuchsia rounded-2xl p-6 text-center w-full">
        <p className="text-xl font-bold font-display text-textPrimary leading-snug">
          {prompt?.en ?? '...'}
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {others.map((a) => {
          const selected = localVote === a.authorId
          return (
            <button
              key={a.authorId}
              onClick={() => handlePick(a.authorId)}
              disabled={!!localVote}
              className={`w-full min-h-[52px] rounded-2xl border-[1.5px] px-4 py-3 text-left font-semibold transition-colors disabled:opacity-60 ${
                selected ? 'bg-fuchsia text-onFuchsia border-fuchsia' : 'bg-surfaceElevated text-textPrimary border-border hover:border-fuchsia/50'
              }`}
            >
              {a.text}
            </button>
          )
        })}
      </div>

      {localVote && <p className="text-sm text-textMuted">Vote locked in — waiting for the room…</p>}

      <div className="w-full flex flex-col items-center gap-3 mt-auto pt-3">
        <p className="text-sm font-semibold text-textMuted">
          {votesIn} of {totalPlayers} voted
        </p>
        {isHost && (
          <button
            onClick={onEndVoting}
            disabled={votesIn === 0}
            className="min-h-[44px] w-full rounded-xl border-[1.5px] border-fuchsia text-fuchsia font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            End Voting &amp; Reveal →
          </button>
        )}
      </div>
    </div>
  )
}
