function MedalIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="15" r="6" />
      <path d="M9 10L6 3M15 10l3-7M9 4h6" />
      <path d="M10 15l1.5 1.5L14.5 13" />
    </svg>
  )
}

export function ResultsScreen({
  players,
  cumulativeScores,
  myId,
  isHost,
  onRematch,
  onHome,
  onRematchVote,
  rematchVoteCount,
  totalPlayers,
  t,
}) {
  const ranked = [...players].sort((a, b) => (cumulativeScores[b.id] ?? 0) - (cumulativeScores[a.id] ?? 0))
  const winner = ranked[0]

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full border-[1.5px] border-rose text-rose flex items-center justify-center">
          <MedalIcon />
        </div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">{t('winner')}</p>
        <p className="text-2xl font-bold font-display text-textPrimary">{winner?.name ?? '—'}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        {ranked.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] ${
              p.id === myId ? 'border-rose bg-rose/10' : 'border-border bg-surfaceElevated'
            }`}
          >
            <span className="text-sm font-semibold text-textPrimary">
              {i + 1}. {p.name}{p.id === myId ? ' (You)' : ''}
            </span>
            <span className="text-sm font-bold text-rose tabular-nums">{cumulativeScores[p.id] ?? 0}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {isHost ? (
          <button onClick={onRematch} className="min-h-[44px] rounded-xl bg-rose text-onRose font-bold">
            {t('rematch')} →
          </button>
        ) : (
          <button onClick={onRematchVote} className="min-h-[44px] rounded-xl bg-rose text-onRose font-bold">
            {t('voteRematch')} ({rematchVoteCount}/{totalPlayers})
          </button>
        )}
        <button onClick={onHome} className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-semibold">
          {t('home')}
        </button>
      </div>
    </div>
  )
}
