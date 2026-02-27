import { useMemo, useState, useEffect } from 'react'
import { useGameTheme } from '../../store/GameThemeContext'
import { getWords } from './dictionary'
import { ACTIONS } from './reducer'
import { Timer } from './Timer'

const TOTAL_MS = 60000

export function RoundScreen({ state, dispatch }) {
  const { theme } = useGameTheme()
  const letter = state.letter || 'A'
  const categories = state.categories || []
  const currentIndex = state.currentPlayerIndex ?? 0
  const currentPlayer = state.players[currentIndex]
  const roundStart = state.roundStartTime ?? 0

  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (state.phase !== 'round_active') return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [state.phase])

  const remainingSec = useMemo(() => {
    if (typeof roundStart !== 'number' || roundStart === 0) return 60
    const elapsed = Date.now() - roundStart
    const remaining = Math.max(0, Math.ceil((TOTAL_MS - elapsed) / 1000))
    return remaining
  }, [roundStart, tick])

  const suggestions = useMemo(() => {
    const out = {}
    categories.forEach(cat => {
      out[cat] = getWords(letter, cat)
    })
    return out
  }, [letter, categories])

  function handleTimeout() {
    if (currentIndex < state.players.length - 1) {
      dispatch({ type: ACTIONS.NEXT_PLAYER, payload: { roundStartTime: Date.now() } })
    } else {
      dispatch({ type: ACTIONS.END_ROUND })
    }
  }

  function handleSelect(playerId, category, word) {
    dispatch({ type: ACTIONS.RECORD_ANSWER, payload: { playerId, category, word } })
  }

  if (!currentPlayer) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} flex items-center justify-center`}>
        <p className={theme.textMuted}>Loading...</p>
      </div>
    )
  }

  const timerColor = remainingSec <= 10
    ? 'text-red-400 animate-pulse'
    : remainingSec <= 20
    ? 'text-amber-400'
    : theme.accent

  const playerCount = state.players.length
  const playerLabel = playerCount > 1
    ? `${currentPlayer.name} (${currentIndex + 1}/${playerCount})`
    : currentPlayer.name

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col px-4 py-4`}>
      <div className="flex justify-between items-center mb-4">
        <span className={`text-lg font-bold ${theme.accent}`}>
          {playerLabel} — ab tum!
        </span>
        <span className={`font-mono font-bold tabular-nums ${timerColor}`}>⏱ {remainingSec}s</span>
      </div>

      <div className="text-center mb-6">
        <span className={`text-7xl font-black ${theme.accent} border-4 border-current rounded-2xl inline-block w-24 h-24 leading-[4.5rem]`}>
          {letter}
        </span>
      </div>

      <div className="space-y-4 flex-1">
        {categories.map(cat => {
          const selected = (currentPlayer.answers && currentPlayer.answers[cat]) || ''
          const words = suggestions[cat] || []
          return (
            <div key={cat} className={`rounded-xl border ${theme.border} ${theme.card} p-4`}>
              <p className={`text-sm font-semibold ${theme.textMuted} mb-2`}>{cat}</p>
              {selected ? (
                <p className={`text-xl font-bold ${theme.accent} mb-2`}>✓ {selected}</p>
              ) : (
                <p className={`text-sm ${theme.textMuted} mb-2`}>Tap karo 👇</p>
              )}
              <div className="flex flex-wrap gap-2">
                {words.slice(0, 12).map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleSelect(currentPlayer.id, cat, w)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border ${theme.border} ${theme.cardHover} ${theme.text}`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pb-2">
        <button
          onClick={handleTimeout}
          className={`w-full py-4 rounded-2xl font-bold text-lg ${theme.accentBg} ${theme.accentBgHover} text-zinc-900 active:scale-95 transition-transform`}
        >
          {currentIndex < state.players.length - 1 ? `✓ Done — Next: ${state.players[currentIndex + 1]?.name}` : '✓ Done — Reveal answers'}
        </button>
      </div>

      <Timer
        roundStartTime={roundStart}
        phase={state.phase}
        onTimeout={handleTimeout}
      />
    </div>
  )
}
