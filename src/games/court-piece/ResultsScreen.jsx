import { getTeamA, getTeamB } from './courtPieceLogic'

function TrophyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 4h8v6a4 4 0 01-8 0V4z" />
      <path d="M8 5H5a3 3 0 003 3M16 5h3a3 3 0 01-3 3" />
      <path d="M12 14v3M9 21h6M9.5 21c0-2 1-3 2.5-4 1.5 1 2.5 2 2.5 4" />
    </svg>
  )
}

export function ResultsScreen({ turnOrder, players, matchWinner, matchScores, handsWon, myId, isHost, onRematch, onHome }) {
  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? 'Player'
  }
  function teamNames(ids) {
    return ids.map(nameOf).join(' & ')
  }

  const teamAIds = getTeamA(turnOrder)
  const teamBIds = getTeamB(turnOrder)
  const myTeamIds = teamAIds.includes(myId) ? teamAIds : teamBIds
  const isWinner = (teamAIds.includes(myId) ? 'teamA' : 'teamB') === matchWinner

  const teams = [
    { key: 'teamA', ids: teamAIds },
    { key: 'teamB', ids: teamBIds }
  ].sort((a, b) => (a.key === matchWinner ? -1 : 1))

  return (
    <div className="flex-1 flex flex-col py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full border-[1.5px] border-jade text-jade flex items-center justify-center">
          <TrophyIcon />
        </div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Winner</p>
        <p className="text-2xl font-bold font-display text-textPrimary">
          {teamNames(matchWinner === 'teamA' ? teamAIds : teamBIds)}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {teams.map(({ key, ids }) => (
          <div
            key={key}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] ${
              ids === myTeamIds ? 'border-jade bg-jade/10' : 'border-border bg-surfaceElevated'
            }`}
          >
            <span className="text-sm font-semibold text-textPrimary">
              {teamNames(ids)}{ids === myTeamIds ? ' (You)' : ''}
            </span>
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-jade tabular-nums">{handsWon[key]} hands</span>
              <span className="text-xs text-textMuted tabular-nums">{matchScores[key]} pts</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {isHost && (
          <button onClick={onRematch} className="min-h-[44px] rounded-xl bg-jade text-onJade font-bold">
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
