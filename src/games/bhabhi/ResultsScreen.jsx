import { DoorExitIcon } from '../../components/gameIcons'

export function ResultsScreen({ players, winners, myId, isHost, onRematch, onHome }) {
  const winnerId = winners[0]
  const winnerName = players.find(p => p.id === winnerId)?.name ?? 'Player'
  const iWon = winnerId === myId

  return (
    <div className="flex-1 flex flex-col py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full border-[1.5px] border-slate text-slate flex items-center justify-center">
          <DoorExitIcon width="30" height="30" />
        </div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Got Away First</p>
        <p className="text-2xl font-bold font-display text-textPrimary">{winnerName}{iWon ? ' (You)' : ''}</p>
        <p className="text-sm text-textMuted">
          {iWon ? 'You emptied your hand first — you win!' : 'Emptied their hand first and won the game.'}
        </p>
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
