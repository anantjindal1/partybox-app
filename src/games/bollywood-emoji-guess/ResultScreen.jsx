import { useGameTheme } from '../../store/GameThemeContext'
import { Button } from '../../components/Button'
import { calculateSessionXP } from './scoring'
import { ACTIONS } from './reducer'

export function ResultScreen({ state, dispatch, isNewRecord, personalBest }) {
  const { theme } = useGameTheme()
  const correctCount = state.answers.filter(a => a.correct).length
  const xpEarned = calculateSessionXP(state.score, correctCount)

  function handlePlayAgain() {
    dispatch({ type: ACTIONS.RESET })
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col items-center justify-center px-6 py-10`}>
      <h1 className={`text-3xl font-bold ${theme.text} mb-2`}>Session over!</h1>
      <p className={`${theme.textMuted} mb-4`}>🎬 Bollywood Emoji Guess</p>

      {isNewRecord && (
        <div className="mb-6 px-6 py-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-lg animate-bounce">
          🎉 New Record!
        </div>
      )}
      {!isNewRecord && personalBest !== null && (
        <p className={`${theme.textMuted} text-sm mb-6`}>Best: {personalBest} pts</p>
      )}

      <div className="w-full max-w-sm space-y-6">
        <div className={`${theme.card} border ${theme.border} rounded-2xl p-6 text-center`}>
          <p className={`${theme.textMuted} text-sm mb-1`}>Score</p>
          <p className={`text-4xl font-black ${theme.accent}`}>{state.score}</p>
        </div>
        <div className={`${theme.card} border ${theme.border} rounded-2xl p-6 text-center`}>
          <p className={`${theme.textMuted} text-sm mb-1`}>Correct answers</p>
          <p className="text-3xl font-bold text-white">{correctCount} / 10</p>
        </div>
        <div className={`${theme.card} border ${theme.border} rounded-2xl p-6 text-center`}>
          <p className={`${theme.textMuted} text-sm mb-1`}>XP earned</p>
          <p className="text-3xl font-bold text-green-400">+{xpEarned}</p>
        </div>
      </div>

      <div className="mt-10 w-full max-w-sm">
        <Button onClick={handlePlayAgain}>Play Again</Button>
      </div>
    </div>
  )
}
