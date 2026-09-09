import { MaskIcon } from '../../components/gameIcons'

export function ResultsScreen({ winner, isHost, onRematch, onHome }) {
  return (
    <div className="flex-1 flex flex-col py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full border-[1.5px] border-indigo text-indigo flex items-center justify-center">
          <MaskIcon width="30" height="30" />
        </div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Winner</p>
        <p className="text-2xl font-bold font-display text-textPrimary">{winner?.name ?? '—'}</p>
        <p className="text-sm text-textMuted">Emptied their hand first!</p>
      </div>

      <div className="flex flex-col gap-3">
        {isHost ? (
          <button onClick={onRematch} className="min-h-[44px] rounded-xl bg-indigo text-onIndigo font-bold">
            Rematch →
          </button>
        ) : null}
        <button onClick={onHome} className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-semibold">
          Home
        </button>
      </div>
    </div>
  )
}
