export function RevealScreen({ prompt, tally, winnerIds, players, isHost, isLastRound, onNextRound, advancing, t }) {
  const maxVotes = Math.max(0, ...Object.values(tally))
  const sortedPlayers = [...players].sort((a, b) => (tally[b.id] ?? 0) - (tally[a.id] ?? 0))
  const winnerNames = winnerIds.map((id) => players.find((p) => p.id === id)?.name).filter(Boolean)

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs text-textMuted uppercase tracking-wider text-center">{prompt?.en}</p>

      <div className="bg-rose/10 border-[1.5px] border-rose rounded-2xl p-5 text-center">
        <p className="text-xl font-bold font-display text-rose">
          {winnerNames.length > 0 ? winnerNames.join(' & ') : 'No votes this round'}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {sortedPlayers.map((p) => {
          const votes = tally[p.id] ?? 0
          const isWinner = winnerIds.includes(p.id)
          const pct = maxVotes > 0 ? (votes / maxVotes) * 100 : 0
          return (
            <div key={p.id} className="flex items-center gap-3">
              <span className={`text-sm w-24 truncate flex-shrink-0 font-medium ${isWinner ? 'text-rose font-bold' : 'text-textPrimary'}`}>
                {p.name}
              </span>
              <div className="flex-1 h-6 rounded-full bg-surfaceMuted overflow-hidden">
                <div
                  className={`h-full rounded-full ${isWinner ? 'bg-rose' : 'bg-textMuted/40'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm font-bold text-textPrimary tabular-nums w-6 text-right">{votes}</span>
            </div>
          )
        })}
      </div>

      {isHost ? (
        <button
          onClick={onNextRound}
          disabled={advancing}
          className="min-h-[44px] rounded-xl bg-rose text-onRose font-bold disabled:opacity-40 transition-opacity"
        >
          {isLastRound ? `${t('seeFinalResults')} →` : `${t('nextRound')} →`}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">{t('waitingForHostContinue')}</p>
      )}
    </div>
  )
}
