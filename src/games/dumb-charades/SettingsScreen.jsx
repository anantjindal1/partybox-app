import { Button } from '../../components/Button'
import { ACTIONS } from './reducer'

const TIMERS = [30, 60, 90]
const ROUNDS = [1, 2, 3]

export function SettingsScreen({ state, dispatch, t }) {
  const { timerSeconds, scoringMode, inputMode, roundsPerTeam } = state.settings

  function set(key, value) {
    dispatch({ type: ACTIONS.UPDATE_SETTING, payload: { key, value } })
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col px-6 pt-10 pb-8 space-y-7">
      <h2 className="text-2xl font-black text-rose-400">{t('settings')}</h2>

      {/* Timer */}
      <Section label={`⏱ ${t('timer')}`}>
        <div className="grid grid-cols-3 gap-3">
          {TIMERS.map(s => (
            <ToggleBtn key={s} active={timerSeconds === s} onClick={() => set('timerSeconds', s)}>
              {s}{t('seconds')}
            </ToggleBtn>
          ))}
        </div>
      </Section>

      {/* Rounds per team */}
      <Section label={`🔁 ${t('roundsPerTeam')}`}>
        <div className="grid grid-cols-3 gap-3">
          {ROUNDS.map(r => (
            <ToggleBtn key={r} active={roundsPerTeam === r} onClick={() => set('roundsPerTeam', r)}>
              {r}
            </ToggleBtn>
          ))}
        </div>
      </Section>

      {/* Scoring mode */}
      <Section label={`🏆 ${t('scoringMode')}`}>
        <div className="grid grid-cols-2 gap-3">
          <ToggleBtn active={scoringMode === 'max_words'} onClick={() => set('scoringMode', 'max_words')}>
            {t('maxWords')}
          </ToggleBtn>
          <ToggleBtn active={scoringMode === 'fastest_guess'} onClick={() => set('scoringMode', 'fastest_guess')}>
            {t('fastestGuess')}
          </ToggleBtn>
        </div>
      </Section>

      {/* Input mode */}
      <Section label={`👆 ${t('inputMode')}`}>
        <div className="grid grid-cols-3 gap-3">
          {['tap', 'swipe', 'volume'].map(m => (
            <ToggleBtn key={m} active={inputMode === m} onClick={() => set('inputMode', m)}>
              {t(m)}
            </ToggleBtn>
          ))}
        </div>
      </Section>

      <Button onClick={() => dispatch({ type: ACTIONS.CONFIRM_SETTINGS })}>
        {t('startGame')}
      </Button>
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div>
      <p className="text-slate-400 text-sm mb-3">{label}</p>
      {children}
    </div>
  )
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`py-4 rounded-2xl text-base font-bold transition-colors ${
        active ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'
      }`}
    >
      {children}
    </button>
  )
}
