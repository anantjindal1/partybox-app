import { useState, useEffect, useRef } from 'react'
import { ACTIONS } from './reducer'
import { DC } from './theme'

const PREP_SECONDS = 30

export function ActorPrepScreen({ state, dispatch, t, devMode = false }) {
  const { wordQueue, replacementsLeft, settings, teams, currentTeamIndex } = state
  const currentMovie = wordQueue[0] ?? ''
  const currentTeam = teams[currentTeamIndex]
  const [prepTime, setPrepTime] = useState(PREP_SECONDS)
  const timerRef = useRef(null)
  const startedRef = useRef(false)

  // Countdown clock for prep window
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    timerRef.current = setInterval(() => {
      setPrepTime(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  function handleReplace() {
    if (replacementsLeft <= 0) return
    dispatch({ type: ACTIONS.REPLACE_WORD })
  }

  function handleReadyToAct() {
    clearInterval(timerRef.current)
    dispatch({ type: ACTIONS.START_ACTING })
  }

  function handleSkipPrep() {
    clearInterval(timerRef.current)
    dispatch({ type: ACTIONS.START_ACTING })
  }

  const urgentPrep = prepTime <= 10

  return (
    <div className={`min-h-screen ${DC.bg} ${DC.text} flex flex-col items-center justify-center px-6 space-y-6 text-center`}>
      {/* Team label */}
      <div className={`${DC.card} border ${DC.accentBorder} rounded-2xl px-8 py-3`}>
        <p className="text-2xl font-black text-white">{currentTeam?.name}</p>
      </div>

      <p className={`${DC.textMuted} text-xs uppercase tracking-widest`}>{t('yourMovieIs')}</p>

      {/* Movie name */}
      <div className={`${DC.card} border ${DC.cardBorder} rounded-3xl px-8 py-6 w-full`}>
        <p
          className="text-white font-black leading-tight break-words"
          style={{ fontSize: currentMovie.length > 20 ? '1.8rem' : currentMovie.length > 12 ? '2.4rem' : '3rem' }}
        >
          {currentMovie}
        </p>
      </div>

      {/* Prep countdown */}
      <p className={`text-lg font-semibold ${urgentPrep ? `${DC.accent} animate-pulse` : DC.textMuted}`}>
        {t('prepTimeLeft')}: {prepTime}{t('seconds')}
      </p>

      {devMode && (
        <button onClick={handleSkipPrep} className={`text-xs ${DC.accent} underline`}>
          ⚡ {t('skipPrep')}
        </button>
      )}

      {/* Replace button */}
      <button
        onClick={handleReplace}
        disabled={replacementsLeft <= 0}
        className={`flex items-center gap-2 px-6 py-3 rounded-2xl ${DC.card} border ${DC.cardBorder} hover:bg-[#252525] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors`}
      >
        🔄 {t('replaceWord')}
        <span className={`${DC.accentBg} text-[#141414] text-xs font-black px-2 py-0.5 rounded-full`}>
          {replacementsLeft} {t('replacementsLeft')}
        </span>
      </button>

      {/* Ready to Act */}
      <div className="w-full pt-2">
        <button
          onClick={handleReadyToAct}
          className={`w-full py-5 rounded-2xl ${DC.accentBg} ${DC.accentBgHover} active:opacity-90 text-[#141414] font-black text-2xl transition-colors select-none`}
        >
          🎬 {t('readyToAct')}
        </button>
      </div>

      {/* Scoreboard */}
      <div className={`w-full ${DC.card} border ${DC.cardBorder} rounded-2xl p-4 space-y-2`}>
        {teams.map(tm => (
          <div key={tm.id} className={`flex justify-between px-4 py-2 rounded-xl ${
            tm.id === currentTeam?.id ? `${DC.accentMuted} border ${DC.accentBorder}` : 'bg-white/5 border border-white/10'
          }`}>
            <span className="text-zinc-200 font-medium">{tm.name}</span>
            <span className="text-white font-bold">{tm.score} / {settings.winPoints}</span>
          </div>
        ))}
      </div>

      <p className={`${DC.textMuted} text-sm`}>{t('guesserRole')}</p>

      <EndGameButton onConfirm={() => dispatch({ type: ACTIONS.FORCE_END })} t={t} />
    </div>
  )
}

function EndGameButton({ onConfirm, t }) {
  const [confirming, setConfirming] = useState(false)
  if (confirming) {
    return (
      <div className="flex gap-3 justify-center">
        <button onClick={onConfirm} className={`${DC.accent} text-sm font-semibold`}>✓ {t('yesEnd')}</button>
        <button onClick={() => setConfirming(false)} className={`${DC.textMuted} text-sm`}>Cancel</button>
      </div>
    )
  }
  return (
    <button onClick={() => setConfirming(true)} className="text-zinc-500 text-xs underline mt-2">
      {t('endGame')}
    </button>
  )
}
