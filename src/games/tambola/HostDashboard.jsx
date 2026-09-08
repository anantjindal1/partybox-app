import { PRIZES, isClaimValid } from './prizes'

const PRIZE_LABELS = {
  earlyFive: 'Early Five',
  topLine: 'Top Line',
  middleLine: 'Middle Line',
  bottomLine: 'Bottom Line',
  corners: 'Four Corners',
  fullHouse: 'Full House'
}

export function HostDashboard({
  roomState,
  players,
  onDraw,
  onPowerDraw,
  powerCandidates,
  onChoosePowerNumber,
  drawing,
  claims,
  onApproveClaim,
  onRejectClaim,
  onEndGame,
  muted,
  toggleMuted,
  ttsSupported
}) {
  const calledNumbers = roomState.calledNumbers ?? []
  const prizesWon = roomState.prizesWon ?? {}
  const powerDrawsRemaining = roomState.powerDrawsRemaining ?? 0
  const allCalled = calledNumbers.length >= 90

  function playerName(playerId) {
    return players.find(p => p.id === playerId)?.name ?? 'Player'
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl w-full mx-auto pt-2 pb-8">
      {/* Draw controls */}
      <div className="flex flex-col items-center gap-3 bg-surfaceElevated border border-border/60 rounded-2xl p-6">
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Current Number</p>
        <p className="text-6xl font-black font-display text-sapphire">
          {roomState.currentNumber ?? '—'}
        </p>

        {powerCandidates ? (
          <div className="w-full">
            <p className="text-center text-sm font-semibold text-textMuted mb-2">Power Draw — pick one</p>
            <div className="grid grid-cols-3 gap-2">
              {powerCandidates.map(n => (
                <button
                  key={n}
                  onClick={() => onChoosePowerNumber(n)}
                  className="min-h-[56px] rounded-xl bg-sapphire text-onSapphire font-black text-2xl"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex gap-3 w-full">
            <button
              onClick={onDraw}
              disabled={drawing || allCalled}
              className="flex-1 min-h-[48px] rounded-xl bg-sapphire text-onSapphire font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {allCalled ? 'All numbers called' : 'Draw Next Number'}
            </button>
            <button
              onClick={onPowerDraw}
              disabled={drawing || allCalled || powerDrawsRemaining === 0}
              className="min-h-[48px] px-4 rounded-xl border-[1.5px] border-sapphire text-sapphire font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Power ×{powerDrawsRemaining}
            </button>
          </div>
        )}

        {ttsSupported && (
          <button onClick={toggleMuted} className="text-xs text-textMuted underline">
            {muted ? 'Unmute announcer' : 'Mute announcer'}
          </button>
        )}
      </div>

      {/* 1-90 board */}
      <div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Called Numbers</p>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: 90 }, (_, i) => i + 1).map(n => (
            <div
              key={n}
              className={`aspect-square flex items-center justify-center rounded-md text-[11px] font-bold transition-colors ${
                calledNumbers.includes(n)
                  ? 'bg-sapphire text-onSapphire'
                  : 'bg-surfaceMuted text-textMuted'
              }`}
            >
              {n}
            </div>
          ))}
        </div>
      </div>

      {/* Prize checklist */}
      <div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Prizes</p>
        <div className="flex flex-col gap-1.5">
          {PRIZES.map(id => {
            const won = prizesWon[id]
            return (
              <div
                key={id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                  won ? 'bg-sapphire/10 text-textPrimary' : 'bg-surfaceElevated text-textSecondary border border-border/60'
                }`}
              >
                <span className="font-semibold">{PRIZE_LABELS[id]}</span>
                <span className={won ? 'font-bold text-sapphire' : 'text-textMuted'}>
                  {won ? won.playerName : 'Unclaimed'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Claims queue */}
      {claims.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Claims to Review</p>
          <div className="flex flex-col gap-2">
            {claims.map(claim => {
              const ticket = roomState.tickets?.[claim.playerId]
              const valid = ticket ? isClaimValid(claim.payload.prizeId, ticket, calledNumbers) : null
              return (
                <div key={claim.playerId} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-surfaceElevated border border-sapphire/50">
                  <div className="text-sm">
                    <div>
                      <span className="font-bold">{playerName(claim.playerId)}</span> claims{' '}
                      <span className="font-bold text-sapphire">{PRIZE_LABELS[claim.payload.prizeId]}</span>
                    </div>
                    {valid !== null && (
                      <span className={`text-xs font-bold ${valid ? 'text-sapphire' : 'text-error'}`}>
                        {valid ? '✓ Checks out' : '✗ Doesn\'t match called numbers'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => onApproveClaim(claim.playerId, claim.payload.prizeId)}
                      className="min-h-[36px] px-3 rounded-lg bg-sapphire text-onSapphire text-xs font-bold"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onRejectClaim(claim.playerId)}
                      className="min-h-[36px] px-3 rounded-lg border border-error/60 text-error text-xs font-bold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button
        onClick={onEndGame}
        className="min-h-[44px] rounded-xl border-[1.5px] border-error text-error font-bold"
      >
        End Game →
      </button>
    </div>
  )
}
