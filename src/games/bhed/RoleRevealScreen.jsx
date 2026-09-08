import { MagnifyingGlassIcon } from '../../components/gameIcons'

export function RoleRevealScreen({ isBhed, secretWord, ackSent, onAck, ackedCount, totalPlayers }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-6 gap-6 text-center max-w-lg w-full mx-auto">
      <div className="w-full bg-surfaceElevated border-[1.5px] border-emerald rounded-2xl p-8 flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full border-[1.5px] border-emerald text-emerald flex items-center justify-center">
          <MagnifyingGlassIcon width="36" height="36" />
        </div>
        {isBhed ? (
          <div>
            <p className="text-xs text-textMuted uppercase tracking-wider mb-1">You are</p>
            <p className="text-2xl font-bold font-display text-textPrimary mb-2">The Bhed</p>
            <p className="text-sm text-textSecondary leading-relaxed">
              You don't know the secret word. Listen carefully to everyone's clues, blend in, and try not to get caught.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-textMuted uppercase tracking-wider mb-1">Your secret word</p>
            <p className="text-2xl font-bold font-display text-textPrimary mb-2">{secretWord?.word?.en}</p>
            <p className="text-sm text-textSecondary leading-relaxed">
              Give a clue about this word when it's your turn — not too obvious, or the Bhed will guess it.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onAck}
        disabled={ackSent}
        className="min-h-[44px] w-full rounded-xl bg-emerald text-onEmerald font-bold disabled:opacity-40 transition-opacity"
      >
        {ackSent ? `Waiting for others... (${ackedCount}/${totalPlayers})` : 'Got it'}
      </button>
    </div>
  )
}
