import { ACTIONS } from './reducer'
import { useLang } from '../../store/LangContext'

export function RoundScreen({ state, dispatch }) {
  const { t, lang } = useLang()
  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-6 max-w-lg w-full mx-auto">
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider text-center">
        {t('szPromptN', { n: state.promptNumber })}
      </p>

      <div className="flex-1 flex items-center justify-center">
        <div className="bg-surfaceElevated border-[1.5px] border-rose rounded-2xl p-8 text-center w-full">
          <p className="text-2xl font-bold font-display text-textPrimary leading-snug">
            {state.currentPrompt?.[lang] ?? state.currentPrompt?.en ?? t('szNoPrompts')}
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-textMuted">
        {t('szReadAloud')}
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => dispatch({ type: ACTIONS.NEXT_PROMPT })}
          disabled={!state.currentPrompt}
          className="min-h-[44px] rounded-xl bg-rose text-onRose font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {t('szNextPrompt')}
        </button>
        <button
          onClick={() => dispatch({ type: ACTIONS.SKIP_PROMPT })}
          disabled={!state.currentPrompt}
          className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textMuted font-semibold disabled:opacity-40"
        >
          {t('szSkipPrompt')}
        </button>
      </div>
    </div>
  )
}
