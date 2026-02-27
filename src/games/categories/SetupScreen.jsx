import { useState } from 'react'
import { useGameTheme } from '../../store/GameThemeContext'
import { ACTIONS } from './reducer'
import { getRandomLetter, getCategoriesPool } from './dictionary'
import { Button } from '../../components/Button'

const MIN_PLAYERS = 2
const MAX_PLAYERS = 6

export function SetupScreen({ state, dispatch }) {
  const { theme } = useGameTheme()
  const [playerCount, setPlayerCount] = useState(MIN_PLAYERS)
  const [names, setNames] = useState(() =>
    Array(MAX_PLAYERS)
      .fill('')
      .map((_, i) => (i < MIN_PLAYERS ? `Player ${i + 1}` : ''))
  )

  function updateCount(n) {
    const num = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, n))
    setPlayerCount(num)
    setNames(prev => {
      const next = [...prev]
      for (let i = 0; i < num; i++) if (!next[i]) next[i] = `Player ${i + 1}`
      return next.slice(0, MAX_PLAYERS)
    })
  }

  function handleStart() {
    const letter = getRandomLetter()
    const pool = getCategoriesPool()
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const categories = shuffled.slice(0, 4)
    const players = names.slice(0, playerCount).map((name, i) => ({
      id: `p${i}`,
      name: (name || '').trim() || `Player ${i + 1}`
    }))
    dispatch({
      type: ACTIONS.START_GAME,
      payload: { players, letter, categories, roundStartTime: Date.now() }
    })
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col px-6 pt-10 pb-8`}>
      <h1 className={`text-3xl font-bold ${theme.text} mb-1`}>🔤 A to Z Dhamaka</h1>
      <p className={`${theme.textMuted} text-sm mb-6`}>2–6 players, pass device — letter + categories</p>

      <p className={`${theme.textMuted} text-sm mb-2`}>Number of players</p>
      <div className="flex gap-2 mb-6">
        {[2, 3, 4, 5, 6].map(n => (
          <button
            key={n}
            onClick={() => updateCount(n)}
            className={`w-12 h-12 rounded-xl text-lg font-bold transition-colors ${
              playerCount === n
                ? `${theme.accentBg} text-zinc-900`
                : `${theme.card} border ${theme.border} ${theme.cardHover}`
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <p className={`${theme.textMuted} text-sm mb-2`}>Player names</p>
      <div className="space-y-3 mb-8">
        {Array.from({ length: playerCount }, (_, i) => (
          <input
            key={i}
            type="text"
            value={names[i] || ''}
            onChange={e => {
              const next = [...names]
              next[i] = e.target.value
              setNames(next)
            }}
            placeholder={`Player ${i + 1}`}
            className={`w-full px-4 py-3 rounded-xl border ${theme.input || 'border-zinc-600 bg-zinc-800'} ${theme.text}`}
          />
        ))}
      </div>

      <Button onClick={handleStart}>Start</Button>
    </div>
  )
}
