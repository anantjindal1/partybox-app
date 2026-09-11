import { DonkeyIcon } from '../../components/gameIcons'

export function ResultsScreen({ players, eliminatedPlayerIds, matchWinnerId, myId, isHost, onRematch, onHome }) {
  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? 'Player'
  }

  // Winner first, then most-recently-eliminated (runner-up) down to the
  // first player ever eliminated (last place).
  const ranked = [matchWinnerId, ...[...eliminatedPlayerIds].reverse()]

  return (
    <div className="flex-1 flex flex-col py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full border-[1.5px] border-amber text-amber flex items-center justify-center">
          <DonkeyIcon width="30" height="30" />
        </div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Winner</p>
        <p className="text-2xl font-bold font-display text-textPrimary">{nameOf(matchWinnerId)}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        {ranked.map((id, i) => (
          <div
            key={id}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] ${
              id === myId ? 'border-amber bg-amber/10' : 'border-border bg-surfaceElevated'
            }`}
          >
            <span className="text-sm font-semibold text-textPrimary">
              {i + 1}. {nameOf(id)}{id === myId ? ' (You)' : ''}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {isHost && (
          <button onClick={onRematch} className="min-h-[44px] rounded-xl bg-amber text-onAmber font-bold">
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
