import { SeatManagement } from '../../components/cards/SeatManagement'

const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }

export function HandRevealScreen({ lastHandResult, players, isHost, onNextHand, advancing, seatManagement }) {
  if (!lastHandResult) return null
  const {
    handNumber, bid, trumpSuit, gameLeadTeamIds, defenderTeamIds,
    gameLeadTricks, defenderTricks, winner, isTeri, handPoints,
    shufflerBefore, shufflerAfter, burstPlayerId, matchWinnerTeam
  } = lastHandResult

  function nameOf(id) {
    return players.find(p => p.id === id)?.name ?? 'Player'
  }
  function teamNames(ids) {
    return ids.map(nameOf).join(' & ')
  }

  const gameLeadWon = winner === 'gameLead'

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs text-textMuted uppercase tracking-wider text-center">
        Hand {handNumber + 1} — Bid {bid} in {SUIT_LABEL[trumpSuit]} — GameLead: {teamNames(gameLeadTeamIds)}
      </p>

      <div className={`rounded-2xl p-5 text-center border-[1.5px] ${gameLeadWon ? 'bg-cobalt/10 border-cobalt' : 'bg-error/10 border-error'}`}>
        <p className={`text-xl font-bold font-display ${gameLeadWon ? 'text-cobalt' : 'text-error'}`}>
          {gameLeadWon ? teamNames(gameLeadTeamIds) : teamNames(defenderTeamIds)} won this hand
        </p>
        {isTeri && <p className="text-sm font-bold mt-1 uppercase tracking-wider">Teri — swept all 13 tricks!</p>}
        <p className="text-sm text-textMuted mt-1">
          {handPoints >= 0 ? '+' : ''}{handPoints} points for {teamNames(gameLeadTeamIds)}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] border-border bg-surfaceElevated">
          <span className="text-sm font-semibold text-textPrimary">{teamNames(gameLeadTeamIds)} (GameLead)</span>
          <span className="text-sm font-bold text-textPrimary tabular-nums">{gameLeadTricks} tricks</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] border-border bg-surfaceElevated">
          <span className="text-sm font-semibold text-textPrimary">{teamNames(defenderTeamIds)}</span>
          <span className="text-sm font-bold text-textPrimary tabular-nums">{defenderTricks} tricks</span>
        </div>
      </div>

      <div className="rounded-xl border-[1.5px] border-border bg-surfaceElevated px-4 py-3 text-center">
        <p className="text-xs text-textMuted uppercase tracking-wider mb-1">Shuffler</p>
        {shufflerBefore.id === shufflerAfter.id ? (
          <p className="text-sm text-textPrimary">
            {nameOf(shufflerAfter.id)} stays shuffler — score {shufflerBefore.score} → <span className="font-bold">{shufflerAfter.score}</span>
          </p>
        ) : burstPlayerId ? (
          <p className="text-sm text-textPrimary">
            {nameOf(burstPlayerId)} passed 52 — {nameOf(shufflerAfter.id)} is now shuffler at 0
          </p>
        ) : (
          <p className="text-sm text-textPrimary">
            Score went negative — {nameOf(shufflerAfter.id)} is now shuffler at {shufflerAfter.score}
          </p>
        )}
      </div>

      {/* Seat management — only present for the LIVE hand-reveal (never
          the read-only "view last hand" overlay reuse of this same
          component, which simply omits this prop). A vacated seat stays
          visible here (never silently dropped) so a spectator has
          something to tap, and the host can't deal the next hand until
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
          Waiting for {seatManagement.openSeats.length === 1 ? 'an empty seat' : `${seatManagement.openSeats.length} empty seats`} to be filled before continuing…
        </p>
      ) : isHost ? (
        <button
          onClick={onNextHand}
          disabled={advancing}
          className="min-h-[44px] rounded-xl bg-cobalt text-onCobalt font-bold disabled:opacity-40 transition-opacity"
        >
          {matchWinnerTeam ? 'See Final Results →' : 'Next Hand →'}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">Waiting for the host to continue…</p>
      )}
    </div>
  )
}
