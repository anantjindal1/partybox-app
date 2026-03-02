import { useState, useEffect, useRef } from 'react'
import { useLang } from '../../store/LangContext'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { trackEvent } from '../../services/analytics'
import { getQuestions, CATEGORY_LABELS, CATEGORIES } from './questions'
import { computeRoundScore, resolveTieBreak } from './scoring'

const TOTAL_ROUNDS = 10
const QUESTION_TIMEOUT_MS = 15_000
const REVEAL_DURATION_MS = 3_000

export default function RapidFireBattle({ code }) {
  const { t, lang } = useLang()
  const {
    room,
    roomState,
    actions,
    sendAction,
    setState,
    clearActions,
    isHost,
    myId,
    players,
  } = useOnlineRoom(code)

  const [answered, setAnswered] = useState(false)
  const [localCountdown, setLocalCountdown] = useState(QUESTION_TIMEOUT_MS / 1000)
  const questionTimerRef = useRef(null)
  const countdownRef = useRef(null)
  const xpAwarded = useRef(false)

  const phase = roomState.phase || 'waiting'

  // ─── XP + stats award on results ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results' || !myId || xpAwarded.current) return
    xpAwarded.current = true

    const totalScores = roomState.totalScores ?? {}
    const myScore = totalScores[myId] ?? 0
    const sorted = resolveTieBreak(
      Object.keys(totalScores),
      totalScores,
      roomState.responseTimes ?? {}
    )
    const isWinner = sorted.length > 0 && sorted[0] === myId

    awardXP(myScore, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('rapid-fire-battle', { won: isWinner, gamesPlayed: 1 })
    }
    trackEvent('match_completed', {
      game: 'rapid-fire-battle',
      roomType: room?.roomType,
      myScore,
      isWinner,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ─── Reset answered state when a new question starts ──────────────────────
  useEffect(() => {
    if (phase === 'question') {
      setAnswered(false)
      setLocalCountdown(QUESTION_TIMEOUT_MS / 1000)
    }
  }, [phase, roomState.questionIdx])

  // ─── Client-side countdown during question phase ───────────────────────────
  useEffect(() => {
    if (phase !== 'question') return
    if (countdownRef.current) clearInterval(countdownRef.current)
    setLocalCountdown(QUESTION_TIMEOUT_MS / 1000)
    countdownRef.current = setInterval(() => {
      setLocalCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(countdownRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roomState.questionIdx])

  // ─── Host: process answers & advance phase ─────────────────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'question') return
    const allAnswered = players.length > 0 && actions.length >= players.length
    if (allAnswered) {
      processRound()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase])

  // Host 15s timeout to close the question
  useEffect(() => {
    if (!isHost || phase !== 'question') return
    if (questionTimerRef.current) clearTimeout(questionTimerRef.current)
    questionTimerRef.current = setTimeout(() => {
      processRound()
    }, QUESTION_TIMEOUT_MS)
    return () => clearTimeout(questionTimerRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, roomState.questionIdx])

  function processRound() {
    if (questionTimerRef.current) clearTimeout(questionTimerRef.current)
    const { currentQuestion, questionStartedAt, questionIdx, totalScores = {} } = roomState
    if (!currentQuestion || !questionStartedAt) return

    // Deduplicate by playerId; use first createdAt wins
    const seen = new Set()
    const roundScores = {}
    const responseTimes = {}

    const sorted = [...actions].sort(
      (a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0)
    )

    for (const a of sorted) {
      if (a.type !== 'ANSWER' || seen.has(a.playerId)) continue
      seen.add(a.playerId)
      const delta = (a.createdAt?.seconds ?? 0) - (questionStartedAt?.seconds ?? 0)
      if (delta > 15) continue
      const isCorrect = a.payload.optionIdx === currentQuestion.correctIdx
      roundScores[a.playerId] = computeRoundScore(isCorrect, delta)
      responseTimes[a.playerId] = delta
    }

    // Update running totals
    const newTotals = { ...totalScores }
    for (const [pid, pts] of Object.entries(roundScores)) {
      newTotals[pid] = (newTotals[pid] ?? 0) + pts
    }

    const nextIdx = (questionIdx ?? 0) + 1
    const isLast = nextIdx >= TOTAL_ROUNDS

    clearActions()

    if (isLast) {
      // Compute winner(s)
      const allIds = players.map(p => p.id)
      const sorted2 = resolveTieBreak(allIds, newTotals, responseTimes)
      setState({
        phase: 'results',
        totalScores: newTotals,
        responseTimes,
        winner: sorted2[0] ?? null,
      })
    } else {
      setState({
        phase: 'reveal',
        questionIdx: questionIdx ?? 0,
        currentQuestion,
        correctIdx: currentQuestion.correctIdx,
        roundScores,
        responseTimes,
        totalScores: newTotals,
      })
    }
  }

  // ─── Host: auto-advance from reveal → next question ────────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'reveal') return
    const t = setTimeout(() => {
      const nextIdx = (roomState.questionIdx ?? 0) + 1
      const questions = roomState._questions
      if (!questions || nextIdx >= questions.length) return
      const nextQ = questions[nextIdx]
      setState({
        phase: 'question',
        questionIdx: nextIdx,
        currentQuestion: nextQ,
        questionStartedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
        totalScores: roomState.totalScores,
        _questions: questions,
      })
    }, REVEAL_DURATION_MS)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, roomState.questionIdx])

  // ─── Player answer handler ─────────────────────────────────────────────────
  async function handleAnswer(optionIdx) {
    if (answered) return
    setAnswered(true)
    await sendAction({ type: 'ANSWER', payload: { optionIdx } })
    trackEvent('question_answered', { game: 'rapid-fire-battle', optionIdx })
  }

  // ─── Host: start game ──────────────────────────────────────────────────────
  async function handleStart(category) {
    const questions = getQuestions(category, TOTAL_ROUNDS)
    const firstQ = questions[0]
    await clearActions()
    await setState({
      phase: 'question',
      questionIdx: 0,
      currentQuestion: firstQ,
      questionStartedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      totalScores: {},
      _questions: questions,
    })
    trackEvent('room_created', { game: 'rapid-fire-battle', category })
  }

  if (!room || !myId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-zinc-500 animate-pulse">Connecting...</p>
      </div>
    )
  }

  if (phase === 'waiting' || phase === 'setup') {
    return <SetupScreen isHost={isHost} onStart={handleStart} lang={lang} t={t} />
  }

  if (phase === 'question') {
    return (
      <QuestionScreen
        question={roomState.currentQuestion}
        questionIdx={roomState.questionIdx ?? 0}
        answered={answered}
        localCountdown={localCountdown}
        onAnswer={handleAnswer}
        t={t}
      />
    )
  }

  if (phase === 'reveal') {
    return (
      <RevealScreen
        question={roomState.currentQuestion}
        correctIdx={roomState.correctIdx}
        roundScores={roomState.roundScores ?? {}}
        players={players}
        myId={myId}
        totalScores={roomState.totalScores ?? {}}
        questionIdx={roomState.questionIdx ?? 0}
        t={t}
      />
    )
  }

  if (phase === 'results') {
    return (
      <ResultScreen
        totalScores={roomState.totalScores ?? {}}
        winner={roomState.winner}
        players={players}
        myId={myId}
        room={room}
        t={t}
        lang={lang}
      />
    )
  }

  return null
}

// ─── SetupScreen ─────────────────────────────────────────────────────────────

function SetupScreen({ isHost, onStart, lang, t }) {
  const labels = {
    gk: { en: 'India GK 🇮🇳', hi: 'भारत GK 🇮🇳' },
    bollywood: { en: 'Bollywood 🎬', hi: 'बॉलीवुड 🎬' },
    cricket: { en: 'Cricket 🏏', hi: 'क्रिकेट 🏏' },
    science: { en: 'Science 🔬', hi: 'विज्ञान 🔬' },
    random: { en: 'Random ⚡', hi: 'रैंडम ⚡' },
  }

  if (!isHost) {
    return (
      <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-8 text-center space-y-3">
        <p className="text-4xl">⏳</p>
        <p className="text-zinc-300 font-semibold">{t('rapidFireBattle')}</p>
        <p className="text-zinc-500 text-sm">{t('waitingForStart')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-5">
        <p className="text-zinc-300 font-semibold mb-4 text-center">{t('pickCategory')}</p>
        <div className="grid grid-cols-2 gap-3">
          {[...CATEGORIES, 'random'].map(cat => (
            <button
              key={cat}
              onClick={() => onStart(cat)}
              className="py-4 rounded-xl bg-zinc-700 hover:bg-amber-500 hover:text-zinc-900 text-zinc-200 font-semibold text-sm transition-colors"
            >
              {labels[cat]?.[lang] ?? labels[cat]?.en ?? cat}
            </button>
          ))}
        </div>
      </div>
      <p className="text-zinc-600 text-xs text-center">{TOTAL_ROUNDS} questions · 15s each</p>
    </div>
  )
}

// ─── QuestionScreen ───────────────────────────────────────────────────────────

function QuestionScreen({ question, questionIdx, answered, localCountdown, onAnswer, t }) {
  if (!question) return null

  const timerPct = (localCountdown / 15) * 100
  const timerColor = localCountdown <= 5
    ? 'bg-rose-500'
    : localCountdown <= 10
      ? 'bg-amber-400'
      : 'bg-emerald-400'

  return (
    <div className="space-y-4">
      {/* Header: round + countdown */}
      <div className="flex items-center justify-between">
        <span className="text-zinc-500 text-sm font-medium">
          Q {questionIdx + 1} / {TOTAL_ROUNDS}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-sm">{t('timeLeft')}</span>
          <span className={`font-bold text-lg ${localCountdown <= 5 ? 'text-rose-400' : 'text-zinc-200'}`}>
            {localCountdown}s
          </span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="bg-zinc-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-5">
        <p className="text-white font-semibold text-lg leading-snug">{question.question}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => onAnswer(idx)}
            disabled={answered}
            className={`w-full text-left px-5 py-4 rounded-2xl font-semibold text-sm transition-colors border ${
              answered
                ? 'bg-zinc-800/40 border-zinc-700/30 text-zinc-500 cursor-not-allowed'
                : 'bg-zinc-800 border-zinc-700/50 text-zinc-200 hover:bg-amber-500/20 hover:border-amber-500/40 active:scale-95'
            }`}
          >
            <span className="text-zinc-500 mr-3 font-mono text-xs">
              {String.fromCharCode(65 + idx)}.
            </span>
            {opt}
          </button>
        ))}
      </div>

      {answered && (
        <p className="text-center text-zinc-500 text-sm animate-pulse">
          Waiting for others…
        </p>
      )}
    </div>
  )
}

// ─── RevealScreen ─────────────────────────────────────────────────────────────

function RevealScreen({ question, correctIdx, roundScores, players, myId, totalScores, questionIdx, t }) {
  if (!question) return null

  return (
    <div className="space-y-4">
      <p className="text-zinc-500 text-sm text-center font-medium">
        Q {questionIdx + 1} / {TOTAL_ROUNDS} — {t('correctAnswer')}
      </p>

      {/* Options with correct highlighted */}
      <div className="grid grid-cols-1 gap-2">
        {question.options.map((opt, idx) => (
          <div
            key={idx}
            className={`px-5 py-3 rounded-2xl font-semibold text-sm border ${
              idx === correctIdx
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-800/50 border-zinc-700/30 text-zinc-500'
            }`}
          >
            {idx === correctIdx && <span className="mr-2">✅</span>}
            {opt}
          </div>
        ))}
      </div>

      {/* Per-player result */}
      <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-4 space-y-2">
        {players.map(p => {
          const pts = roundScores[p.id] ?? 0
          const isMe = p.id === myId
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                isMe ? 'bg-zinc-700/60' : ''
              }`}
            >
              <span className="text-zinc-200 font-medium text-sm">
                {isMe ? '▶ ' : ''}{p.name}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${pts > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pts > 0 ? '✅' : '❌'}
                </span>
                <span className="text-amber-400 font-bold text-sm">+{pts}</span>
                <span className="text-zinc-500 text-xs">({totalScores[p.id] ?? 0} total)</span>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-center text-zinc-600 text-xs animate-pulse">Next question soon…</p>
    </div>
  )
}

// ─── ResultScreen ─────────────────────────────────────────────────────────────

function ResultScreen({ totalScores, winner, players, myId, room, t, lang }) {
  const allIds = players.map(p => p.id)
  const ranked = resolveTieBreak(allIds, totalScores, {})

  const isWinner = winner === myId
  const xpEarned = totalScores[myId] ?? 0
  const xpDisplay = room?.roomType === 'ranked'
    ? Math.round(xpEarned * 1.2)
    : xpEarned

  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <p className="text-4xl mb-2">{isWinner ? '🏆' : '⚡'}</p>
        <p className="text-white font-bold text-2xl">
          {isWinner ? t('winner') : t('rapidFireBattle')}
        </p>
        <p className="text-amber-400 font-semibold mt-1">
          +{xpDisplay} {t('xp')}
          {room?.roomType === 'ranked' && (
            <span className="text-xs ml-2 text-amber-300/70">({t('rankedBonus')})</span>
          )}
        </p>
      </div>

      {/* Leaderboard */}
      <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-4 space-y-2">
        {ranked.map((pid, rank) => {
          const player = players.find(p => p.id === pid)
          const isMe = pid === myId
          const medals = ['🥇', '🥈', '🥉']
          return (
            <div
              key={pid}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${
                isMe ? 'bg-zinc-700/60 border border-zinc-600/50' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg w-6 text-center">
                  {medals[rank] ?? `${rank + 1}.`}
                </span>
                <span className="text-zinc-200 font-semibold text-sm">
                  {player?.name ?? pid}
                </span>
              </div>
              <span className="text-amber-400 font-bold">
                {totalScores[pid] ?? 0} {t('score')}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-center text-zinc-600 text-xs">Room closes automatically…</p>
    </div>
  )
}
