export function RevealScreen({ tally, votedOutId, players, actualBhedId, caught, isHost, onContinue }) {
  const votedOutPlayer = players.find(p => p.id === votedOutId)
  const ranked = [...players]
    .filter(p => (tally[p.id] ?? 0) > 0)
    .sort((a, b) => (tally[b.id] ?? 0) - (tally[a.id] ?? 0))

  return (
    <div className="flex-1 flex flex-col items-center py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Vote Results</p>

      <div className="flex flex-col gap-1.5 w-full">
        {ranked.map(p => (
          <div key={p.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-surfaceElevated border border-border/60">
            <span className="text-sm font-semibold text-textPrimary">{p.avatar} {p.name}</span>
            <span className="text-sm font-bold text-emerald">{tally[p.id]} vote{tally[p.id] === 1 ? '' : 's'}</span>
          </div>
        ))}
        {ranked.length === 0 && (
          <p className="text-center text-textMuted text-sm">Nobody voted.</p>
        )}
      </div>

      <div className="w-full bg-surfaceElevated border-[1.5px] border-emerald rounded-2xl p-6 text-center">
        {votedOutPlayer ? (
          <p className="text-lg font-bold font-display text-textPrimary">
            The room voted out {votedOutPlayer.name}
          </p>
        ) : (
          <p className="text-lg font-bold font-display text-textPrimary">The vote was tied — no clear consensus</p>
        )}
        <p className="text-sm text-textMuted mt-2">
          {caught ? 'That was the Bhed! Correctly caught.' : 'The Bhed evaded detection.'}
        </p>
      </div>

      {isHost ? (
        <button
          onClick={onContinue}
          className="min-h-[44px] w-full rounded-xl bg-emerald text-onEmerald font-bold"
        >
          Continue →
        </button>
      ) : (
        <p className="text-xs text-textMuted">Waiting for the host to continue...</p>
      )}
    </div>
  )
}
