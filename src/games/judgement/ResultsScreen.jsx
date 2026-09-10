function TrophyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 4h8v6a4 4 0 01-8 0V4z" />
      <path d="M8 5H5a3 3 0 003 3M16 5h3a3 3 0 01-3 3" />
      <path d="M12 14v3M9 21h6M9.5 21c0-2 1-3 2.5-4 1.5 1 2.5 2 2.5 4" />
    </svg>
  )
}

export function ResultsScreen({ players, cumulativeScores, myId, isHost, onRematch, onHome }) {
  const ranked = [...players].sort((a, b) => (cumulativeScores[b.id] ?? 0) - (cumulativeScores[a.id] ?? 0))
  // No floor at 0 and no maxScore > 0 guard, unlike Bakwaas — a negative
  // top score is a completely normal Judgement outcome, still a winner.
  const maxScore = Math.max(...players.map(p => cumulativeScores[p.id] ?? 0))
  const winners = players.filter(p => (cumulativeScores[p.id] ?? 0) === maxScore)

  return (
    <div className="flex-1 flex flex-col py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full border-[1.5px] border-peridot text-peridot flex items-center justify-center">
          <TrophyIcon />
        </div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Winner</p>
        <p className="text-2xl font-bold font-display text-textPrimary">
          {winners.map(w => w.name).join(' & ')}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {ranked.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] ${
              p.id === myId ? 'border-peridot bg-peridot/10' : 'border-border bg-surfaceElevated'
            }`}
          >
            <span className="text-sm font-semibold text-textPrimary">
              {i + 1}. {p.name}{p.id === myId ? ' (You)' : ''}
            </span>
            <span className="text-sm font-bold text-peridot tabular-nums">
              {cumulativeScores[p.id] ?? 0}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {isHost && (
          <button onClick={onRematch} className="min-h-[44px] rounded-xl bg-peridot text-onPeridot font-bold">
            Rematch →
          </button>
        )}
        <button onClick={onHome} className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-semibold">
          Home
        </button>
      </div>
    </div>
  )
}
