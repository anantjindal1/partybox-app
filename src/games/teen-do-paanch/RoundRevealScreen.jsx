import { SeatManagement } from '../../components/cards/SeatManagement'
import { useLang } from '../../store/LangContext'

const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }

export function RoundRevealScreen({ lastRoundResult, players, isHost, onNextRound, advancing, seatManagement }) {
  const { t } = useLang()
  if (!lastRoundResult) return null
  const { roundNumber, targets, handsWon, roundScores, gameScoresAfter, trumpSuit, trumpMode, callerId, winnerIds } = lastRoundResult

  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? t('player')
  }

  const rows = Object.keys(targets)

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs text-textMuted uppercase tracking-wider text-center">
        {t('tdpHeader', { n: roundNumber + 1, suit: SUIT_LABEL[trumpSuit], mode: t(trumpMode === 'hidden' ? 'modeHidden' : 'modeDeclared'), name: nameOf(callerId) })}
      </p>

      <div className="flex flex-col gap-2">
        {rows.map(id => {
          const score = roundScores[id]
          return (
            <div key={id} className="flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] border-border bg-surfaceElevated">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-textPrimary">{nameOf(id)}</span>
                <span className="text-xs text-textMuted">{t('tdpTarget', { t: targets[id], w: handsWon[id] ?? 0 })}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-sm font-bold tabular-nums ${score >= 0 ? 'text-orchid' : 'text-error'}`}>
                  {score >= 0 ? '+' : ''}{score}
                </span>
                <span className="text-xs text-textMuted tabular-nums">{gameScoresAfter[id]} total</span>
              </div>
            </div>
          )
        })}
      </div>

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
          className="min-h-[44px] rounded-xl bg-orchid text-onOrchid font-bold disabled:opacity-40 transition-opacity"
        >
          {winnerIds ? t('finalResultsArrow') : t('nextRoundArrow')}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">{t('waitingForHostContinue')}</p>
      )}
    </div>
  )
}
