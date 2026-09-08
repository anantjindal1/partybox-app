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

const ASSIST_KEY = 'partybox_tambola_assist'

export function PlayerTicket({
  ticket,
  roomState,
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
  const [assistOn, setAssistOn] = useState(() => localStorage.getItem(ASSIST_KEY) !== 'false')

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify([...marked]))
  }, [marked, storageKey])

  function toggleAssist() {
    setAssistOn(prev => {
      const next = !prev
      localStorage.setItem(ASSIST_KEY, String(next))
      return next
    })
  }

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
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">Your Ticket</p>
          <button onClick={toggleAssist} className="text-xs text-textMuted underline">
            {assistOn ? 'Assist: On' : 'Assist: Off'}
          </button>
        </div>
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
                const showAssist = assistOn && isCalled && !isMarked
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
            const eligible = !won && checkPattern(id, ticket, marked)
            const pending = myPendingClaim?.payload?.prizeId === id
            return (
              <button
                key={id}
                onClick={() => onClaim(id)}
                disabled={!!won || !eligible || !!myPendingClaim}
                className={`min-h-[44px] rounded-xl px-4 flex items-center justify-between font-semibold text-sm transition-colors disabled:cursor-not-allowed ${
                  won
                    ? 'bg-surfaceMuted text-textMuted'
                    : pending
                      ? 'bg-sapphire/20 text-sapphire border-[1.5px] border-sapphire'
                      : eligible
                        ? 'bg-sapphire text-onSapphire'
                        : 'bg-surfaceElevated text-textMuted border border-border disabled:opacity-50'
                }`}
              >
                <span>{PRIZE_LABELS[id]}</span>
                <span className="text-xs">
                  {won ? `Won: ${won.playerName}` : pending ? 'Waiting for host...' : eligible ? 'Claim →' : ''}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
