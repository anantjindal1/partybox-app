import { useState, useCallback, useEffect } from 'react'
import { Timer } from './Timer'
import { useInputController } from './InputController'
import { ACTIONS } from './reducer'

const TEASE_CORRECT = ['Wah! 🔥', 'Sahi hai! ✅', 'Ekdum sahi! 🎯', 'Badhiya! 💪']
const TEASE_PASS = ['Arre! 😅', 'Koi baat nahi!', 'Agli baar! 🤞', 'Pass kar diya 😆']

function randomOf(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function vibrateCorrect() { navigator.vibrate?.([80]) }
function vibratePass() { navigator.vibrate?.([40, 40, 40]) }

export function RoundScreen({ state, dispatch, t }) {
  const { wordQueue, currentWordIndex, roundCorrect, roundPassed, settings, teams, currentTeamIndex } = state
  const [flash, setFlash] = useState(null)   // 'correct' | 'pass' | null
  const [tease, setTease] = useState('')
  const [timerKey, setTimerKey] = useState(0) // increment to reset timer

  const currentWord = wordQueue[currentWordIndex] ?? ''
  const currentTeam = teams[currentTeamIndex]

  // Reset timer when a new round starts (wordQueue changes)
  useEffect(() => { setTimerKey(k => k + 1) }, [wordQueue])

  const handleCorrect = useCallback(() => {
    vibrateCorrect()
    setFlash('correct')
    setTease(randomOf(TEASE_CORRECT))
    setTimeout(() => setFlash(null), 250)
    dispatch({ type: ACTIONS.CORRECT, payload: { ts: Date.now() } })
  }, [dispatch])

  const handlePass = useCallback(() => {
    vibratePass()
    setFlash('pass')
    setTease(randomOf(TEASE_PASS))
    setTimeout(() => setFlash(null), 250)
    dispatch({ type: ACTIONS.PASS, payload: { ts: Date.now() } })
  }, [dispatch])

  const handleTimerEnd = useCallback(() => {
    dispatch({ type: ACTIONS.TIMER_END })
  }, [dispatch])

  useInputController(settings.inputMode, handleCorrect, handlePass, state.phase === 'playing')

  const bgColor = flash === 'correct' ? 'bg-green-600' : flash === 'pass' ? 'bg-red-700' : 'bg-slate-900'

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-150 ${bgColor}`}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-3">
        <div className="text-center">
          <p className="text-slate-400 text-xs uppercase tracking-wide">{currentTeam?.name}</p>
          <p className="text-white font-bold text-lg">
            ✓ {roundCorrect} &nbsp;✗ {roundPassed}
          </p>
        </div>

        <div className="relative">
          <Timer
            key={timerKey}
            seconds={settings.timerSeconds}
            running={state.phase === 'playing'}
            onEnd={handleTimerEnd}
          />
        </div>

        <div className="text-center">
          <p className="text-slate-400 text-xs uppercase tracking-wide">Word</p>
          <p className="text-white font-bold text-lg">
            {currentWordIndex + 1} / {wordQueue.length}
          </p>
        </div>
      </div>

      {/* Main word display */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p
          className="text-white font-black leading-tight"
          style={{ fontSize: currentWord.length > 15 ? '2.2rem' : currentWord.length > 10 ? '3rem' : '3.8rem' }}
        >
          {currentWord}
        </p>
        {tease && flash && (
          <p className="text-white text-xl mt-4 opacity-80">{tease}</p>
        )}
      </div>

      {/* Input hints / buttons */}
      <div className="px-5 pb-10 pt-4">
        {settings.inputMode === 'tap' && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onPointerDown={handlePass}
              className="bg-slate-700 active:bg-slate-600 text-white py-6 rounded-2xl text-2xl font-black select-none"
            >
              {t('pass')}
            </button>
            <button
              onPointerDown={handleCorrect}
              className="bg-green-600 active:bg-green-500 text-white py-6 rounded-2xl text-2xl font-black select-none"
            >
              {t('correct')}
            </button>
          </div>
        )}

        {settings.inputMode === 'swipe' && (
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-slate-800 py-5 rounded-2xl">
              <p className="text-slate-300 text-lg font-bold">{t('swipeLeft')}</p>
            </div>
            <div className="bg-slate-800 py-5 rounded-2xl">
              <p className="text-slate-300 text-lg font-bold">{t('swipeRight')}</p>
            </div>
          </div>
        )}

        {settings.inputMode === 'volume' && (
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-slate-800 py-5 rounded-2xl">
              <p className="text-slate-300 text-lg font-bold">{t('volumeDown')}</p>
            </div>
            <div className="bg-slate-800 py-5 rounded-2xl">
              <p className="text-slate-300 text-lg font-bold">{t('volumeUp')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
