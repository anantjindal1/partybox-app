import { useCallback, useState } from 'react'
import { Timer } from './Timer'
import { ACTIONS } from './reducer'

const TEASE_CORRECT = ['Wah! 🔥', 'Sahi hai! ✅', 'Ekdum sahi! 🎯', 'Badhiya! 💪']

function randomOf(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function vibrateCorrect() { navigator.vibrate?.([80]) }

export function RoundScreen({ state, dispatch, t, devMode = false }) {
  const { wordQueue, teams, currentTeamIndex, settings } = state
  const currentMovie = wordQueue[0] ?? ''
  const currentTeam = teams[currentTeamIndex]
  const [flash, setFlash] = useState(false)
  const [tease, setTease] = useState('')
  const [confirmEnd, setConfirmEnd] = useState(false)

  const handleCorrect = useCallback(() => {
    vibrateCorrect()
    setFlash(true)
    setTease(randomOf(TEASE_CORRECT))
    setTimeout(() => setFlash(false), 250)
    dispatch({ type: ACTIONS.CORRECT })
  }, [dispatch])

  const handleTimerEnd = useCallback(() => {
    dispatch({ type: ACTIONS.TIMER_END })
  }, [dispatch])

  const bgColor = flash
    ? 'bg-gradient-to-br from-emerald-950 to-green-900'
    : 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900'

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-150 ${bgColor}`}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-3">
        <div className="text-center">
          <p className="text-white/50 text-xs uppercase tracking-wide">{currentTeam?.name}</p>
        </div>

        <div className="relative">
          <Timer
            seconds={settings.timerSeconds}
            running={state.phase === 'playing'}
            onEnd={handleTimerEnd}
            devMode={devMode}
            onForceEnd={handleTimerEnd}
          />
        </div>

        <div className="text-center">
          {teams.map(tm => (
            <p key={tm.id} className="text-white/50 text-xs">
              {tm.name}: <span className="text-white font-bold">{tm.score}</span>
            </p>
          ))}
        </div>
      </div>

      {/* Main word display */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl px-8 py-8 w-full shadow-2xl">
          <p
            className="text-white font-black leading-tight break-words"
            style={{ fontSize: currentMovie.length > 20 ? '2rem' : currentMovie.length > 12 ? '2.8rem' : '3.8rem' }}
          >
            {currentMovie}
          </p>
          {tease && flash && (
            <p className="text-white text-xl mt-4 opacity-80">{tease}</p>
          )}
        </div>
      </div>

      {/* Correct button */}
      <div className="px-5 pb-4 pt-4">
        <button
          onPointerDown={handleCorrect}
          className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white py-8 rounded-2xl text-3xl font-black select-none shadow-lg shadow-emerald-500/30 active:shadow-none"
        >
          {t('correct')}
        </button>
      </div>

      {/* End Game button */}
      <div className="px-5 pb-8 flex justify-center">
        {confirmEnd ? (
          <div className="flex gap-3 justify-center">
            <button onClick={() => dispatch({ type: ACTIONS.FORCE_END })} className="text-rose-400 text-sm font-semibold">✓ {t('yesEnd')}</button>
            <button onClick={() => setConfirmEnd(false)} className="text-zinc-500 text-sm">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmEnd(true)} className="text-white/25 text-xs underline">
            {t('endGame')}
          </button>
        )}
      </div>
    </div>
  )
}
