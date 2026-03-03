import { Button } from '../../components/Button'
import { ACTIONS } from './reducer'
import { wordpacks } from './wordpacks'
import { DC } from './theme'

const DIFFICULTIES = ['easy', 'medium', 'hard']

export function CategorySelect({ state, dispatch, t }) {
  const { categories, difficulty } = state.settings

  return (
    <div className={`min-h-screen ${DC.bg} ${DC.text} flex flex-col px-6 pt-10 pb-8 space-y-6`}>
      <h2 className={`text-2xl font-black ${DC.accent}`}>{t('pickCategories')}</h2>

      <div className="space-y-3">
        {wordpacks.map(pack => {
          const selected = categories.includes(pack.slug)
          return (
            <button
              key={pack.slug}
              onClick={() => dispatch({ type: ACTIONS.TOGGLE_CATEGORY, payload: pack.slug })}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-colors border ${
                selected ? `${DC.accentBg} text-[#141414] ${DC.accentBorder}` : `${DC.card} ${DC.cardBorder} text-zinc-300`
              }`}
            >
              <span className="text-4xl">{pack.icon}</span>
              <span className="text-xl font-bold">{pack.label.en}</span>
              <span className="ml-auto text-2xl">{selected ? '✓' : ''}</span>
            </button>
          )
        })}
      </div>

      <div>
        <p className={`${DC.textMuted} text-sm mb-3`}>{t('difficulty')}</p>
        <div className="grid grid-cols-3 gap-3">
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => dispatch({ type: ACTIONS.UPDATE_SETTING, payload: { key: 'difficulty', value: d } })}
              className={`py-4 rounded-2xl text-lg font-bold transition-colors capitalize ${
                difficulty === d ? `${DC.accentBg} text-[#141414]` : `${DC.card} ${DC.textMuted} border ${DC.cardBorder}`
              }`}
            >
              {t(d)}
            </button>
          ))}
        </div>
      </div>

      {state.error && (
        <p className={`${DC.accent} text-center font-semibold`}>{t(state.error)}</p>
      )}

      <Button onClick={() => dispatch({ type: ACTIONS.CONFIRM_CATEGORIES })}>
        {t('next')}
      </Button>
    </div>
  )
}
