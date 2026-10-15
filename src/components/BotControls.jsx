import { useState } from 'react'
import { addBot, setBotDifficulty } from '../services/room'
import { makeBot, botColor, DIFFICULTIES, DEFAULT_DIFFICULTY } from '../multiplayer/bots/bots'

const LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

/**
 * Host-only lobby controls for filling empty seats with AI players.
 * Removing one reuses the lobby's normal kick (✕) on its seat.
 */
export function BotControls({ code, room, maxPlayers }) {
  const [adding, setAdding] = useState(false)
  const difficulty = room.botDifficulty ?? DEFAULT_DIFFICULTY
  const hasBots = room.players.some(p => p.isBot)
  const full = room.players.length >= maxPlayers

  async function handleAdd() {
    setAdding(true)
    try {
      await addBot(code, makeBot(room.players))
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-surfaceElevated p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-textPrimary">AI players</p>
          <p className="text-xs text-textMuted">Fill empty seats with the computer. Tap ✕ on a seat to remove.</p>
        </div>
        <button
          onClick={handleAdd}
          disabled={full || adding}
          className="shrink-0 px-3 py-2 rounded-xl text-sm font-semibold border-[1.5px] border-border text-textPrimary hover:border-textMuted disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Add AI
        </button>
      </div>
      {hasBots && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-textMuted">Level</span>
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => setBotDifficulty(code, d)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border-[1.5px] transition-colors ${
                d === difficulty
                  ? 'bg-textPrimary text-surface border-transparent'
                  : 'border-border/60 text-textSecondary hover:border-textMuted'
              }`}
            >
              {LABEL[d]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AiTag() {
  return (
    <span className="inline-block align-middle ml-1 px-1 rounded text-[9px] font-bold leading-[14px] bg-textMuted/20 text-textSecondary">
      AI
    </span>
  )
}

/**
 * A player's avatar: their chosen emoji, or for AI players a coloured
 * monogram of their name. Sized in em, so it follows the parent font size.
 */
export function Avatar({ player }) {
  if (!player?.isBot) return player?.avatar ?? '🎮'
  return (
    <span
      className="inline-flex items-center justify-center rounded-full align-middle font-bold text-white"
      style={{ fontSize: '0.75em', width: '1.9em', height: '1.9em', background: botColor(player.name) }}
    >
      {player.name?.[0]?.toUpperCase() ?? 'A'}
    </span>
  )
}
