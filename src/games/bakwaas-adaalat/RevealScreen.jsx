export function RevealScreen({ lastRoundResult, players, roundNumber, totalRounds, isHost, isLastRound, onNextRound, advancing }) {
  if (!lastRoundResult) return null
  const { caseText, lawyerIds, tally, winnerIds } = lastRoundResult

  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? 'Player'
  }

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs text-textMuted uppercase tracking-wider text-center">
        Case {roundNumber} of {totalRounds}
      </p>
      <p className="text-sm text-textMuted text-center italic">"{caseText}"</p>

      <div className="rounded-2xl p-5 text-center border-[1.5px] bg-taupe/10 border-taupe">
        <p className="text-xl font-bold font-display text-taupe">
          {winnerIds.length > 0 ? `${winnerIds.map(nameOf).join(' & ')} won this case!` : 'No votes — no winner this round'}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {lawyerIds.map(id => (
          <div key={id} className="flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] border-border bg-surfaceElevated">
            <span className="text-sm font-semibold text-textPrimary">{nameOf(id)}</span>
            <span className="text-sm font-bold text-taupe tabular-nums">{tally[id] ?? 0} vote{(tally[id] ?? 0) === 1 ? '' : 's'}</span>
          </div>
        ))}
      </div>

      {isHost ? (
        <button
          onClick={onNextRound}
          disabled={advancing}
          className="min-h-[44px] rounded-xl bg-taupe text-onTaupe font-bold disabled:opacity-40 transition-opacity"
        >
          {isLastRound ? 'See Final Results →' : 'Next Case →'}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">Waiting for the host to continue…</p>
      )}
    </div>
  )
}
