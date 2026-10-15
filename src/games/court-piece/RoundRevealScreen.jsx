import { getTeamA, getTeamB, GAME_TARGET, SHUTOUT_EXTENSION_TARGET } from './courtPieceLogic'
import { SeatManagement } from '../../components/cards/SeatManagement'
import { useLang } from '../../store/LangContext'

const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }

export function RoundRevealScreen({ lastRoundResult, players, turnOrder, isHost, onNextRound, advancing, seatManagement }) {
  const { t } = useLang()
  if (!lastRoundResult) return null
  const { roundNumber, trumpSuit, callerId, teamHands, winningTeam, isKot, pointsAwarded, gameScoresAfter, roundsWonAfter, gameWinner } = lastRoundResult

  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? t('player')
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
        {t('cpHeader', { n: roundNumber, suit: SUIT_LABEL[trumpSuit], name: callerName })}
      </p>

      <div className="bg-jade/10 border-[1.5px] border-jade rounded-2xl p-5 text-center">
        <p className="text-xl font-bold font-display text-jade">
          {t('wonThisRound', { names: teamNames(winningTeam === 'teamA' ? teamAIds : teamBIds) })}
        </p>
        {isKot && <p className="text-sm font-bold text-jade mt-1">{t('cpKot')}</p>}
        <p className="text-sm text-textMuted mt-1">{pointsAwarded === 1 ? t('gamePointOne', { n: pointsAwarded }) : t('gamePointMany', { n: pointsAwarded })}</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] border-border bg-surfaceElevated">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-textPrimary">{teamNames(teamAIds)}</span>
            <span className="text-xs text-textMuted">{t('handsThisRound', { n: teamHands.teamA })}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-jade tabular-nums">{t('nRounds', { n: roundsWonAfter.teamA })}</span>
            <span className="text-xs text-textMuted tabular-nums">{t('nPts', { n: gameScoresAfter.teamA })}</span>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] border-border bg-surfaceElevated">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-textPrimary">{teamNames(teamBIds)}</span>
            <span className="text-xs text-textMuted">{t('handsThisRound', { n: teamHands.teamB })}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-jade tabular-nums">{t('nRounds', { n: roundsWonAfter.teamB })}</span>
            <span className="text-xs text-textMuted tabular-nums">{t('nPts', { n: gameScoresAfter.teamB })}</span>
          </div>
        </div>
      </div>

      {shutoutActive && (
        <p className="text-center text-xs text-error">
          {t('cpShutout', { names: teamNames(shutoutTeam === 'teamA' ? teamAIds : teamBIds), target: GAME_TARGET, ext: SHUTOUT_EXTENSION_TARGET })}
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
          {seatManagement.openSeats.length === 1 ? t('waitingSeat1') : t('waitingSeatsN', { n: seatManagement.openSeats.length })}
        </p>
      ) : isHost ? (
        <button
          onClick={onNextRound}
          disabled={advancing}
          className="min-h-[44px] rounded-xl bg-jade text-onJade font-bold disabled:opacity-40 transition-opacity"
        >
          {gameWinner ? t('finalResultsArrow') : t('nextRoundArrow')}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">{t('waitingForHostContinue')}</p>
      )}
    </div>
  )
}
