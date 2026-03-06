import { useGameTheme } from '../../store/GameThemeContext'
import { getCategories } from './questionpacks'
import { ACTIONS } from './reducer'
import { generateRoundQuestions } from './questionpacks'
import { Button } from '../../components/Button'

export function CategorySelectScreen({ state, dispatch }) {
  const { theme } = useGameTheme()
  const categories = getCategories()
  const selected = state.selectedCategory

  function handleSelectCategory(category) {
    dispatch({ type: ACTIONS.SELECT_CATEGORY, payload: { category } })
  }

  function handleStartRound() {
    const questions = generateRoundQuestions(state.selectedCategory, 5)
    dispatch({
      type: ACTIONS.START_ROUND,
      payload: { questions, startTime: Date.now() }
    })
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col px-6 pt-10 pb-8`}>
      <h1 className={`text-2xl font-bold ${theme.text} mb-2`}>Choose category</h1>
      <p className={`${theme.textMuted} text-sm mb-6`}>5 questions per round</p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => handleSelectCategory(cat)}
            className={`py-4 px-4 rounded-2xl text-left font-semibold transition-colors ${
              selected === cat ? `${theme.accentBg} text-zinc-900` : `${theme.card} border ${theme.border} ${theme.cardHover}`
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-4">
          <p className={`${theme.textMuted} text-sm mb-2`}>Selected: {selected}</p>
          <Button onClick={handleStartRound}>Start round</Button>
        </div>
      )}
    </div>
  )
}
