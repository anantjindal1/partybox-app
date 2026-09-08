import { ACTIONS } from './reducer'

export function RoundResultScreen({ state, dispatch }) {
  const lastEntry = state.history[state.history.length - 1]
  const winnerNames = (lastEntry?.winnerIds ?? [])
    .map((id) => state.players.find((p) => p.id === id)?.name)
    .filter(Boolean)

  const leaderboard = [...state.players].sort((a, b) => (state.wins[b.id] ?? 0) - (state.wins[a.id] ?? 0))
  const isLastRound = state.currentRound >= state.roundCount

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="bg-rose/10 border-[1.5px] border-rose rounded-2xl p-6 text-center">
        <p className="text-xs text-textMuted uppercase tracking-wider mb-2">{lastEntry?.promptEn}</p>
        <p className="text-2xl font-bold font-display text-rose">
          {winnerNames.join(' & ')}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Wins so far</p>
        <div className="flex flex-col gap-1.5">
          {leaderboard.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surfaceMuted/50">
              <span className="text-sm text-textPrimary font-medium">{i + 1}. {p.name}</span>
              <span className="text-sm font-bold text-textPrimary tabular-nums">{state.wins[p.id] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => dispatch({ type: ACTIONS.NEXT_ROUND })}
        className="min-h-[44px] rounded-xl bg-rose text-onRose font-bold"
      >
        {isLastRound ? 'See Final Results →' : 'Next Round →'}
      </button>
    </div>
  )
}
