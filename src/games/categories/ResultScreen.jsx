import { useGameTheme } from '../../store/GameThemeContext'
import { Button } from '../../components/Button'
import { ACTIONS } from './reducer'
import { getRandomLetter, getCategoriesPool } from './dictionary'
import { getRoundWinnerIndex } from './scoring'

export function ResultScreen({ state, dispatch }) {
  const { theme } = useGameTheme()
  const sorted = [...(state.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0))
  const winnerIndex = getRoundWinnerIndex(state.players || [])
  const winner = state.players && state.players[winnerIndex]

  function handlePlayAgain() {
    const letter = getRandomLetter()
    const pool = getCategoriesPool()
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const categories = shuffled.slice(0, 4)
    dispatch({
      type: ACTIONS.START_NEXT_ROUND,
      payload: { letter, categories, roundStartTime: Date.now() }
    })
  }

  function handleNewGame() {
    dispatch({ type: ACTIONS.RESET })
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col px-6 py-10`}>
      <h1 className={`text-3xl font-bold ${theme.text} mb-2`}>Round khatam!</h1>
      <p className={`${theme.textMuted} mb-6`}>🔤 A to Z Dhamaka</p>

      {winner && (
        <div className={`rounded-2xl p-4 mb-6 ${theme.accentBg} text-zinc-900 text-center`}>
          <p className="text-2xl font-black">🏆 {winner.name}</p>
          <p className="text-lg font-semibold">Winner</p>
        </div>
      )}

      <div className="space-y-3 mb-8">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className={`flex justify-between items-center rounded-xl p-4 border ${theme.border} ${theme.card}`}
          >
            <span className="font-bold">
              {i + 1}. {p.name}
              {winner && winner.id === p.id && ' 👑'}
            </span>
            <span className={theme.accent}>Score: {p.score ?? 0}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Button onClick={handlePlayAgain}>One more round</Button>
        <Button onClick={handleNewGame} variant="secondary">New game</Button>
      </div>
    </div>
  )
}
