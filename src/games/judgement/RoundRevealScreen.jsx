import { SeatManagement } from '../../components/cards/SeatManagement'
import { useLang } from '../../store/LangContext'

const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }

export function RoundRevealScreen({ lastRoundResult, roundNumber, totalRounds, players, isHost, isLastRound, onNextRound, advancing, seatManagement }) {
  const { t } = useLang()
  const perPlayer = lastRoundResult?.perPlayer ?? {}
  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? t('player')
  }

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs text-textMuted uppercase tracking-wider text-center">
        {t('jRevealHeader', { n: roundNumber, total: totalRounds, size: lastRoundResult?.handSize, suit: SUIT_LABEL[lastRoundResult?.trumpSuit] })}
      </p>

      <div className="flex flex-col gap-2">
        {players.map(p => {
          const r = perPlayer[p.id]
          if (!r) return null
          const made = r.handsWon === r.bid
          return (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] border-border bg-surfaceElevated">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-textPrimary">{p.name}</span>
                <span className="text-xs text-textMuted">
                  {t('bidWon', { bid: r.bid, won: r.handsWon })}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-sm font-bold tabular-nums ${made ? 'text-peridot' : 'text-error'}`}>
                  {r.scoreDelta > 0 ? '+' : ''}{r.scoreDelta}
                </span>
                <span className="text-xs text-textMuted tabular-nums">{t('totalScore', { n: r.cumulativeAfter })}</span>
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
          className="min-h-[44px] rounded-xl bg-peridot text-onPeridot font-bold disabled:opacity-40 transition-opacity"
        >
          {isLastRound ? t('finalResultsArrow') : t('nextRoundArrow')}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">{t('waitingForHostContinue')}</p>
      )}
    </div>
  )
}
