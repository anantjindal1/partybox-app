import { MagnifyingGlassIcon } from '../../components/gameIcons'

const REASON_TEXT = {
  wrong_person: 'The room voted out the wrong person — the Bhed evaded!',
  tie: 'The vote was tied — the Bhed evaded!',
  guessed_correctly: 'The Bhed guessed the secret word — stealing the win!',
  guessed_wrong: 'The Bhed guessed wrong — the villagers win!'
}

export function ResultsScreen({ winnerTeam, bhedPlayer, secretWord, reason, isHost, onRematch, onHome }) {
  return (
    <div className="flex-1 flex flex-col py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full border-[1.5px] border-emerald text-emerald flex items-center justify-center">
          <MagnifyingGlassIcon width="30" height="30" />
        </div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">
          {winnerTeam === 'bhed' ? 'The Bhed Wins' : 'The Villagers Win'}
        </p>
        <p className="text-2xl font-bold font-display text-textPrimary">
          {bhedPlayer?.name ?? 'Someone'} was the Bhed
        </p>
        <p className="text-sm text-textMuted">{REASON_TEXT[reason] ?? ''}</p>
      </div>

      <div className="bg-surfaceElevated border border-border/60 rounded-xl p-4 text-center">
        <p className="text-xs text-textMuted uppercase tracking-wider mb-1">The secret word was</p>
        <p className="text-lg font-bold font-display text-textPrimary">{secretWord?.word?.en}</p>
      </div>

      <div className="flex flex-col gap-3">
        {isHost ? (
          <button onClick={onRematch} className="min-h-[44px] rounded-xl bg-emerald text-onEmerald font-bold">
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
