import { useReducer, useState } from 'react'
import { useLang } from '../../store/LangContext'
import { GameChrome } from '../../components/GameChrome'
import { resolveTitle } from '../../utils/strings'
import { reducer, getInitialState } from './offlineReducer'
import { MAX_SLOTS, findPrompt } from './logic'
import { SetupOptions } from './SetupOptions'
import { Wheel } from './Wheel'
import { TurnPanel } from './TurnPanel'

function Setup({ state, dispatch }) {
  const { t } = useLang()
  const [setting, setSetting] = useState(state.setting)
  const [spinMode, setSpinMode] = useState(state.spinMode)
  const [names, setNames] = useState(['', '', '', ''])

  function setCount(n) {
    setNames(prev => (n > prev.length ? [...prev, ...Array(n - prev.length).fill('')] : prev.slice(0, n)))
  }

  return (
    <div className="px-4 py-6 flex flex-col gap-6 max-w-lg w-full mx-auto">
      <p className="text-center text-textMuted text-sm">{t('tdIntro')}</p>
      <SetupOptions setting={setting} setSetting={setSetting} spinMode={spinMode} setSpinMode={setSpinMode} />

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">{t('players')}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCount(names.length - 1)}
              disabled={names.length <= 2}
              className="w-10 h-10 rounded-xl border-[1.5px] border-border text-textPrimary font-bold disabled:opacity-40"
              aria-label="-"
            >
              −
            </button>
            <span className="w-6 text-center font-black text-textPrimary">{names.length}</span>
            <button
              onClick={() => setCount(names.length + 1)}
              disabled={names.length >= MAX_SLOTS}
              className="w-10 h-10 rounded-xl border-[1.5px] border-border text-textPrimary font-bold disabled:opacity-40"
              aria-label="+"
            >
              +
            </button>
          </div>
        </div>
        <p className="text-xs text-textMuted mb-2">{t('tdNamesOptional')}</p>
        <div className="grid grid-cols-2 gap-2">
          {names.map((name, i) => (
            <input
              key={i}
              value={name}
              maxLength={14}
              onChange={e => setNames(prev => prev.map((v, j) => (j === i ? e.target.value : v)))}
              placeholder={t('tdPlayerN', { n: i + 1 })}
              className="min-h-[44px] rounded-xl border-[1.5px] border-border bg-surfaceElevated px-3 text-textPrimary focus:outline-none focus:border-rose"
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => dispatch({ type: 'START', setting, spinMode, names })}
        className="w-full min-h-[44px] py-4 rounded-2xl bg-rose text-onRose font-black text-lg"
      >
        {t('startGame')}
      </button>
    </div>
  )
}

function PlayersSheet({ players, label, dispatch, onClose }) {
  const { t } = useLang()
  const [name, setName] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl bg-surface border-t border-border p-5 pb-8 flex flex-col gap-3 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-center text-lg font-black font-display text-textPrimary">{t('players')}</p>
        {players.map(p => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border-[1.5px] border-border bg-surfaceElevated px-4 min-h-[44px]">
            <span className="font-semibold text-textPrimary">{label(p)}</span>
            <button
              onClick={() => dispatch({ type: 'REMOVE_PLAYER', id: p.id })}
              disabled={players.length <= 2}
              className="text-sm text-textMuted hover:text-error disabled:opacity-30"
            >
              {t('removePlayer')}
            </button>
          </div>
        ))}
        {players.length < MAX_SLOTS && (
          <div className="flex gap-2">
            <input
              value={name}
              maxLength={14}
              onChange={e => setName(e.target.value)}
              placeholder={t('tdNameOptional')}
              className="flex-1 min-h-[44px] rounded-xl border-[1.5px] border-border bg-surfaceElevated px-3 text-textPrimary focus:outline-none focus:border-rose"
            />
            <button
              onClick={() => {
                dispatch({ type: 'ADD_PLAYER', name })
                setName('')
              }}
              className="min-h-[44px] px-4 rounded-xl bg-rose text-onRose font-bold"
            >
              {t('tdAddPlayer')}
            </button>
          </div>
        )}
        <button onClick={onClose} className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-semibold">
          {t('close')}
        </button>
      </div>
    </div>
  )
}

function Play({ state, dispatch }) {
  const { t } = useLang()
  const [editing, setEditing] = useState(false)
  const label = p => p.name || t('tdPlayerN', { n: p.num })
  const turnPlayer = state.players.find(p => p.id === state.turnId)
  const idle = state.step === 'idle'

  return (
    <div className="flex-1 flex flex-col gap-5 px-4 py-5 max-w-lg w-full mx-auto">
      <div className="flex justify-end">
        <button
          onClick={() => setEditing(true)}
          disabled={!idle}
          className="min-h-[40px] px-4 rounded-xl border-[1.5px] border-border text-sm font-semibold text-textPrimary disabled:opacity-40"
        >
          {t('players')} · {state.players.length}
        </button>
      </div>

      <Wheel
        names={state.players.map(label)}
        rotation={state.rotation}
        highlight={!idle}
        onSpinEnd={() => dispatch({ type: 'SPUN' })}
      />

      {idle && (
        <>
          <p className="text-center text-sm text-textMuted">{t('tdPutDown')}</p>
          <button onClick={() => dispatch({ type: 'SPIN' })} className="min-h-[56px] rounded-2xl bg-rose text-onRose font-black text-xl">
            {t('tdSpin')}
          </button>
        </>
      )}
      {state.step === 'spinning' && <p className="text-center text-textMuted font-semibold">{t('tdSpinning')}</p>}
      {(state.step === 'choose' || state.step === 'prompt') && turnPlayer && (
        <TurnPanel
          name={label(turnPlayer)}
          type={state.type}
          prompt={state.type ? findPrompt(state.setting, state.type, state.promptId) : null}
          canAct
          onChoose={choice => dispatch({ type: 'CHOOSE', choice })}
          onSkip={() => dispatch({ type: 'SKIP' })}
          onDone={() => dispatch({ type: 'DONE' })}
        />
      )}

      {idle && (
        <button onClick={() => dispatch({ type: 'NEW_GAME' })} className="text-sm text-textMuted font-semibold mt-auto">
          {t('tdNewGame')}
        </button>
      )}

      {editing && <PlayersSheet players={state.players} label={label} dispatch={dispatch} onClose={() => setEditing(false)} />}
    </div>
  )
}

export default function TruthDareOffline({ slug, gameTitle }) {
  const { lang } = useLang()
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState)
  return (
    <GameChrome slug={slug} gameTitle={resolveTitle(gameTitle, lang)}>
      {state.phase === 'setup' ? <Setup state={state} dispatch={dispatch} /> : <Play state={state} dispatch={dispatch} />}
    </GameChrome>
  )
}
