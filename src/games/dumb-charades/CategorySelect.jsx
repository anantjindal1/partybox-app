import { WORD_PACKS } from './wordpacks'
import { ACTIONS } from './reducer'

const DIFFICULTIES = [
  { key: 'easy',   label: 'Easy',   desc: 'Popular & recognisable' },
  { key: 'medium', label: 'Medium', desc: 'Easy + slightly harder'  },
  { key: 'hard',   label: 'Hard',   desc: 'All words + tough ones'  },
  { key: 'mixed',  label: 'Mixed',  desc: 'Full pool every game'    },
]

// Every category shares Dumb Charades' one accent (terracotta) — a five-color
// rainbow of per-category rings read as noisy/AI-generated; one consistent
// selected-state color reads as a coherent product.
const SELECTED_ACCENT = { ring: 'ring-terracotta', bg: 'bg-terracotta/20', border: 'border-terracotta/60', text: 'text-terracotta' }
const ACCENT = new Proxy({}, { get: () => SELECTED_ACCENT })

function wordCount(pack, difficulty) {
  const allowed = difficulty === 'easy'   ? new Set(['easy'])
                : difficulty === 'medium' ? new Set(['easy', 'medium'])
                : new Set(['easy', 'medium', 'hard'])
  return pack.words.filter(w => allowed.has(w.difficulty)).length
}

export function CategorySelect({ state, dispatch }) {
  const { categories, difficulty } = state
  const allKeys = Object.keys(WORD_PACKS)
  const allSelected = allKeys.every(k => categories.includes(k))

  function toggleCategory(key) {
    dispatch({ type: 'TOGGLE_CATEGORY', payload: key })
  }

  function toggleAll() {
    dispatch({
      type: 'SET_ALL_CATEGORIES',
      payload: allSelected ? [] : allKeys,
    })
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-textPrimary">Pick Categories</h2>
        <button
          onClick={toggleAll}
          className="text-xs font-semibold text-textMuted hover:text-textPrimary border border-border rounded-lg px-3 py-1 transition-colors"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Category cards */}
      <div className="space-y-3">
        {allKeys.map(key => {
          const pack = WORD_PACKS[key]
          const selected = categories.includes(key)
          const acc = ACCENT[key]
          const count = wordCount(pack, difficulty)

          return (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all border-2 ${
                selected
                  ? `${acc.bg} ${acc.border}`
                  : 'bg-surfaceElevated/80 border-border/50 hover:border-border'
              }`}
            >
              <span className="text-3xl leading-none">{pack.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-base ${selected ? 'text-textPrimary' : 'text-textSecondary'}`}>
                  {pack.label}
                </p>
                <p className="text-textMuted text-xs mt-0.5">{count} words</p>
              </div>
              <span className={`text-xl ${selected ? acc.text : 'text-textSecondary'}`}>
                {selected ? '✓' : '○'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Difficulty */}
      <div>
        <p className="text-textMuted text-xs uppercase tracking-widest mb-3">Difficulty</p>
        <div className="grid grid-cols-2 gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d.key}
              onClick={() => dispatch({ type: 'SET_DIFFICULTY', payload: d.key })}
              className={`py-3 px-3 rounded-2xl text-left transition-colors border ${
                difficulty === d.key
                  ? 'bg-terracotta/20 border-terracotta/60 text-terracotta'
                  : 'bg-surfaceElevated/80 border-border/50 text-textMuted hover:border-border'
              }`}
            >
              <p className="font-bold text-sm">{d.label}</p>
              <p className="text-textMuted text-xs mt-0.5">{d.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {state.error && (
        <p className="text-terracotta text-center font-semibold text-sm">{state.error === 'selectAtLeastOne' ? 'Pick at least one category!' : state.error}</p>
      )}

      <button
        onClick={() => dispatch({ type: ACTIONS.CONFIRM_CATEGORIES })}
        className="w-full py-4 rounded-2xl bg-terracotta hover:opacity-90 text-onTerracotta font-black text-lg transition-colors active:scale-[0.98]"
      >
        Next →
      </button>
    </div>
  )
}
