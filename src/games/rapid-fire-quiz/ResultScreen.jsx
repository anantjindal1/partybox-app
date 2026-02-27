import { useGameTheme } from '../../store/GameThemeContext'
import { Button } from '../../components/Button'
import { calculateWinner } from './scoring'
import { ACTIONS } from './reducer'

function avgMs(responseTimes) {
  if (!responseTimes || responseTimes.length === 0) return null
  return Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
}

export function ResultScreen({ state, dispatch }) {
  const { theme } = useGameTheme()
  const winnerIndex = state.winnerIndex ?? calculateWinner(state.players)
  const winner = state.players[winnerIndex]
  const sorted = [...state.players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const avgA = (a.responseTimes?.length && a.responseTimes.reduce((x, y) => x + y, 0) / a.responseTimes.length) ?? Infinity
    const avgB = (b.responseTimes?.length && b.responseTimes.reduce((x, y) => x + y, 0) / b.responseTimes.length) ?? Infinity
    if (avgA !== avgB) return avgA - avgB
    const minA = a.responseTimes?.length ? Math.min(...a.responseTimes) : Infinity
    const minB = b.responseTimes?.length ? Math.min(...b.responseTimes) : Infinity
    return minA - minB
  })
  const isTie = sorted.length >= 2 && sorted[0].score === sorted[1].score &&
    sorted[0].correctCount === sorted[1].correctCount

  function handlePlayAgain() {
    dispatch({ type: ACTIONS.RESET })
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col px-6 py-10`}>
      <h1 className={`text-3xl font-bold ${theme.text} mb-2`}>Round over!</h1>
      <p className={`${theme.textMuted} mb-6`}>🧩 Tez Dimaag Challenge</p>

      {winner && (
        <div className={`rounded-2xl p-4 mb-6 ${theme.accentBg} text-zinc-900 text-center`}>
          <p className="text-2xl font-black">🏆 {winner.name}</p>
          <p className="text-lg font-semibold">Winner</p>
        </div>
      )}

      {isTie && (
        <p className={`text-sm ${theme.textMuted} mb-4`}>
          Tie broken by: correct count → faster average response → fastest single answer
        </p>
      )}

      <div className="space-y-3 mb-8">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className={`flex justify-between items-center rounded-xl p-4 border ${theme.border} ${theme.card}`}
          >
            <span className="font-bold">
              {i + 1}. {p.name}
              {winnerIndex >= 0 && state.players[winnerIndex]?.id === p.id && ' 👑'}
            </span>
            <span className={theme.accent}>Score: {p.score}</span>
            <span className={theme.textMuted}>Correct: {p.correctCount}</span>
            {p.responseTimes?.length > 0 && (
              <span className="text-sm">Avg: {avgMs(p.responseTimes)}ms</span>
            )}
          </div>
        ))}
      </div>

      <Button onClick={handlePlayAgain}>Play again</Button>
    </div>
  )
}
