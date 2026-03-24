import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import CircularTimer from '../../components/CircularTimer'
import { ACTIONS } from './reducer'
import { WORD_PACKS } from './wordpacks'

export function RoundScreen({ state, dispatch }) {
  const { currentWord, turnSkipped, wordQueue, timerSeconds, categories } = state
  const [secondsLeft, setSecondsLeft] = useState(timerSeconds)
  const [flash, setFlash] = useState(null)    // 'correct' | 'skip' | null
  const intervalRef  = useRef(null)
  const firedRef     = useRef(false)
  const startRef     = useRef(Date.now())

  // Timer starts when component mounts and restarts only if timerSeconds changes.
  // Skip does NOT reset the timer — currentWord changes but timerSeconds stays the same.
  useEffect(() => {
    firedRef.current  = false
    startRef.current  = Date.now()
    setSecondsLeft(timerSeconds)

    intervalRef.current = setInterval(() => {
      const elapsed   = Date.now() - startRef.current
      const remaining = Math.max(0, Math.ceil((timerSeconds * 1000 - elapsed) / 1000))
      setSecondsLeft(remaining)
      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true
        clearInterval(intervalRef.current)
        dispatch({ type: ACTIONS.TIMER_END })
      }
    }, 100)

    return () => clearInterval(intervalRef.current)
  }, [timerSeconds]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle correct — ends the turn immediately
  const handleCorrect = useCallback(() => {
    if (firedRef.current) return // ignore if timer already fired
    firedRef.current = true // prevent TIMER_END race if timer fires simultaneously
    setFlash('correct')
    setTimeout(() => setFlash(null), 180)
    dispatch({ type: ACTIONS.CORRECT })
  }, [dispatch])

  // Handle skip — next word, timer continues
  const handleSkip = useCallback(() => {
    setFlash('skip')
    setTimeout(() => setFlash(null), 150)
    dispatch({ type: ACTIONS.SKIP })
  }, [dispatch])

  // Look up hints for bollywood_movies words only
  const hints = useMemo(() => {
    if (!categories.includes('bollywood_movies')) return null
    const pack = WORD_PACKS['bollywood_movies']
    if (!pack) return null
    const entry = pack.words.find(w => w.word === currentWord)
    return entry?.hints ?? null
  }, [currentWord, categories])

  const wordLen = currentWord.length
  const fontSize = wordLen > 24 ? '1.5rem' : wordLen > 16 ? '2rem' : wordLen > 10 ? '2.6rem' : '3.2rem'
  const remaining = wordQueue.length

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-100 ${
      flash === 'correct' ? 'bg-emerald-950/60' : 'bg-transparent'
    }`}>

      {/* Timer row */}
      <div className="flex justify-center pt-6 pb-2">
        <CircularTimer
          totalSeconds={timerSeconds}
          secondsLeft={secondsLeft}
          size={110}
        />
      </div>

      {/* Skip count (shown once at least one skip has happened) */}
      <div className="text-center pb-2 min-h-[1.75rem]">
        {turnSkipped > 0 && (
          <span className="text-zinc-500 text-sm">
            ➜ {turnSkipped} skipped
          </span>
        )}
      </div>

      {/* Word card */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-4">
        <div
          className={`w-full bg-zinc-800/80 border-2 rounded-3xl px-6 py-8 text-center transition-all duration-100 ${
            flash === 'correct'
              ? 'border-emerald-500/80 bg-emerald-900/30'
              : flash === 'skip'
              ? 'border-zinc-600/60 opacity-60'
              : 'border-zinc-700/50'
          }`}
        >
          <p
            className="text-white font-black leading-tight break-words"
            style={{ fontSize }}
          >
            {currentWord}
          </p>
        </div>

        {/* Hint card — bollywood_movies only, muted secondary styling */}
        {hints && (
          <div className="w-full bg-zinc-900/70 border border-zinc-700/40 rounded-2xl px-4 py-3 space-y-1.5">
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest mb-2">
              Actor hints 👁 (only you can see this)
            </p>
            <div className="flex items-start gap-2">
              <span className="text-sm w-4 flex-shrink-0">🎭</span>
              <span className="text-zinc-500 text-xs leading-snug">{hints.cast}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm w-4 flex-shrink-0">📅</span>
              <span className="text-zinc-500 text-xs">{hints.year}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm w-4 flex-shrink-0">🎬</span>
              <span className="text-zinc-500 text-xs">{hints.genre}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm w-4 flex-shrink-0">💬</span>
              <span className="text-zinc-500 text-xs italic leading-snug">"{hints.tagline}"</span>
            </div>
          </div>
        )}
      </div>

      {/* Words left hint */}
      <p className="text-center text-zinc-700 text-xs py-1">
        {remaining} word{remaining !== 1 ? 's' : ''} left in queue
      </p>

      {/* Action buttons */}
      <div className="px-4 pb-8 space-y-3">
        <button
          onPointerDown={handleCorrect}
          className="w-full py-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-black text-3xl select-none transition-colors"
        >
          ✓ CORRECT
        </button>

        <button
          onPointerDown={handleSkip}
          className="w-full py-4 rounded-2xl bg-transparent border border-zinc-600 hover:border-zinc-500 text-zinc-400 hover:text-zinc-300 font-bold text-lg select-none transition-colors"
        >
          ➜ SKIP
        </button>
      </div>
    </div>
  )
}
