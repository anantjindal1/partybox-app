/**
 * The "between hands" seat list — lets an active player give up their
 * seat and a spectator claim an open one. Rendered inside a game's own
 * hand/round-reveal screen (the one safe pause point between deals);
 * that screen is responsible for gating its own "next hand" button on
 * `openSeats.length === 0` so play can't continue with an empty seat.
 */
export function SeatManagement({ turnOrder, openSeats, myId, isSpectator, nameOf, onLeaveSeat, onClaimSeat }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-textMuted uppercase tracking-wider text-center">Seats</p>
      {turnOrder.map(seatId => {
        const isOpen = openSeats.includes(seatId)
        const isMe = seatId === myId
        return (
          <div
            key={seatId}
            className={`flex items-center justify-between px-4 py-2.5 rounded-xl border-[1.5px] ${
              isOpen ? 'border-error/50 bg-error/5' : 'border-border bg-surfaceElevated'
            }`}
          >
            <span className="text-sm font-semibold text-textPrimary">
              {isOpen ? 'Empty seat' : nameOf(seatId)}
            </span>
            {isOpen && isSpectator ? (
              <button
                onClick={() => onClaimSeat(seatId)}
                className="text-xs font-bold text-cobalt border-[1.5px] border-cobalt rounded-lg px-3 py-1.5"
              >
                Join this seat →
              </button>
            ) : isOpen ? (
              <span className="text-xs text-textMuted">Waiting for a player…</span>
            ) : isMe ? (
              <button
                onClick={onLeaveSeat}
                className="text-xs font-semibold text-error border-[1.5px] border-error/40 rounded-lg px-3 py-1.5"
              >
                Leave Seat
              </button>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
