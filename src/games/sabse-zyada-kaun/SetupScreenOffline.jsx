import { useState } from 'react'
import { TAGS } from './prompts'
import { ACTIONS } from './reducer'
import { resolveTitle } from '../../utils/strings'
import metadata from './metadata-offline'
import { useLang } from '../../store/LangContext'

export function SetupScreenOffline({ state, dispatch }) {
  const { lang, t } = useLang()
  const [selectedTags, setSelectedTags] = useState(state.selectedTags)
  const [includeAdult, setIncludeAdult] = useState(state.includeAdult)

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function handleStart() {
    dispatch({ type: ACTIONS.SET_TAGS, payload: selectedTags.length ? selectedTags : ['friends'] })
    dispatch({ type: ACTIONS.SET_ADULT, payload: includeAdult })
    dispatch({ type: ACTIONS.START_GAME })
  }

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black font-display text-textPrimary">{resolveTitle(metadata.title, lang)}</h1>
        <p className="text-textMuted text-sm">
          {t('szIntro')}
        </p>
      </div>

      <div>
        <p className="text-textMuted text-xs uppercase tracking-widest mb-3">{t('szSetting')}</p>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(TAGS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleTag(key)}
              className={`min-h-[44px] rounded-xl border-[1.5px] px-4 text-left font-semibold transition-colors ${
                selectedTags.includes(key)
                  ? 'bg-rose text-onRose border-rose'
                  : 'bg-surfaceElevated text-textPrimary border-border hover:border-rose/50'
              }`}
            >
              {label[lang] ?? label.en}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setIncludeAdult((v) => !v)}
        className={`w-full min-h-[44px] rounded-xl border-[1.5px] px-4 flex items-center justify-between font-semibold transition-colors ${
          includeAdult ? 'bg-error/10 border-error text-error' : 'bg-surfaceElevated border-border text-textMuted'
        }`}
      >
        <span>{t('szAdult')}</span>
        <span className="text-xs font-bold">{includeAdult ? t('on') : t('off')}</span>
      </button>

      <button
        onClick={handleStart}
        className="w-full min-h-[44px] py-4 rounded-2xl bg-rose text-onRose font-black text-lg transition-opacity"
      >
        {t('szStart')}
      </button>
    </div>
  )
}
