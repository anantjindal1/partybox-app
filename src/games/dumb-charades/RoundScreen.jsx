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
      flash === 'correct' ? 'bg-teal/60' : 'bg-transparent'
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
          <span className="text-textMuted text-sm">
            ➜ {turnSkipped} skipped
          </span>
        )}
      </div>

      {/* Word card */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-4">
        <div
          className={`w-full bg-surfaceElevated/80 border-2 rounded-3xl px-6 py-8 text-center transition-all duration-100 ${
            flash === 'correct'
              ? 'border-teal/80 bg-teal/30'
              : flash === 'skip'
              ? 'border-border/60 opacity-60'
              : 'border-border/50'
          }`}
        >
          <p
            className="text-textPrimary font-black leading-tight break-words"
            style={{ fontSize }}
          >
            {currentWord}
          </p>
        </div>

        {/* Hint card — bollywood_movies only, muted secondary styling */}
        {hints && (
          <div className="w-full bg-bg/70 border border-border/40 rounded-2xl px-4 py-3 space-y-1.5">
            <p className="text-textMuted text-[10px] uppercase tracking-widest mb-2">
              Actor hints 👁 (only you can see this)
            </p>
            <div className="flex items-start gap-2">
              <span className="text-sm w-4 flex-shrink-0">🎭</span>
              <span className="text-textMuted text-xs leading-snug">{hints.cast}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm w-4 flex-shrink-0">📅</span>
              <span className="text-textMuted text-xs">{hints.year}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm w-4 flex-shrink-0">🎬</span>
              <span className="text-textMuted text-xs">{hints.genre}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm w-4 flex-shrink-0">💬</span>
              <span className="text-textMuted text-xs italic leading-snug">"{hints.tagline}"</span>
            </div>
          </div>
        )}
      </div>

      {/* Words left hint */}
      <p className="text-center text-textSecondary text-xs py-1">
        {remaining} word{remaining !== 1 ? 's' : ''} left in queue
      </p>

      {/* Action buttons */}
      <div className="px-4 pb-8 space-y-3">
        <button
          onPointerDown={handleCorrect}
          className="w-full py-6 rounded-2xl bg-teal hover:opacity-90 active:scale-[0.98] text-onTeal font-black text-3xl select-none transition-colors"
        >
          ✓ CORRECT
        </button>

        <button
          onPointerDown={handleSkip}
          className="w-full py-4 rounded-2xl bg-transparent border border-border hover:border-border text-textMuted hover:text-textSecondary font-bold text-lg select-none transition-colors"
        >
          ➜ SKIP
        </button>
      </div>
    </div>
  )
}
