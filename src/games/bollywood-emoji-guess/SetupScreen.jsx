import { Button } from '../../components/Button'
import { useGameTheme } from '../../store/GameThemeContext'
import { ACTIONS } from './reducer'
import { generateSessionPuzzles } from './puzzlepacks'
import { getHighScore } from '../../services/highScores'

const DIFFICULTIES = [
  { id: 'easy', labelEn: 'Easy', labelHi: 'आसान' },
  { id: 'medium', labelEn: 'Medium', labelHi: 'मध्यम' },
  { id: 'hard', labelEn: 'Hard', labelHi: 'कठिन' }
]

export function SetupScreen({ state, dispatch, lang = 'en', slug }) {
  const { theme } = useGameTheme()
  const { difficulty } = state
  const personalBest = getHighScore(slug)

  function handleStart() {
    const questions = generateSessionPuzzles(difficulty, 10)
    dispatch({
      type: ACTIONS.START_SESSION,
      payload: { difficulty, questions, startTime: Date.now() }
    })
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col px-6 pt-10 pb-8`}>
      <h1 className={`text-3xl font-bold ${theme.text} mb-1`}>🎬 Bollywood Emoji Guess</h1>
      <p className={`${theme.textMuted} text-sm mb-2`}>Guess movies and actors from emoji clues — 10 questions</p>
      {personalBest !== null && (
        <p className={`text-sm font-semibold ${theme.accent} mb-6`}>🏆 Personal best: {personalBest} pts</p>
      )}
      {personalBest === null && <div className="mb-6" />}

      <p className={`${theme.textMuted} text-sm mb-3`}>Difficulty</p>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {DIFFICULTIES.map(d => (
          <button
            key={d.id}
            onClick={() => dispatch({ type: ACTIONS.UPDATE_SETTING, payload: { key: 'difficulty', value: d.id } })}
            className={`py-4 rounded-2xl text-lg font-bold transition-colors ${
              difficulty === d.id
                ? `${theme.accentBg} text-zinc-900`
                : `${theme.card} ${theme.text} border ${theme.border} ${theme.cardHover}`
            }`}
          >
            {lang === 'hi' ? d.labelHi : d.labelEn}
          </button>
        ))}
      </div>

      <Button onClick={handleStart}>Start</Button>
    </div>
  )
}
