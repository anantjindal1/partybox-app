export function LobbyScreen({ isHost, minPlayers, players, onStart, starting }) {
  const canStart = isHost && players.length >= minPlayers && !starting

  return (
    <div className="flex flex-col gap-5 max-w-lg w-full mx-auto pt-2">
      <div className="rounded-xl border-[1.5px] border-border bg-surfaceElevated p-4">
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">How to play</p>
        <p className="text-sm text-textPrimary">
          Everyone secretly writes an "I once…" confession. One at a time, the room reads a confession
          out and guesses who wrote it — everyone except the author votes. Guess right and you score a
          point; fool the room and the author scores instead.
        </p>
      </div>

      {isHost ? (
        <button
          onClick={onStart}
          disabled={!canStart}
          className="min-h-[48px] rounded-xl bg-cerulean text-onCerulean font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {starting ? 'Starting...' : players.length < minPlayers ? `Waiting for players (${players.length}/${minPlayers})` : 'Start Game →'}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">Waiting for host to start...</p>
      )}
    </div>
  )
}
