import { getTeamA, getTeamB, GAME_TARGET, SHUTOUT_EXTENSION_TARGET } from './courtPieceLogic'
import { SeatManagement } from '../../components/cards/SeatManagement'

const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }

export function RoundRevealScreen({ lastRoundResult, players, turnOrder, isHost, onNextRound, advancing, seatManagement }) {
  if (!lastRoundResult) return null
  const { roundNumber, trumpSuit, callerId, teamHands, winningTeam, isKot, pointsAwarded, gameScoresAfter, roundsWonAfter, gameWinner } = lastRoundResult

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
  // the game hasn't ended because the other team hasn't won a round yet.
  const shutoutTeam = gameScoresAfter.teamA >= GAME_TARGET ? 'teamA'
    : gameScoresAfter.teamB >= GAME_TARGET ? 'teamB' : null
  const shutoutActive = !gameWinner && shutoutTeam && roundsWonAfter[shutoutTeam === 'teamA' ? 'teamB' : 'teamA'] === 0

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs text-textMuted uppercase tracking-wider text-center">
        Round {roundNumber} — Trump: {SUIT_LABEL[trumpSuit]} — Called by {callerName}
      </p>

      <div className="bg-jade/10 border-[1.5px] border-jade rounded-2xl p-5 text-center">
        <p className="text-xl font-bold font-display text-jade">
          {teamNames(winningTeam === 'teamA' ? teamAIds : teamBIds)} won this round
        </p>
        {isKot && <p className="text-sm font-bold text-jade mt-1">KOT — swept all 13 hands!</p>}
        <p className="text-sm text-textMuted mt-1">+{pointsAwarded} game point{pointsAwarded === 1 ? '' : 's'}</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] border-border bg-surfaceElevated">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-textPrimary">{teamNames(teamAIds)}</span>
            <span className="text-xs text-textMuted">{teamHands.teamA} hands this round</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-jade tabular-nums">{roundsWonAfter.teamA} rounds</span>
            <span className="text-xs text-textMuted tabular-nums">{gameScoresAfter.teamA} pts</span>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] border-border bg-surfaceElevated">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-textPrimary">{teamNames(teamBIds)}</span>
            <span className="text-xs text-textMuted">{teamHands.teamB} hands this round</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-jade tabular-nums">{roundsWonAfter.teamB} rounds</span>
            <span className="text-xs text-textMuted tabular-nums">{gameScoresAfter.teamB} pts</span>
          </div>
        </div>
      </div>

      {shutoutActive && (
        <p className="text-center text-xs text-error">
          {teamNames(shutoutTeam === 'teamA' ? teamAIds : teamBIds)} reached {GAME_TARGET} points, but the other team hasn't won a round yet —
          the game continues until they reach {SHUTOUT_EXTENSION_TARGET} or the other team wins one round.
        </p>
      )}

      {seatManagement && (
        <SeatManagement
          turnOrder={seatManagement.turnOrder}
          openSeats={seatManagement.openSeats}
          myId={seatManagement.myId}
          isSpectator={seatManagement.isSpectator}
          nameOf={nameOf}
          onLeaveSeat={seatManagement.onLeaveSeat}
          onClaimSeat={seatManagement.onClaimSeat}
        />
      )}

      {seatManagement && seatManagement.openSeats.length > 0 ? (
        <p className="text-center text-textMuted text-sm">
          Waiting for {seatManagement.openSeats.length === 1 ? 'an empty seat' : `${seatManagement.openSeats.length} empty seats`} to be filled before continuing…
        </p>
      ) : isHost ? (
        <button
          onClick={onNextRound}
          disabled={advancing}
          className="min-h-[44px] rounded-xl bg-jade text-onJade font-bold disabled:opacity-40 transition-opacity"
        >
          {gameWinner ? 'See Final Results →' : 'Next Round →'}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">Waiting for the host to continue…</p>
      )}
    </div>
  )
}
