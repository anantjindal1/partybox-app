export function ResultsScreen({ players, teams, winner, loseReason, myId, isHost, onRematch, onHome }) {
  const winnerLabel = winner === 'red' ? 'Red' : 'Blue'
  const winnerColorClass = winner === 'red' ? 'text-maroon' : 'text-cobalt'
  const reasonText =
    loseReason === 'assassin'
      ? `${winner === 'red' ? 'Blue' : 'Red'} team tapped the assassin!`
      : `${winnerLabel} team found all their words!`
  const myTeam = teams.red.includes(myId) ? 'red' : teams.blue.includes(myId) ? 'blue' : null

  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? 'Player'
  }

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Game Over</p>
        <p className={`text-2xl font-bold font-display ${winnerColorClass}`}>{winnerLabel} Team Wins!</p>
        <p className="text-sm text-textMuted">{reasonText}</p>
        {myTeam && (
          <p className="text-sm font-semibold text-textPrimary">
            {myTeam === winner ? 'You won! 🎉' : 'Better luck next time!'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border-[1.5px] border-maroon bg-maroon/10 p-3">
          <p className="text-xs font-bold text-maroon uppercase mb-1">Red</p>
          {teams.red.map(id => (
            <p key={id} className="text-sm text-textPrimary">{nameOf(id)}</p>
          ))}
        </div>
        <div className="rounded-xl border-[1.5px] border-cobalt bg-cobalt/10 p-3">
          <p className="text-xs font-bold text-cobalt uppercase mb-1">Blue</p>
          {teams.blue.map(id => (
            <p key={id} className="text-sm text-textPrimary">{nameOf(id)}</p>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {isHost ? (
          <button onClick={onRematch} className="min-h-[44px] rounded-xl bg-sage text-onSage font-bold">
            Rematch →
          </button>
        ) : (
          <p className="text-center text-textMuted text-sm">Waiting for the host…</p>
        )}
        <button onClick={onHome} className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-semibold">
          Home
        </button>
      </div>
    </div>
  )
}
