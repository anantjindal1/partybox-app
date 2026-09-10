import { SevenIcon } from '../../components/gameIcons'

export function ResultsScreen({ players, winnerIds, hands, myId, isHost, onRematch, onHome }) {
  const ranked = [...players].sort((a, b) => (hands[a.id]?.length ?? 0) - (hands[b.id]?.length ?? 0))
  const winners = players.filter(p => winnerIds.includes(p.id))
  const amIWinner = winnerIds.includes(myId)

  return (
    <div className="flex-1 flex flex-col py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full border-[1.5px] border-amethyst text-amethyst flex items-center justify-center">
          <SevenIcon width="30" height="30" />
        </div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">
          {winners.length > 1 ? 'Winners' : 'Winner'}
        </p>
        <p className="text-2xl font-bold font-display text-textPrimary">
          {winners.map(w => w.name).join(' & ')}
        </p>
        {amIWinner && <p className="text-sm text-textMuted">That's you!</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        {ranked.map(p => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] ${
              winnerIds.includes(p.id) ? 'border-amethyst bg-amethyst/10' : 'border-border bg-surfaceElevated'
            }`}
          >
            <span className="text-sm font-semibold text-textPrimary">
              {p.name}{p.id === myId ? ' (You)' : ''}
            </span>
            <span className="text-sm font-bold text-amethyst tabular-nums">
              {hands[p.id]?.length ?? 0} card{(hands[p.id]?.length ?? 0) === 1 ? '' : 's'} left
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {isHost && (
          <button onClick={onRematch} className="min-h-[44px] rounded-xl bg-amethyst text-onAmethyst font-bold">
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
