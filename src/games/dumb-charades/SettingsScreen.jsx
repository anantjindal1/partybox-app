import { useState } from 'react'
import { ACTIONS } from './reducer'
import { getSeenWordsToday } from '../../services/dcSeenWords'
import { useLang } from '../../store/LangContext'

const TIMERS     = [60, 90, 120]
const WIN_POINTS = [3, 5, 7, 10]

export function SettingsScreen({ state, dispatch }) {
  const { t } = useLang()
  const { timerSeconds, winPoints } = state
  const [customText, setCustomText] = useState(
    (state.customWords ?? []).join('\n')
  )

  function handleStart() {
    const customWords = customText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    dispatch({ type: 'SET_CUSTOM_WORDS', payload: customWords })
    dispatch({ type: ACTIONS.CONFIRM_SETTINGS, payload: { excludeWords: getSeenWordsToday() } })
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <h2 className="text-xl font-black text-textPrimary">{t('dcSettings')}</h2>

      <Section label={t('dcTimer')}>
        <div className="grid grid-cols-3 gap-3">
          {TIMERS.map(s => (
            <ToggleBtn
              key={s}
              active={timerSeconds === s}
              onClick={() => dispatch({ type: 'SET_TIMER', payload: s })}
            >
              {s}s
            </ToggleBtn>
          ))}
        </div>
      </Section>

      <Section label={t('dcPointsToWin')}>
        <div className="grid grid-cols-4 gap-3">
          {WIN_POINTS.map(p => (
            <ToggleBtn
              key={p}
              active={winPoints === p}
              onClick={() => dispatch({ type: 'SET_WIN_POINTS', payload: p })}
            >
              {p}
            </ToggleBtn>
          ))}
        </div>
      </Section>

      <Section label={t('dcCustomWords')}>
        <textarea
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          placeholder={t('dcCustomPlaceholder')}
          rows={4}
          className="w-full bg-surfaceElevated/80 border border-border/50 text-textPrimary rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-terracotta/60 resize-none placeholder-zinc-600"
        />
        <p className="text-textMuted text-xs mt-1">{t('dcCustomHelp')}</p>
      </Section>

      <button
        onClick={handleStart}
        className="w-full py-4 rounded-2xl bg-terracotta hover:opacity-90 text-onTerracotta font-black text-lg transition-colors active:scale-[0.98]"
      >
        {t('startGameArrow')}
      </button>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div>
      <p className="text-textMuted text-xs uppercase tracking-widest mb-3">{label}</p>
      {children}
    </div>
  )
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`py-3 rounded-2xl font-bold text-base transition-colors border ${
        active
          ? 'bg-terracotta/20 border-terracotta/60 text-terracotta'
          : 'bg-surfaceElevated/80 border-border/50 text-textMuted hover:border-border'
      }`}
    >
      {children}
    </button>
  )
}
