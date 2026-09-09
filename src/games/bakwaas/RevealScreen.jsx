export function RevealScreen({ prompt, answers, tally, winnerAuthorIds, players, isHost, isLastRound, skippedVoting, onNextRound, advancing, t }) {
  function nameOf(id) {
    return players.find((p) => p.id === id)?.name ?? 'Player'
  }

  const maxVotes = Math.max(0, ...Object.values(tally))
  const sorted = [...answers].sort((a, b) => (tally[b.authorId] ?? 0) - (tally[a.authorId] ?? 0))
  const winnerNames = winnerAuthorIds.map(nameOf)

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs text-textMuted uppercase tracking-wider text-center">{prompt?.en}</p>

      <div className="bg-fuchsia/10 border-[1.5px] border-fuchsia rounded-2xl p-5 text-center">
        <p className="text-xl font-bold font-display text-fuchsia">
          {skippedVoting
            ? 'Not enough answers this round'
            : winnerNames.length > 0
              ? winnerNames.join(' & ')
              : 'No votes this round'}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {sorted.map((a) => {
          const votes = tally[a.authorId] ?? 0
          const isWinner = winnerAuthorIds.includes(a.authorId)
          const pct = maxVotes > 0 ? (votes / maxVotes) * 100 : 0
          return (
            <div key={a.authorId} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-textPrimary flex-1">{a.text}</span>
                {!skippedVoting && (
                  <span className="text-sm font-bold text-textPrimary tabular-nums">{votes}</span>
                )}
              </div>
              {!skippedVoting && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-4 rounded-full bg-surfaceMuted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isWinner ? 'bg-fuchsia' : 'bg-textMuted/40'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-xs w-20 truncate ${isWinner ? 'text-fuchsia font-bold' : 'text-textMuted'}`}>
                    {nameOf(a.authorId)}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {isHost ? (
        <button
          onClick={onNextRound}
          disabled={advancing}
          className="min-h-[44px] rounded-xl bg-fuchsia text-onFuchsia font-bold disabled:opacity-40 transition-opacity"
        >
          {isLastRound ? `${t('seeFinalResults')} →` : `${t('nextRound')} →`}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">{t('waitingForHostContinue')}</p>
      )}
    </div>
  )
}
