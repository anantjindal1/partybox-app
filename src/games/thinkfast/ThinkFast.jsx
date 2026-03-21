/**
 * ThinkFast — single-player speed quiz.
 * 10 questions · 15s timer · auto-advance reveal · grade system · localStorage stats.
 * Self-contained: all screens defined inline.
 */
import { useState, useEffect, useRef, useReducer } from 'react'
import { useLang } from '../../store/LangContext'
import { GameChrome } from '../../components/GameChrome'
import { FadeIn } from '../../components/FadeIn'
import CircularTimer from '../../components/CircularTimer'
import { fetchGameQuestions } from '../../services/questions'
import { resolveTitle } from '../../utils/strings'
import { getStats, recordGame } from './stats'

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_QUESTIONS    = 10
const QUESTION_TIME_MS   = 15_000
const REVEAL_DURATION_MS = 3_000

const CATEGORY_DISPLAY = {
  gk:        { label: 'General Knowledge', emoji: '🇮🇳' },
  bollywood: { label: 'Bollywood',         emoji: '🎬' },
  cricket:   { label: 'Cricket & Sports',  emoji: '🏏' },
  science:   { label: 'Science & Tech',    emoji: '🔬' },
  food:      { label: 'Food & Lifestyle',  emoji: '🍛' },
  brain:     { label: 'Brain & Culture',   emoji: '🧠' },
  random:    { label: 'Random Mix',        emoji: '🎲' },
}

const CATEGORIES = ['gk', 'bollywood', 'cricket', 'science', 'food', 'brain', 'random']

// ── Scoring ───────────────────────────────────────────────────────────────────

function computeScore(responseMs, correct) {
  if (!correct) return 0
  if (responseMs <= 5_000)  return 1000
  if (responseMs <= 10_000) return 900
  return 800
}

function getGrade(score) {
  if (score >= 9000) return { rank: 'S', label: 'Genius',          emoji: '🧠', color: 'text-violet-400', bg: 'bg-violet-500/20 border-violet-500/50' }
  if (score >= 7000) return { rank: 'A', label: 'Sharp',           emoji: '🔥', color: 'text-amber-400',  bg: 'bg-amber-500/20 border-amber-500/50'   }
  if (score >= 5000) return { rank: 'B', label: 'Good',            emoji: '👍', color: 'text-emerald-400',bg: 'bg-emerald-500/20 border-emerald-500/50'}
  return               { rank: 'C', label: 'Keep Practicing',  emoji: '📚', color: 'text-zinc-400',   bg: 'bg-zinc-700/50 border-zinc-600/40'      }
}

// ── State machine ─────────────────────────────────────────────────────────────

function getInitialState() {
  return {
    phase: 'category_select',
    category: null,
    questions: [],
    currentIdx: 0,
    score: 0,
    streak: 0,
    questionStartTime: null,
    lastResponseMs: null,
    lastCorrect: null,
    lastSelectedIdx: -1,
    lastPointsEarned: 0,
    questionHistory: [],   // [{correct, responseMs, pointsEarned}]
    // pause state
    paused: false,
    isAutoPause: false,
    pauseStartTime: null,
    inactiveStreak: 0,     // consecutive timeouts with no tap
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...getInitialState(),
        phase: 'question',
        category: action.category,
        questions: action.questions,
        questionStartTime: action.startTime,
      }

    case 'ANSWER': {
      const q       = state.questions[state.currentIdx]
      const correct = action.selectedIdx === q.correctIdx
      const pts     = computeScore(action.responseMs, correct)
      return {
        ...state,
        phase:            'reveal',
        score:            state.score + pts,
        streak:           correct ? state.streak + 1 : 0,
        inactiveStreak:   0,           // any tap resets inactivity
        lastResponseMs:   action.responseMs,
        lastCorrect:      correct,
        lastSelectedIdx:  action.selectedIdx,
        lastPointsEarned: pts,
        questionHistory: [
          ...state.questionHistory,
          {
            correct,
            responseMs:   action.responseMs,
            pointsEarned: pts,
            selectedIdx:  action.selectedIdx,
            correctIdx:   q.correctIdx,
            question:     q.question,
            options:      q.options,
          },
        ],
      }
    }

    case 'TIMEOUT': {
      const newInactive = state.inactiveStreak + 1
      const q           = state.questions[state.currentIdx]
      const historyEntry = {
        correct:      false,
        responseMs:   QUESTION_TIME_MS,
        pointsEarned: 0,
        selectedIdx:  null,
        correctIdx:   q.correctIdx,
        question:     q.question,
        options:      q.options,
      }

      if (newInactive >= 2) {
        // Two consecutive timeouts → auto-pause (record the miss, stay on current question)
        return {
          ...state,
          paused:           true,
          isAutoPause:      true,
          pauseStartTime:   action.now,
          streak:           0,
          inactiveStreak:   newInactive,
          lastResponseMs:   QUESTION_TIME_MS,
          lastCorrect:      false,
          lastSelectedIdx:  -1,
          lastPointsEarned: 0,
          questionHistory:  [...state.questionHistory, historyEntry],
        }
      }

      // First timeout → show reveal normally
      return {
        ...state,
        phase:            'reveal',
        streak:           0,
        inactiveStreak:   newInactive,
        lastResponseMs:   QUESTION_TIME_MS,
        lastCorrect:      false,
        lastSelectedIdx:  -1,
        lastPointsEarned: 0,
        questionHistory:  [...state.questionHistory, historyEntry],
      }
    }

    case 'NEXT': {
      const nextIdx = state.currentIdx + 1
      if (nextIdx >= state.questions.length) return { ...state, phase: 'game_end' }
      return {
        ...state,
        phase:             'question',
        currentIdx:        nextIdx,
        questionStartTime: action.startTime,
        lastResponseMs:    null,
        lastCorrect:       null,
        lastSelectedIdx:   -1,
        lastPointsEarned:  0,
      }
    }

    case 'PAUSE':
      return {
        ...state,
        paused:         true,
        isAutoPause:    false,
        pauseStartTime: action.now,
      }

    case 'RESUME': {
      const pausedMs = action.now - state.pauseStartTime

      if (state.isAutoPause) {
        // Auto-pause: the timed-out question is already in history → skip to next
        const nextIdx = state.currentIdx + 1
        if (nextIdx >= state.questions.length) {
          return { ...state, paused: false, pauseStartTime: null, isAutoPause: false, phase: 'game_end' }
        }
        return {
          ...state,
          paused:            false,
          pauseStartTime:    null,
          isAutoPause:       false,
          inactiveStreak:    0,
          phase:             'question',
          currentIdx:        nextIdx,
          questionStartTime: action.now,
          lastResponseMs:    null,
          lastCorrect:       null,
          lastSelectedIdx:   -1,
          lastPointsEarned:  0,
        }
      }

      // Manual pause: shift questionStartTime forward so remaining time is preserved
      return {
        ...state,
        paused:            false,
        pauseStartTime:    null,
        isAutoPause:       false,
        questionStartTime: state.questionStartTime + pausedMs,
      }
    }

    case 'QUIT':
      return getInitialState()

    case 'RESET':
      return getInitialState()

    default:
      return state
  }
}

// ── Utility: staggered fade-in row ────────────────────────────────────────────

function FadeInRow({ delay = 0, children }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div style={{
      opacity:    visible ? 1 : 0,
      transform:  visible ? 'translateY(0)' : 'translateY(6px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }}>
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ThinkFast({ slug, gameTitle }) {
  const { lang }                           = useLang()
  const [state, dispatch]                  = useReducer(reducer, undefined, getInitialState)
  const [countdown, setCountdown]          = useState(QUESTION_TIME_MS / 1000)
  const lockedRef                          = useRef(false)
  const countdownRef                       = useRef(null)
  const revealTimerRef                     = useRef(null)
  const [recordResult, setRecordResult]    = useState(null)

  const title = resolveTitle(gameTitle, lang)

  // ── Question countdown + auto-timeout ──────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'question' || !state.questionStartTime || state.paused) {
      // Clear interval when paused or not in question phase
      clearInterval(countdownRef.current)
      return
    }
    lockedRef.current = false
    if (countdownRef.current) clearInterval(countdownRef.current)

    const start = state.questionStartTime
    // Sync display immediately before first tick
    const initialElapsed = Date.now() - start
    setCountdown(Math.max(0, Math.ceil((QUESTION_TIME_MS - initialElapsed) / 1000)))

    countdownRef.current = setInterval(() => {
      const elapsed   = Date.now() - start
      const remaining = Math.max(0, Math.ceil((QUESTION_TIME_MS - elapsed) / 1000))
      setCountdown(remaining)
      if (elapsed >= QUESTION_TIME_MS) {
        clearInterval(countdownRef.current)
        if (!lockedRef.current) {
          lockedRef.current = true
          dispatch({ type: 'TIMEOUT', now: Date.now() })
        }
      }
    }, 100)
    return () => clearInterval(countdownRef.current)
  }, [state.phase, state.currentIdx, state.questionStartTime, state.paused])

  // ── Reveal auto-advance ─────────────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'reveal') return
    revealTimerRef.current = setTimeout(() => {
      dispatch({ type: 'NEXT', startTime: Date.now() })
    }, REVEAL_DURATION_MS)
    return () => clearTimeout(revealTimerRef.current)
  }, [state.phase, state.currentIdx])

  // ── Record game on game_end ─────────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'game_end') return
    const result = recordGame(state.category, state.score, state.questionHistory)
    setRecordResult(result)
    // Award XP proportional to score
    import('../../services/xp').then(({ awardXP }) => {
      awardXP(Math.floor(state.score / 100)).catch(() => {})
    })
  }, [state.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleSelectCategory(category) {
    const questions = fetchGameQuestions({ category, count: TOTAL_QUESTIONS })
    dispatch({ type: 'START_GAME', category, questions, startTime: Date.now() })
  }

  function handleAnswer(selectedIdx) {
    if (lockedRef.current || state.phase !== 'question') return
    lockedRef.current = true
    clearInterval(countdownRef.current)
    const responseMs = Math.min(Date.now() - state.questionStartTime, QUESTION_TIME_MS)
    dispatch({ type: 'ANSWER', selectedIdx, responseMs })
  }

  function handlePause() {
    dispatch({ type: 'PAUSE', now: Date.now() })
  }

  function handleResume() {
    dispatch({ type: 'RESUME', now: Date.now() })
  }

  function handleQuit() {
    dispatch({ type: 'QUIT' })
  }

  function handlePlayAgain() {
    const questions = fetchGameQuestions({ category: state.category, count: TOTAL_QUESTIONS })
    dispatch({ type: 'START_GAME', category: state.category, questions, startTime: Date.now() })
  }

  function handleChangeCategory() {
    dispatch({ type: 'RESET' })
  }

  const q        = state.questions[state.currentIdx]
  const phaseKey = state.phase === 'question' ? `q-${state.currentIdx}`
                 : state.phase === 'reveal'   ? `r-${state.currentIdx}`
                 : state.phase

  return (
    <GameChrome slug={slug} gameTitle={title} state={state}>
      <FadeIn key={phaseKey}>
        {state.phase === 'category_select' && (
          <CategorySelectScreen onSelect={handleSelectCategory} />
        )}
        {state.phase === 'question' && q && (
          <QuestionScreen
            q={q}
            currentIdx={state.currentIdx}
            score={state.score}
            streak={state.streak}
            countdown={countdown}
            paused={state.paused}
            onAnswer={handleAnswer}
            onPause={handlePause}
          />
        )}
        {state.phase === 'reveal' && q && (
          <RevealScreen
            q={q}
            currentIdx={state.currentIdx}
            lastCorrect={state.lastCorrect}
            lastSelectedIdx={state.lastSelectedIdx}
            lastPointsEarned={state.lastPointsEarned}
            score={state.score}
            streak={state.streak}
          />
        )}
        {state.phase === 'game_end' && (
          <GameEndScreen
            score={state.score}
            category={state.category}
            questionHistory={state.questionHistory}
            recordResult={recordResult}
            onPlayAgain={handlePlayAgain}
            onChangeCategory={handleChangeCategory}
          />
        )}
      </FadeIn>
      {/* Pause overlay — rendered outside FadeIn so it layers on top */}
      {state.paused && (
        <PauseOverlay
          score={state.score}
          currentIdx={state.currentIdx}
          isAutoPause={state.isAutoPause}
          onResume={handleResume}
          onQuit={handleQuit}
        />
      )}
    </GameChrome>
  )
}

// ── PauseOverlay ──────────────────────────────────────────────────────────────

function PauseOverlay({ score, currentIdx, isAutoPause, onResume, onQuit }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div className="w-full max-w-sm bg-zinc-800/90 border border-zinc-700/60 rounded-2xl p-6 space-y-5 text-center">
        <div className="space-y-1">
          <p className="text-3xl">⏸</p>
          <h2 className="text-xl font-black text-white">Game Paused</h2>
          {isAutoPause && (
            <p className="text-zinc-400 text-sm">You seemed to step away — pick up where you left off.</p>
          )}
        </div>

        <div className="flex justify-center gap-6 text-sm text-zinc-400">
          <span>Q {currentIdx + 1} / {TOTAL_QUESTIONS}</span>
          <span className="text-amber-400 font-bold">{score} pts</span>
        </div>

        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full py-4 rounded-2xl font-bold text-base bg-amber-500 hover:bg-amber-400 text-zinc-900 transition-colors active:scale-[0.98]"
          >
            Resume
          </button>
          <button
            onClick={onQuit}
            className="w-full py-2 text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Quit Game
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CategorySelectScreen ──────────────────────────────────────────────────────

function CategorySelectScreen({ onSelect }) {
  const [stats, setStats] = useState({})

  useEffect(() => {
    const s = {}
    CATEGORIES.forEach(cat => { s[cat] = getStats(cat) })
    setStats(s)
  }, [])

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-white">ThinkFast ⚡</h1>
        <p className="text-zinc-400 text-sm">10 questions · 15s each · Speed scoring</p>
        <p className="text-xs text-zinc-400 text-center mt-2">⚡ Faster answers = more points</p>
        <div className="flex justify-center gap-2 mt-1">
          <span className="bg-green-500/20 text-green-400 rounded-lg px-2 py-1 text-xs font-medium">⚡ 0–5s = 1000</span>
          <span className="bg-yellow-500/20 text-yellow-400 rounded-lg px-2 py-1 text-xs font-medium">🕐 5–10s = 900</span>
          <span className="bg-orange-500/20 text-orange-400 rounded-lg px-2 py-1 text-xs font-medium">🕑 10–15s = 800</span>
        </div>
        <p className="text-xs text-zinc-500 text-center mt-1">Wrong or no answer = 0 pts</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map(cat => {
          const d = CATEGORY_DISPLAY[cat]
          const s = stats[cat] ?? {}
          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className="flex flex-col items-center gap-1.5 py-5 px-3 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 hover:bg-zinc-700/80 hover:border-zinc-600/60 active:scale-[0.97] transition-all text-center"
            >
              <span className="text-3xl leading-none">{d.emoji}</span>
              <span className="text-sm font-semibold text-zinc-200 leading-tight">{d.label}</span>
              <div className="mt-0.5 space-y-0.5 min-h-[2rem]">
                {s.highScore > 0 && (
                  <p className="text-xs text-zinc-500">Best: {s.highScore} pts</p>
                )}
                {s.fastestMs != null && (
                  <p className="text-xs text-zinc-500">⚡ {(s.fastestMs / 1000).toFixed(1)}s</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── QuestionScreen ────────────────────────────────────────────────────────────

function QuestionScreen({ q, currentIdx, score, streak, countdown, paused, onAnswer, onPause }) {
  const isFinal = currentIdx === TOTAL_QUESTIONS - 1

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-sm font-medium">
            Q {currentIdx + 1} / {TOTAL_QUESTIONS}
          </span>
          {streak >= 2 && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              🔥 {streak}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-bold tabular-nums">{score} pts</span>
          <button
            onClick={onPause}
            className="px-3 py-1 rounded-lg bg-amber-500 text-black text-xs font-black tracking-wide"
            aria-label="Pause"
          >
            PAUSE
          </button>
        </div>
      </div>

      {/* Circular timer */}
      <div className="flex justify-center">
        <CircularTimer totalSeconds={15} secondsLeft={countdown} size={100} paused={paused} />
      </div>

      {/* Final question callout */}
      {isFinal && (
        <div className="text-center text-amber-400 font-bold text-sm animate-pulse">
          🏆 FINAL QUESTION — Make it count!
        </div>
      )}

      {/* Question card */}
      <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-5">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
          Question {currentIdx + 1} of {TOTAL_QUESTIONS}
        </p>
        <p className="text-white font-semibold text-lg leading-snug">{q.question}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => onAnswer(idx)}
            className="w-full text-left px-5 py-4 rounded-2xl font-semibold text-sm bg-zinc-800 border border-zinc-700/60 hover:bg-zinc-700 hover:border-zinc-500 text-zinc-200 transition-colors active:scale-[0.98]"
          >
            <span className="text-zinc-500 mr-3 font-mono text-xs">{String.fromCharCode(65 + idx)}.</span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── RevealScreen ──────────────────────────────────────────────────────────────

function RevealScreen({ q, currentIdx, lastCorrect, lastSelectedIdx, lastPointsEarned, score, streak }) {
  const timedOut = lastSelectedIdx === -1 && !lastCorrect

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-zinc-400 text-sm">Q {currentIdx + 1} / {TOTAL_QUESTIONS} — Answer</span>
        <span className="text-amber-400 font-bold tabular-nums">{score} pts</span>
      </div>

      {/* Result banner */}
      <div className={`rounded-xl border px-4 py-3 text-center font-bold text-lg ${
        lastCorrect
          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
          : 'bg-red-500/15 border-red-500/30 text-red-400'
      }`}>
        {timedOut
          ? "⏰ Time's up!"
          : lastCorrect
          ? `+${lastPointsEarned} pts`
          : 'Wrong answer'}
        {lastCorrect && streak >= 2 && (
          <span className="ml-2 text-sm font-semibold text-amber-300">🔥 {streak} streak!</span>
        )}
      </div>

      {/* Options with colour reveal */}
      <div className="grid grid-cols-1 gap-2">
        {q.options.map((opt, idx) => {
          const isCorrect  = idx === q.correctIdx
          const isSelected = idx === lastSelectedIdx
          const isWrong    = isSelected && !lastCorrect
          return (
            <div
              key={idx}
              className={`px-5 py-3.5 rounded-2xl font-semibold text-sm border ${
                isCorrect
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : isWrong
                  ? 'bg-red-500/15 border-red-500/30 text-red-400'
                  : 'bg-zinc-800/50 border-zinc-700/30 text-zinc-500'
              }`}
            >
              {isCorrect && <span className="mr-2">✅</span>}
              {isWrong   && <span className="mr-2">❌</span>}
              <span className="text-zinc-600 mr-2 font-mono text-xs">{String.fromCharCode(65 + idx)}.</span>
              {opt}
            </div>
          )
        })}
      </div>

      {/* Explanation */}
      {q.explanation?.trim() && (
        <FadeInRow delay={500}>
          <div className="bg-zinc-700/50 rounded-xl px-4 py-3">
            <p className="text-slate-300 text-sm italic">💡 {q.explanation}</p>
          </div>
        </FadeInRow>
      )}

      <p className="text-center text-zinc-600 text-xs">Next question in 3s…</p>
    </div>
  )
}

// ── GameEndScreen ─────────────────────────────────────────────────────────────

function GameEndScreen({ score, category, questionHistory, recordResult, onPlayAgain, onChangeCategory }) {
  const grade  = getGrade(score)
  const d      = CATEGORY_DISPLAY[category] ?? CATEGORY_DISPLAY.random

  const correctCount  = questionHistory.filter(q => q.correct).length
  const accuracy      = Math.round((correctCount / TOTAL_QUESTIONS) * 100)
  const correctTimes  = questionHistory.filter(q => q.correct).map(q => q.responseMs)
  const avgMs         = correctTimes.length
    ? Math.round(correctTimes.reduce((a, b) => a + b, 0) / correctTimes.length)
    : null
  const fastestMs     = correctTimes.length ? Math.min(...correctTimes) : null

  const [copyStatus, setCopyStatus] = useState(null)

  // Confetti for S or A
  useEffect(() => {
    if (grade.rank !== 'S' && grade.rank !== 'A') return
    import('canvas-confetti').then(mod => {
      const fire = mod.default
      fire({ particleCount: 120, spread: 70, origin: { y: 0.4 },
        colors: ['#f59e0b', '#fbbf24', '#34d399', '#60a5fa', '#f87171'] })
      if (grade.rank === 'S') {
        setTimeout(() => {
          fire({ particleCount: 60, spread: 45, origin: { y: 0.6 }, angle: 60 })
          fire({ particleCount: 60, spread: 45, origin: { y: 0.6 }, angle: 120 })
        }, 600)
      }
    })
  }, [grade.rank])

  // Share
  const appUrl    = typeof window !== 'undefined' ? window.location.origin : 'https://partybox-app.vercel.app'
  const shareText = `I scored ${score} in ${d.label} on ThinkFast!\nRank: ${grade.label} ${grade.emoji}\nCan you beat me? 🎯\n${appUrl}`
  const waUrl     = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus(null), 2500)
    } catch { /* ignore */ }
  }

  return (
    <div className="px-4 py-6 space-y-5 pb-40">
      {/* Grade badge */}
      <div className="text-center">
        <div className={`inline-flex flex-col items-center px-8 py-5 rounded-2xl border ${grade.bg} space-y-1`}>
          <span className="text-5xl">{grade.emoji}</span>
          <span className={`text-4xl font-black ${grade.color}`}>{grade.rank}</span>
          <span className={`text-sm font-semibold ${grade.color}`}>{grade.label}</span>
        </div>
      </div>

      {/* Score */}
      <div className="text-center space-y-1">
        <p className="text-5xl font-black text-white tabular-nums">{score}</p>
        <p className="text-zinc-400 text-sm">{d.emoji} {d.label}</p>
      </div>

      {/* New high score */}
      {recordResult?.newHighScore && (
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl px-4 py-3 text-center">
          <p className="text-amber-300 font-bold">New High Score! 🎉</p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Accuracy',  value: `${accuracy}%` },
          { label: 'Avg Speed', value: avgMs     ? `${(avgMs / 1000).toFixed(1)}s`     : '—' },
          { label: 'Fastest',   value: fastestMs ? `${(fastestMs / 1000).toFixed(1)}s` : '—' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-800/80 border border-zinc-700/50 rounded-xl p-3 text-center">
            <p className="text-white font-bold text-lg">{s.value}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-2">
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wide">📋 How You Did</p>
        {questionHistory.map((h, i) => {
          const timedOut      = h.selectedIdx === null
          const selectedAns   = h.selectedIdx != null ? h.options?.[h.selectedIdx] : null
          const correctAns    = h.options?.[h.correctIdx] ?? null
          return (
            <FadeInRow key={i} delay={i * 60}>
              <div className="bg-zinc-800/60 border border-zinc-700/40 rounded-xl px-3 py-2 mb-2">
                {/* Question text */}
                {h.question && (
                  <p className="text-zinc-500 text-xs mb-1.5 truncate">{h.question}</p>
                )}
                {/* Summary row */}
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">
                    {timedOut ? '⏰' : h.correct ? '✅' : '❌'}
                  </span>
                  <span className={`font-bold text-sm ${h.pointsEarned > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                    {h.pointsEarned > 0 ? `+${h.pointsEarned} pts` : '0 pts'}
                  </span>
                  {h.correct && (
                    <span className="text-zinc-500 text-xs ml-auto">
                      {(h.responseMs / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
                {/* Answer detail */}
                {h.correct && selectedAns && (
                  <p className="text-emerald-400 text-sm mt-1">✓ {selectedAns}</p>
                )}
                {!h.correct && !timedOut && selectedAns && (
                  <p className="text-sm mt-1">
                    <span className="text-red-400">✗ {selectedAns}</span>
                    <span className="text-zinc-500"> → </span>
                    <span className="text-emerald-400">{correctAns}</span>
                  </p>
                )}
                {timedOut && correctAns && (
                  <p className="text-emerald-400 text-sm mt-1">✓ {correctAns}</p>
                )}
              </div>
            </FadeInRow>
          )
        })}
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-2 gap-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
        >
          📱 WhatsApp
        </a>
        <button
          onClick={handleCopy}
          className={`flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm border transition-colors ${
            copyStatus === 'copied'
              ? 'bg-zinc-700 border-zinc-600/50 text-emerald-400'
              : 'bg-zinc-700 border-zinc-600/50 text-zinc-200 hover:bg-zinc-600'
          }`}
        >
          {copyStatus === 'copied' ? '✓ Copied!' : '🔗 Copy Result'}
        </button>
      </div>

      {/* Primary CTA — sticky at bottom */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-zinc-900 via-zinc-900/95 to-transparent space-y-3">
        <button
          onClick={onPlayAgain}
          className="w-full py-4 rounded-2xl font-bold text-base bg-amber-500 hover:bg-amber-400 text-zinc-900 transition-colors active:scale-[0.98]"
        >
          Play Again 🔄
        </button>
        <button
          onClick={onChangeCategory}
          className="w-full py-3 rounded-2xl font-semibold text-sm bg-zinc-800 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          Change Category
        </button>
      </div>
    </div>
  )
}
