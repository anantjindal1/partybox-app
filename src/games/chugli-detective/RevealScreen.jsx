export function RevealScreen({ lastResult, players, confessionIndex, totalConfessions, isHost, isLast, onNext, advancing }) {
  if (!lastResult) return null
  const { confessionText, authorId, correctGuesserIds, authorPoints } = lastResult

  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? 'Player'
  }

  return (
    <div className="flex-1 flex flex-col gap-5 px-4 sm:px-6 py-6 max-w-lg w-full mx-auto">
      <p className="text-xs text-textMuted uppercase tracking-wider text-center">
        Confession {confessionIndex + 1} of {totalConfessions}
      </p>
      <p className="text-sm text-textMuted text-center italic">"{confessionText}"</p>

      <div className="rounded-2xl p-5 text-center border-[1.5px] bg-cerulean/10 border-cerulean">
        <p className="text-xl font-bold font-display text-cerulean">{nameOf(authorId)} wrote this!</p>
      </div>

      <div className="flex flex-col gap-2">
        {correctGuesserIds.length > 0 ? (
          <p className="text-sm text-textPrimary text-center">
            <span className="font-semibold">{correctGuesserIds.map(nameOf).join(', ')}</span> guessed right (+1 each)
          </p>
        ) : (
          <p className="text-sm text-textPrimary text-center">Nobody guessed right!</p>
        )}
        {authorPoints > 0 && (
          <p className="text-sm text-textPrimary text-center">
            {nameOf(authorId)} fooled {authorPoints} {authorPoints === 1 ? 'person' : 'people'} (+{authorPoints})
          </p>
        )}
      </div>

      {isHost ? (
        <button
          onClick={onNext}
          disabled={advancing}
          className="min-h-[44px] rounded-xl bg-cerulean text-onCerulean font-bold disabled:opacity-40 transition-opacity"
        >
          {isLast ? 'See Final Results →' : 'Next Confession →'}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">Waiting for the host to continue…</p>
      )}
    </div>
  )
}
