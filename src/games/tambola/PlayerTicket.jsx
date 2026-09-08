import { useEffect, useState } from 'react'
import { PRIZES, checkPattern } from './prizes'
import { getCell, ROWS, COLS } from './ticket'

const PRIZE_LABELS = {
  earlyFive: 'Early Five',
  topLine: 'Top Line',
  middleLine: 'Middle Line',
  bottomLine: 'Bottom Line',
  corners: 'Four Corners',
  fullHouse: 'Full House'
}

export function PlayerTicket({
  ticket,
  roomState,
  assistMode,
  storageKey,
  myPendingClaim,
  onClaim,
  muted,
  toggleMuted,
  ttsSupported
}) {
  const calledNumbers = roomState.calledNumbers ?? []
  const prizesWon = roomState.prizesWon ?? {}
  const currentNumber = roomState.currentNumber

  const [marked, setMarked] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify([...marked]))
  }, [marked, storageKey])

  function toggleMark(row, col) {
    const pos = `${row}-${col}`
    setMarked(prev => {
      const next = new Set(prev)
      if (next.has(pos)) next.delete(pos)
      else next.add(pos)
      return next
    })
  }

  if (!ticket) {
    return <p className="text-center text-textMuted py-8">Waiting for the host to deal tickets...</p>
  }

  const recentCalls = calledNumbers.slice(-6).reverse()

  return (
    <div className="flex flex-col gap-5 max-w-lg w-full mx-auto pt-2 pb-8">
      {/* Current number + recent calls */}
      <div className="flex flex-col items-center gap-2 bg-surfaceElevated border border-border/60 rounded-2xl p-5">
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Just Called</p>
        <p className="text-5xl font-black font-display text-sapphire">{currentNumber ?? '—'}</p>
        {recentCalls.length > 1 && (
          <div className="flex gap-1.5 flex-wrap justify-center mt-1">
            {recentCalls.slice(1).map(n => (
              <span key={n} className="text-xs font-semibold text-textMuted bg-surfaceMuted rounded-md px-2 py-1">{n}</span>
            ))}
          </div>
        )}
        {ttsSupported && (
          <button onClick={toggleMuted} className="text-xs text-textMuted underline mt-1">
            {muted ? 'Unmute announcer' : 'Mute announcer'}
          </button>
        )}
      </div>

      {/* Ticket */}
      <div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Your Ticket</p>
        <div className="grid grid-rows-3 gap-1 bg-surfaceElevated border-[1.5px] border-sapphire/60 rounded-xl p-2">
          {Array.from({ length: ROWS }, (_, r) => (
            <div key={r} className="grid grid-cols-9 gap-1">
              {Array.from({ length: COLS }, (_, c) => {
                const cell = getCell(ticket, r, c)
                if (cell === null) {
                  return <div key={c} className="aspect-square rounded-md bg-surfaceMuted/40" />
                }
                const pos = `${r}-${c}`
                const isMarked = marked.has(pos)
                const isCalled = calledNumbers.includes(cell)
                const showAssist = assistMode && isCalled && !isMarked
                return (
                  <button
                    key={c}
                    onClick={() => toggleMark(r, c)}
                    className={`aspect-square rounded-md flex items-center justify-center text-sm font-bold transition-all ${
                      isMarked
                        ? 'bg-sapphire text-onSapphire line-through decoration-2'
                        : showAssist
                          ? 'bg-surfaceElevated text-textPrimary ring-2 ring-sapphire animate-pop'
                          : 'bg-surfaceElevated text-textPrimary border border-border'
                    }`}
                  >
                    {cell}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Claims */}
      <div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Claim a Prize</p>
        <div className="flex flex-col gap-1.5">
          {PRIZES.map(id => {
            const won = prizesWon[id]
            const patternMatches = checkPattern(id, ticket, marked)
            // With assist off, no eligibility hint is shown — every unclaimed
            // prize stays tappable and the player judges for themselves.
            const claimable = !won && (!assistMode || patternMatches)
            const pending = myPendingClaim?.payload?.prizeId === id

            let style = 'bg-surfaceElevated text-textMuted border border-border disabled:opacity-50'
            let status = ''
            if (won) {
              style = 'bg-surfaceMuted text-textMuted'
              status = `Won: ${won.playerName}`
            } else if (pending) {
              style = 'bg-sapphire/20 text-sapphire border-[1.5px] border-sapphire'
              status = 'Waiting for host...'
            } else if (assistMode && patternMatches) {
              style = 'bg-sapphire text-onSapphire'
              status = 'Claim →'
            } else if (!assistMode) {
              style = 'bg-surfaceElevated text-sapphire border-[1.5px] border-sapphire'
              status = 'Claim →'
            }

            return (
              <button
                key={id}
                onClick={() => onClaim(id)}
                disabled={!claimable || !!myPendingClaim}
                className={`min-h-[44px] rounded-xl px-4 flex items-center justify-between font-semibold text-sm transition-colors disabled:cursor-not-allowed ${style}`}
              >
                <span>{PRIZE_LABELS[id]}</span>
                <span className="text-xs">{status}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
