export function ResultsScreen({ players, scores, myId, isHost, onRematch, onHome }) {
  const ranked = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
  const maxScore = Math.max(0, ...players.map(p => scores[p.id] ?? 0))
  const winners = players.filter(p => (scores[p.id] ?? 0) === maxScore && maxScore > 0)

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Top Detective</p>
        <p className="text-2xl font-bold font-display text-textPrimary">
          {winners.length > 0 ? winners.map(w => w.name).join(' & ') : '—'}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {ranked.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] ${
              p.id === myId ? 'border-cerulean bg-cerulean/10' : 'border-border bg-surfaceElevated'
            }`}
          >
            <span className="text-sm font-semibold text-textPrimary">
              {i + 1}. {p.name}{p.id === myId ? ' (You)' : ''}
            </span>
            <span className="text-sm font-bold text-cerulean tabular-nums">{scores[p.id] ?? 0}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {isHost ? (
          <button onClick={onRematch} className="min-h-[44px] rounded-xl bg-cerulean text-onCerulean font-bold">
            Rematch →
          </button>
        ) : (
          <p className="text-center text-textMuted text-sm">Waiting for the host…</p>
        )}
        <button onClick={onHome} className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-semibold">
          Home
        </button>
      </div>
    </div>
  )
}
