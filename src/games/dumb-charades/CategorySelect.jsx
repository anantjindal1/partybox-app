import { Button } from '../../components/Button'
import { ACTIONS } from './reducer'
import { wordpacks } from './wordpacks'

const DIFFICULTIES = ['easy', 'medium', 'hard']

export function CategorySelect({ state, dispatch, t }) {
  const { categories, difficulty } = state.settings

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col px-6 pt-10 pb-8 space-y-6">
      <h2 className="text-2xl font-black text-rose-400">{t('pickCategories')}</h2>

      {/* Category grid */}
      <div className="space-y-3">
        {wordpacks.map(pack => {
          const selected = categories.includes(pack.slug)
          return (
            <button
              key={pack.slug}
              onClick={() => dispatch({ type: ACTIONS.TOGGLE_CATEGORY, payload: pack.slug })}
              className={`w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-colors ${
                selected ? 'bg-rose-500' : 'bg-slate-800'
              }`}
            >
              <span className="text-4xl">{pack.icon}</span>
              <span className="text-xl font-bold">{pack.label.en}</span>
              <span className="ml-auto text-2xl">{selected ? '✓' : ''}</span>
            </button>
          )
        })}
      </div>

      {/* Difficulty */}
      <div>
        <p className="text-slate-400 text-sm mb-3">{t('difficulty')}</p>
        <div className="grid grid-cols-3 gap-3">
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => dispatch({ type: ACTIONS.UPDATE_SETTING, payload: { key: 'difficulty', value: d } })}
              className={`py-4 rounded-2xl text-lg font-bold transition-colors capitalize ${
                difficulty === d ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {t(d)}
            </button>
          ))}
        </div>
      </div>

      {state.error && (
        <p className="text-rose-400 text-center font-semibold">{t(state.error)}</p>
      )}

      <Button onClick={() => dispatch({ type: ACTIONS.CONFIRM_CATEGORIES })}>
        {t('next')}
      </Button>
    </div>
  )
}
