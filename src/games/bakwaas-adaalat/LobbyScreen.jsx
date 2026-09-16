import { useState } from 'react'

const TIME_OPTIONS = [15, 30, 45, 60]
const ROUND_OPTIONS = [5, 8, 10]

export function LobbyScreen({ isHost, minPlayers, players, onStart, starting }) {
  const [turnSeconds, setTurnSeconds] = useState(30)
  const [roundCount, setRoundCount] = useState(8)
  const canStart = isHost && players.length >= minPlayers && !starting

  if (!isHost) {
    return (
      <div className="flex flex-col gap-4 max-w-lg w-full mx-auto pt-2">
        <p className="text-center text-textMuted text-sm">Waiting for host to start...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg w-full mx-auto pt-2">
      <div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
          Seconds per lawyer
        </p>
        <div className="grid grid-cols-4 gap-2">
          {TIME_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setTurnSeconds(n)}
              className={`min-h-[44px] rounded-xl border-[1.5px] font-bold transition-colors ${
                turnSeconds === n
                  ? 'bg-taupe text-onTaupe border-taupe'
                  : 'bg-surfaceElevated text-textPrimary border-border hover:border-taupe/50'
              }`}
            >
              {n}s
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Cases</p>
        <div className="grid grid-cols-3 gap-2">
          {ROUND_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setRoundCount(n)}
              className={`min-h-[44px] rounded-xl border-[1.5px] font-bold transition-colors ${
                roundCount === n
                  ? 'bg-taupe text-onTaupe border-taupe'
                  : 'bg-surfaceElevated text-textPrimary border-border hover:border-taupe/50'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onStart({ turnSeconds, roundCount })}
        disabled={!canStart}
        className="min-h-[48px] rounded-xl bg-taupe text-onTaupe font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        {starting ? 'Starting...' : players.length < minPlayers ? `Waiting for players (${players.length}/${minPlayers})` : 'Start Game →'}
      </button>
    </div>
  )
}
