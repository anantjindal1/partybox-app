import { useGameTheme } from '../../store/GameThemeContext'
import { Button } from '../../components/Button'
import { ACTIONS } from './reducer'

function getStatus(validMap, duplicateMap, playerId, category, word) {
  const valid = validMap && validMap[playerId] && validMap[playerId][category]
  if (!valid) return { color: 'red', msg: 'Galat lag raha hai…' }
  const key = `${category}:${(word || '').toLowerCase()}`
  const isDup = duplicateMap && duplicateMap[key]
  if (isDup) return { color: 'yellow', msg: 'Sabne same likha 😅' }
  return { color: 'green', msg: 'Unique hai!' }
}

export function RevealScreen({ state, dispatch }) {
  const { theme } = useGameTheme()
  const letter = state.letter || 'A'
  const categories = state.categories || []
  const players = state.players || []
  const duplicateMap = state.duplicateMap || {}
  const validMap = state.validMap || {}

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col px-4 py-6`}>
      <h2 className={`text-2xl font-bold ${theme.text} mb-2`}>Reveal — Letter {letter}</h2>
      <p className={`${theme.textMuted} text-sm mb-6`}>Sabke answers dekho</p>

      <div className="space-y-6 mb-8">
        {players.map(p => (
          <div key={p.id} className={`rounded-xl border ${theme.border} ${theme.card} p-4`}>
            <p className={`font-bold text-lg ${theme.text} mb-3`}>{p.name}</p>
            <div className="space-y-2">
              {categories.map(cat => {
                const word = (p.answers && p.answers[cat]) || '—'
                const { color, msg } = getStatus(validMap, duplicateMap, p.id, cat, word)
                const bg =
                  color === 'green'
                    ? 'bg-emerald-500/20 border-emerald-500'
                    : color === 'yellow'
                    ? 'bg-amber-500/20 border-amber-500'
                    : 'bg-red-500/20 border-red-500'
                return (
                  <div
                    key={cat}
                    className={`rounded-lg border px-3 py-2 flex justify-between items-center ${bg}`}
                  >
                    <span className="font-medium">{cat}: {word}</span>
                    <span className="text-sm font-semibold">{msg}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <Button onClick={() => dispatch({ type: ACTIONS.GO_TO_RESULT })}>Scoreboard dekho</Button>
    </div>
  )
}
