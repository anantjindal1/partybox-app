import { getTeamA, getTeamB } from './mendikotLogic'
import { MendikotIcon } from '../../components/gameIcons'

export function ResultsScreen({ turnOrder, players, winningTeam, isMendikot, teamTricks, tensCaptured, myId, isHost, onRematch, onHome }) {
  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? 'Player'
  }
  function teamNames(ids) {
    return ids.map(nameOf).join(' & ')
  }

  const teamAIds = getTeamA(turnOrder)
  const teamBIds = getTeamB(turnOrder)
  const myTeamIds = teamAIds.includes(myId) ? teamAIds : teamBIds

  const teams = [
    { key: 'teamA', ids: teamAIds },
    { key: 'teamB', ids: teamBIds }
  ].sort((a, b) => (a.key === winningTeam ? -1 : 1))

  return (
    <div className="flex-1 flex flex-col py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full border-[1.5px] border-citrine text-citrine flex items-center justify-center">
          <MendikotIcon width="30" height="30" />
        </div>
        {isMendikot && (
          <p className="text-sm font-bold text-citrine uppercase tracking-wider">Mendikot! All four 10s captured</p>
        )}
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Winner</p>
        <p className="text-2xl font-bold font-display text-textPrimary">
          {teamNames(winningTeam === 'teamA' ? teamAIds : teamBIds)}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {teams.map(({ key, ids }) => (
          <div
            key={key}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] ${
              ids === myTeamIds ? 'border-citrine bg-citrine/10' : 'border-border bg-surfaceElevated'
            }`}
          >
            <span className="text-sm font-semibold text-textPrimary">
              {teamNames(ids)}{ids === myTeamIds ? ' (You)' : ''}
            </span>
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-citrine tabular-nums">{tensCaptured[key]} tens</span>
              <span className="text-xs text-textMuted tabular-nums">{teamTricks[key]} tricks</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {isHost && (
          <button onClick={onRematch} className="min-h-[44px] rounded-xl bg-citrine text-onCitrine font-bold">
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
