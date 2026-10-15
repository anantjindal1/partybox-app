import { SeatManagement } from '../../components/cards/SeatManagement'
import { useLang } from '../../store/LangContext'

const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }

export function RoundRevealScreen({ lastRoundResult, players, isHost, onNextRound, advancing, seatManagement }) {
  const { t } = useLang()
  if (!lastRoundResult) return null
  const {
    roundNumber, bid, trumpSuit, gameLeadTeamIds, defenderTeamIds,
    gameLeadHands, defenderHands, winner, isTeri, roundPoints,
    shufflerBefore, shufflerAfter, burstPlayerId, gameWinnerTeam
  } = lastRoundResult

  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? t('player')
  }
  function teamNames(ids) {
    return ids.map(nameOf).join(' & ')
  }

  const gameLeadWon = winner === 'gameLead'

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs text-textMuted uppercase tracking-wider text-center">
        {t('tRevealHeader', { n: roundNumber + 1, bid, suit: SUIT_LABEL[trumpSuit], names: teamNames(gameLeadTeamIds) })}
      </p>

      <div className={`rounded-2xl p-5 text-center border-[1.5px] ${gameLeadWon ? 'bg-cobalt/10 border-cobalt' : 'bg-error/10 border-error'}`}>
        <p className={`text-xl font-bold font-display ${gameLeadWon ? 'text-cobalt' : 'text-error'}`}>
          {t('wonThisRound', { names: gameLeadWon ? teamNames(gameLeadTeamIds) : teamNames(defenderTeamIds) })}
        </p>
        {isTeri && <p className="text-sm font-bold mt-1 uppercase tracking-wider">{t('tSwept')}</p>}
        <p className="text-sm text-textMuted mt-1">
          {t('tPointsFor', { pts: `${roundPoints >= 0 ? '+' : ''}${roundPoints}`, names: teamNames(gameLeadTeamIds) })}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] border-border bg-surfaceElevated">
          <span className="text-sm font-semibold text-textPrimary">{teamNames(gameLeadTeamIds)} {t('gameLeadTag')}</span>
          <span className="text-sm font-bold text-textPrimary tabular-nums">{t('nHands', { n: gameLeadHands })}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] border-border bg-surfaceElevated">
          <span className="text-sm font-semibold text-textPrimary">{teamNames(defenderTeamIds)}</span>
          <span className="text-sm font-bold text-textPrimary tabular-nums">{t('nHands', { n: defenderHands })}</span>
        </div>
      </div>

      <div className="rounded-xl border-[1.5px] border-border bg-surfaceElevated px-4 py-3 text-center">
        <p className="text-xs text-textMuted uppercase tracking-wider mb-1">{t('shuffler')}</p>
        {shufflerBefore.id === shufflerAfter.id ? (
          <p className="text-sm text-textPrimary">
            {t('tStays', { name: nameOf(shufflerAfter.id), a: shufflerBefore.score, b: shufflerAfter.score })}
          </p>
        ) : burstPlayerId ? (
          <p className="text-sm text-textPrimary">
            {t('tPassed52', { a: nameOf(burstPlayerId), b: nameOf(shufflerAfter.id) })}
          </p>
        ) : (
          <p className="text-sm text-textPrimary">
            {t('tNegative', { name: nameOf(shufflerAfter.id), n: shufflerAfter.score })}
          </p>
        )}
      </div>

      {/* Seat management — only present for the LIVE round-reveal (never
          the read-only "view last round" overlay reuse of this same
          component, which simply omits this prop). A vacated seat stays
          visible here (never silently dropped) so a spectator has
          something to tap, and the host can't deal the next round until
          every seat is filled again. */}
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
          className="min-h-[44px] rounded-xl bg-cobalt text-onCobalt font-bold disabled:opacity-40 transition-opacity"
        >
          {gameWinnerTeam ? t('finalResultsArrow') : t('nextRoundArrow')}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">{t('waitingForHostContinue')}</p>
      )}
    </div>
  )
}
