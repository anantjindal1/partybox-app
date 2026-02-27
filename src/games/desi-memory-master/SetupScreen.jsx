import { useGameTheme } from '../../store/GameThemeContext'
import { getThemes } from './themes'
import { ACTIONS } from './reducer'
import { Button } from '../../components/Button'

const DIFFICULTIES = [
  { id: 'easy', labelEn: 'Easy', labelHi: 'आसान', pairs: '8 pairs' },
  { id: 'medium', labelEn: 'Medium', labelHi: 'मध्यम', pairs: '10 pairs' },
  { id: 'hard', labelEn: 'Hard', labelHi: 'कठिन', pairs: '12 pairs' }
]

export function SetupScreen({ state, dispatch, lang = 'en' }) {
  const { theme } = useGameTheme()
  const themes = getThemes()
  const { difficulty, theme: selectedTheme } = state

  function handleStart() {
    dispatch({ type: ACTIONS.START_GAME, payload: { difficulty, theme: selectedTheme } })
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col px-6 pt-10 pb-8`}>
      <h1 className={`text-3xl font-bold ${theme.text} mb-1`}>🧠 Desi Memory Master</h1>
      <p className={`${theme.textMuted} text-sm mb-6`}>Match pairs — pick a theme and difficulty</p>

      <p className={`${theme.textMuted} text-sm mb-2`}>Difficulty</p>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {DIFFICULTIES.map(d => (
          <button
            key={d.id}
            onClick={() => dispatch({ type: ACTIONS.UPDATE_SETTING, payload: { key: 'difficulty', value: d.id } })}
            className={`py-3 rounded-2xl text-sm font-bold transition-colors ${
              difficulty === d.id
                ? `${theme.accentBg} text-zinc-900`
                : `${theme.card} ${theme.text} border ${theme.border} ${theme.cardHover}`
            }`}
          >
            {lang === 'hi' ? d.labelHi : d.labelEn}
            <span className="block text-xs font-normal opacity-90">{d.pairs}</span>
          </button>
        ))}
      </div>

      <p className={`${theme.textMuted} text-sm mb-2`}>Theme</p>
      <div className="flex flex-wrap gap-2 mb-8">
        {themes.map(t => (
          <button
            key={t.theme}
            onClick={() => dispatch({ type: ACTIONS.UPDATE_SETTING, payload: { key: 'theme', value: t.theme } })}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              selectedTheme === t.theme
                ? `${theme.accentBg} text-zinc-900`
                : `${theme.card} border ${theme.border} ${theme.cardHover}`
            }`}
          >
            {t.theme}
          </button>
        ))}
      </div>

      <Button onClick={handleStart}>Start</Button>
    </div>
  )
}
