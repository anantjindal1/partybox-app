const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }

export function HandRevealScreen({ lastHandResult, players, isHost, onNextHand, advancing }) {
  if (!lastHandResult) return null
  const { handNumber, targets, tricksWon, handScores, matchScoresAfter, trumpSuit, trumpMode, callerId, winnerIds } = lastHandResult

  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? 'Player'
  }

  const rows = Object.keys(targets)

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs text-textMuted uppercase tracking-wider text-center">
        Hand {handNumber + 1} — Trump: {SUIT_LABEL[trumpSuit]} ({trumpMode}) — Called by {nameOf(callerId)}
      </p>

      <div className="flex flex-col gap-2">
        {rows.map(id => {
          const score = handScores[id]
          return (
            <div key={id} className="flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] border-border bg-surfaceElevated">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-textPrimary">{nameOf(id)}</span>
                <span className="text-xs text-textMuted">Target {targets[id]} — won {tricksWon[id] ?? 0}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-sm font-bold tabular-nums ${score >= 0 ? 'text-orchid' : 'text-error'}`}>
                  {score >= 0 ? '+' : ''}{score}
                </span>
                <span className="text-xs text-textMuted tabular-nums">{matchScoresAfter[id]} total</span>
              </div>
            </div>
          )
        })}
      </div>

      {isHost ? (
        <button
          onClick={onNextHand}
          disabled={advancing}
          className="min-h-[44px] rounded-xl bg-orchid text-onOrchid font-bold disabled:opacity-40 transition-opacity"
        >
          {winnerIds ? 'See Final Results →' : 'Next Hand →'}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">Waiting for the host to continue…</p>
      )}
    </div>
  )
}
