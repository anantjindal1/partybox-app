/**
 * Result screen: final score, time, mistakes, personal best indicator, Hinglish feedback.
 */
import { useGameTheme } from '../../store/GameThemeContext'
import { Button } from '../../components/Button'
import { calculateFinalScore } from './scoring'

const FEEDBACK = [
  { minScore: 120, text: 'Memory master!', textHi: 'मेमोरी मास्टर!' },
  { minScore: 100, text: 'Yaadash tez hai!', textHi: 'यादाश्त तेज़ है!' },
  { minScore: 70, text: 'Thoda dhyaan do 😅', textHi: 'थोड़ा ध्यान दो 😅' },
  { minScore: 0, text: 'Phir try karo!', textHi: 'फिर ट्राई करो!' }
]

function getFeedback(score, lang) {
  const f = FEEDBACK.find(x => score >= x.minScore) || FEEDBACK[FEEDBACK.length - 1]
  return lang === 'hi' ? f.textHi : f.text
}

export function ResultScreen({ state, dispatch, onPlayAgain, lang = 'en' }) {
  const { theme } = useGameTheme()
  const timeSec = Math.round((state.elapsedTime ?? 0) / 1000)
  const { score, timeBonus, zeroMistakesBonus } = calculateFinalScore(
    timeSec,
    state.mistakes ?? 0
  )
  const isBestTime = state.bestTime != null && timeSec <= state.bestTime
  const isLeastMistakes = state.leastMistakes != null && (state.mistakes ?? 0) <= state.leastMistakes

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col px-6 pt-10 pb-8`}>
      <h1 className={`text-3xl font-bold ${theme.text} mb-2`}>🧠 Done!</h1>
      <p className={`${theme.textMuted} text-lg mb-6`}>{getFeedback(score, lang)}</p>

      <div className={`rounded-2xl ${theme.card} border ${theme.border} p-6 space-y-4 mb-6`}>
        <div className="flex justify-between">
          <span className={theme.textMuted}>Score</span>
          <span className={`text-xl font-bold ${theme.accent}`}>{score}</span>
        </div>
        <div className="flex justify-between">
          <span className={theme.textMuted}>Time</span>
          <span>{timeSec}s</span>
        </div>
        <div className="flex justify-between">
          <span className={theme.textMuted}>Mistakes</span>
          <span>{state.mistakes ?? 0}</span>
        </div>
        {(timeBonus || zeroMistakesBonus) && (
          <div className="pt-2 border-t border-zinc-600">
            {timeBonus && <p className={`text-sm ${theme.accent}`}>⚡ Under 30s bonus +20</p>}
            {zeroMistakesBonus && <p className={`text-sm ${theme.accent}`}>✨ Zero mistakes bonus +30</p>}
          </div>
        )}
        {(isBestTime || isLeastMistakes) && (
          <p className={`text-sm font-semibold ${theme.accent}`}>🏆 Personal best!</p>
        )}
      </div>

      <Button onClick={onPlayAgain}>Play Again</Button>
    </div>
  )
}
