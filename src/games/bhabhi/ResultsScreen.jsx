import { DoorExitIcon } from '../../components/gameIcons'

export function ResultsScreen({ players, winners, loserId, myId, isHost, onRematch, onHome }) {
  const loser = loserId ? players.find(p => p.id === loserId) : null
  const winnerNames = winners.map(id => players.find(p => p.id === id)?.name ?? 'Player')
  const iAmLoser = myId === loserId

  return (
    <div className="flex-1 flex flex-col py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full border-[1.5px] border-slate text-slate flex items-center justify-center">
          <DoorExitIcon width="30" height="30" />
        </div>
        {loserId ? (
          <>
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">The Bhabhi</p>
            <p className="text-2xl font-bold font-display text-textPrimary">{loser?.name ?? '—'}</p>
            <p className="text-sm text-textMuted">
              {iAmLoser ? "You're the Bhabhi this time!" : 'Stuck with the cards at the end.'}
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">No Bhabhi!</p>
            <p className="text-2xl font-bold font-display text-textPrimary">Everyone got away</p>
            <p className="text-sm text-textMuted">The last players emptied their hands at the same time.</p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider text-center">Winners</p>
        {winnerNames.map((name, i) => (
          <div
            key={winners[i]}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] ${
              winners[i] === myId ? 'border-slate bg-slate/10' : 'border-border bg-surfaceElevated'
            }`}
          >
            <span className="text-sm font-semibold text-textPrimary">
              {i + 1}. {name}{winners[i] === myId ? ' (You)' : ''}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {isHost && (
          <button onClick={onRematch} className="min-h-[44px] rounded-xl bg-slate text-onSlate font-bold">
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
