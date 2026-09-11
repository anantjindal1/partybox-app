const WORD = 'DONKEY'

export function RoundRevealScreen({ lastRoundResult, players, isHost, onNextRound, advancing }) {
  if (!lastRoundResult) return null
  const { roundNumber, donkeyId, lettersAfter, eliminated, matchWinnerId } = lastRoundResult

  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? 'Player'
  }

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs text-textMuted uppercase tracking-wider text-center">
        Round {roundNumber + 1}
      </p>

      <div className="rounded-2xl p-5 text-center border-[1.5px] border-amber bg-amber/10">
        <p className="text-xl font-bold font-display text-amber">
          {nameOf(donkeyId)} was last to react!
        </p>
        <div className="flex justify-center gap-1.5 mt-3">
          {WORD.split('').map((letter, i) => (
            <span
              key={i}
              className={`w-8 h-9 flex items-center justify-center rounded-lg text-sm font-bold border-[1.5px] ${
                i < lettersAfter.length
                  ? 'border-amber bg-amber text-onAmber'
                  : 'border-border text-textMuted'
              }`}
            >
              {letter}
            </span>
          ))}
        </div>
        {eliminated && (
          <p className="text-sm font-bold text-error mt-3 uppercase tracking-wider">
            {nameOf(donkeyId)} is eliminated!
          </p>
        )}
      </div>

      {isHost ? (
        <button
          onClick={onNextRound}
          disabled={advancing}
          className="min-h-[44px] rounded-xl bg-amber text-onAmber font-bold disabled:opacity-40 transition-opacity"
        >
          {matchWinnerId ? 'See Final Results →' : 'Next Round →'}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">Waiting for the host to continue…</p>
      )}
    </div>
  )
}
