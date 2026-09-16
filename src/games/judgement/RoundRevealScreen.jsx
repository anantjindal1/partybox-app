import { SeatManagement } from '../../components/cards/SeatManagement'

const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }

export function RoundRevealScreen({ lastRoundResult, roundNumber, totalRounds, players, isHost, isLastRound, onNextRound, advancing, seatManagement }) {
  const perPlayer = lastRoundResult?.perPlayer ?? {}
  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? 'Player'
  }

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs text-textMuted uppercase tracking-wider text-center">
        Round {roundNumber} of {totalRounds} — {lastRoundResult?.handSize}-card hand — Trump: {SUIT_LABEL[lastRoundResult?.trumpSuit]}
      </p>

      <div className="flex flex-col gap-2">
        {players.map(p => {
          const r = perPlayer[p.id]
          if (!r) return null
          const made = r.tricksWon === r.bid
          return (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] border-border bg-surfaceElevated">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-textPrimary">{p.name}</span>
                <span className="text-xs text-textMuted">
                  Bid {r.bid} · Won {r.tricksWon}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-sm font-bold tabular-nums ${made ? 'text-peridot' : 'text-error'}`}>
                  {r.scoreDelta > 0 ? '+' : ''}{r.scoreDelta}
                </span>
                <span className="text-xs text-textMuted tabular-nums">Total: {r.cumulativeAfter}</span>
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
          Waiting for {seatManagement.openSeats.length === 1 ? 'an empty seat' : `${seatManagement.openSeats.length} empty seats`} to be filled before continuing…
        </p>
      ) : isHost ? (
        <button
          onClick={onNextRound}
          disabled={advancing}
          className="min-h-[44px] rounded-xl bg-peridot text-onPeridot font-bold disabled:opacity-40 transition-opacity"
        >
          {isLastRound ? 'See Final Results →' : 'Next Round →'}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">Waiting for the host to continue…</p>
      )}
    </div>
  )
}
