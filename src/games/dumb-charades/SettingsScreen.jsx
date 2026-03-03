import { useState } from 'react'
import { Button } from '../../components/Button'
import { ACTIONS } from './reducer'
import { useDevMode } from '../../hooks/useDevMode'
import { DC } from './theme'

const TIMERS = [60, 90, 120]
const WIN_POINTS = [3, 5, 7, 10]

export function SettingsScreen({ state, dispatch, t }) {
  const { timerSeconds, winPoints } = state.settings
  const { devMode, toggleDevMode } = useDevMode()
  const [customText, setCustomText] = useState(
    (state.settings.customWords ?? []).join('\n')
  )

  function set(key, value) {
    dispatch({ type: ACTIONS.UPDATE_SETTING, payload: { key, value } })
  }

  function handleConfirm() {
    const customWords = customText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    dispatch({ type: ACTIONS.UPDATE_SETTING, payload: { key: 'customWords', value: customWords } })
    dispatch({ type: ACTIONS.CONFIRM_SETTINGS })
  }

  return (
    <div className={`min-h-screen ${DC.bg} ${DC.text} flex flex-col px-6 pt-10 pb-8 space-y-7`}>
      <h2 className={`text-2xl font-black ${DC.accent}`}>{t('settings')}</h2>

      <Section label={`⏱ ${t('timer')}`}>
        <div className="grid grid-cols-3 gap-3">
          {TIMERS.map(s => (
            <ToggleBtn key={s} active={timerSeconds === s} onClick={() => set('timerSeconds', s)}>
              {s}{t('seconds')}
            </ToggleBtn>
          ))}
        </div>
      </Section>

      <Section label={`🏆 ${t('winPoints')}`}>
        <div className="grid grid-cols-4 gap-3">
          {WIN_POINTS.map(p => (
            <ToggleBtn key={p} active={winPoints === p} onClick={() => set('winPoints', p)}>
              {p}
            </ToggleBtn>
          ))}
        </div>
      </Section>

      <Section label={`🎬 ${t('customMovies')}`}>
        <textarea
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          placeholder={t('customMoviesPlaceholder')}
          rows={4}
          className={`w-full ${DC.card} border ${DC.cardBorder} ${DC.text} rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2CE49D] resize-none`}
        />
      </Section>

      <div className="rounded-2xl">
        <Button onClick={handleConfirm}>{t('startGame')}</Button>
      </div>

      <div className="pt-4 border-t border-white/10 flex justify-center">
        <button onClick={toggleDevMode} className={`text-xs ${DC.textMuted}`}>
          {devMode ? '🟢 Dev mode ON' : '⚪ Dev mode OFF'}
        </button>
      </div>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div>
      <p className={`${DC.textMuted} text-xs uppercase tracking-widest mb-3`}>{label}</p>
      {children}
    </div>
  )
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`py-4 rounded-2xl text-base font-bold transition-all ${
        active ? `${DC.accentBg} text-[#141414]` : `${DC.card} border ${DC.cardBorder} text-zinc-300`
      }`}
    >
      {children}
    </button>
  )
}
