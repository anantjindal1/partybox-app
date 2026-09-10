import { getTeamA, getTeamB, MATCH_TARGET, SHUTOUT_EXTENSION_TARGET } from './courtPieceLogic'

const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }

export function HandRevealScreen({ lastHandResult, players, turnOrder, isHost, onNextHand, advancing }) {
  if (!lastHandResult) return null
  const { handNumber, trumpSuit, callerId, teamTricks, winningTeam, isKot, pointsAwarded, matchScoresAfter, handsWonAfter, matchWinner } = lastHandResult

  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? 'Player'
  }
  function teamNames(ids) {
    return ids.map(nameOf).join(' & ')
  }

  const teamAIds = getTeamA(turnOrder)
  const teamBIds = getTeamB(turnOrder)
  const callerName = nameOf(callerId)

  // Shutout-extension note: a team has already hit the normal target but
  // the match hasn't ended because the other team hasn't won a hand yet.
  const shutoutTeam = matchScoresAfter.teamA >= MATCH_TARGET ? 'teamA'
    : matchScoresAfter.teamB >= MATCH_TARGET ? 'teamB' : null
  const shutoutActive = !matchWinner && shutoutTeam && handsWonAfter[shutoutTeam === 'teamA' ? 'teamB' : 'teamA'] === 0

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs text-textMuted uppercase tracking-wider text-center">
        Hand {handNumber} — Trump: {SUIT_LABEL[trumpSuit]} — Called by {callerName}
      </p>

      <div className="bg-jade/10 border-[1.5px] border-jade rounded-2xl p-5 text-center">
        <p className="text-xl font-bold font-display text-jade">
          {teamNames(winningTeam === 'teamA' ? teamAIds : teamBIds)} won this hand
        </p>
        {isKot && <p className="text-sm font-bold text-jade mt-1">KOT — swept all 13 tricks!</p>}
        <p className="text-sm text-textMuted mt-1">+{pointsAwarded} match point{pointsAwarded === 1 ? '' : 's'}</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] border-border bg-surfaceElevated">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-textPrimary">{teamNames(teamAIds)}</span>
            <span className="text-xs text-textMuted">{teamTricks.teamA} tricks this hand</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-jade tabular-nums">{handsWonAfter.teamA} hands</span>
            <span className="text-xs text-textMuted tabular-nums">{matchScoresAfter.teamA} pts</span>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] border-border bg-surfaceElevated">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-textPrimary">{teamNames(teamBIds)}</span>
            <span className="text-xs text-textMuted">{teamTricks.teamB} tricks this hand</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-jade tabular-nums">{handsWonAfter.teamB} hands</span>
            <span className="text-xs text-textMuted tabular-nums">{matchScoresAfter.teamB} pts</span>
          </div>
        </div>
      </div>

      {shutoutActive && (
        <p className="text-center text-xs text-error">
          {teamNames(shutoutTeam === 'teamA' ? teamAIds : teamBIds)} reached {MATCH_TARGET} points, but the other team hasn't won a hand yet —
          the match continues until they reach {SHUTOUT_EXTENSION_TARGET} or the other team wins one hand.
        </p>
      )}

      {isHost ? (
        <button
          onClick={onNextHand}
          disabled={advancing}
          className="min-h-[44px] rounded-xl bg-jade text-onJade font-bold disabled:opacity-40 transition-opacity"
        >
          {matchWinner ? 'See Final Results →' : 'Next Hand →'}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">Waiting for the host to continue…</p>
      )}
    </div>
  )
}
