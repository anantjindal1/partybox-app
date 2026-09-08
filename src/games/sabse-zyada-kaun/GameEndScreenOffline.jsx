import { ACTIONS } from './reducer'

export function GameEndScreenOffline({ state, dispatch }) {
  const leaderboard = [...state.players].sort((a, b) => (state.wins[b.id] ?? 0) - (state.wins[a.id] ?? 0))
  const champion = leaderboard[0]
  const nameFor = (id) => state.players.find((p) => p.id === id)?.name ?? '—'

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Life of the Party</p>
        <p className="text-2xl font-bold font-display text-textPrimary">{champion?.name ?? '—'}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        {leaderboard.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] ${
              i === 0 ? 'border-rose bg-rose/10' : 'border-border bg-surfaceElevated'
            }`}
          >
            <span className="text-sm font-semibold text-textPrimary">{i + 1}. {p.name}</span>
            <span className="text-sm font-bold text-rose tabular-nums">{state.wins[p.id] ?? 0}</span>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Superlative Awards</p>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {state.history.map((entry, i) => (
            <div key={i} className="flex items-start justify-between gap-3 px-3 py-2 rounded-lg bg-surfaceMuted/50">
              <span className="text-xs text-textMuted flex-1">{entry.promptEn}</span>
              <span className="text-xs font-semibold text-textPrimary text-right">
                {entry.winnerIds.map(nameFor).join(' & ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => dispatch({ type: ACTIONS.PLAY_AGAIN })}
        className="min-h-[44px] rounded-xl bg-rose text-onRose font-bold"
      >
        Play Again →
      </button>
    </div>
  )
}
