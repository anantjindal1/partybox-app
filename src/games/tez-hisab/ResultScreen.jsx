import { Button } from '../../components/Button'
import { calculateSessionXP } from './scoring'
import { ACTIONS } from './reducer'

export function ResultScreen({ state, dispatch, isNewRecord, personalBest }) {
  const correctCount = state.answers.filter(a => a.correct).length
  const xpEarned = calculateSessionXP(correctCount)

  function handlePlayAgain() {
    dispatch({ type: ACTIONS.RESET })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-6 py-10">
      <h1 className="text-3xl font-bold text-white mb-2">Session over!</h1>
      <p className="text-zinc-500 mb-4">🔢 Tez Hisab</p>

      {isNewRecord && (
        <div className="mb-6 px-6 py-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-lg animate-bounce">
          🎉 New Record!
        </div>
      )}
      {!isNewRecord && personalBest !== null && (
        <p className="text-zinc-500 text-sm mb-6">Best: {personalBest} pts</p>
      )}

      <div className="w-full max-w-sm space-y-6">
        <div className="bg-zinc-800/80 border border-zinc-700 rounded-2xl p-6 text-center">
          <p className="text-zinc-500 text-sm mb-1">Score</p>
          <p className="text-4xl font-black text-amber-400">{state.score}</p>
        </div>
        <div className="bg-zinc-800/80 border border-zinc-700 rounded-2xl p-6 text-center">
          <p className="text-zinc-500 text-sm mb-1">Correct</p>
          <p className="text-3xl font-bold text-white">{correctCount} / 15</p>
        </div>
        <div className="bg-zinc-800/80 border border-zinc-700 rounded-2xl p-6 text-center">
          <p className="text-zinc-500 text-sm mb-1">XP earned</p>
          <p className="text-3xl font-bold text-green-400">+{xpEarned}</p>
        </div>
      </div>

      <div className="mt-10 w-full max-w-sm">
        <Button onClick={handlePlayAgain}>Play Again</Button>
      </div>
    </div>
  )
}
