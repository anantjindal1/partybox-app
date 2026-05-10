import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../store/LangContext'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { trackEvent } from '../../services/analytics'
import { fetchGameQuestions } from '../../services/questions'
import { resolveTieBreak } from './scoring'
import { recordQuestionsShown } from '../../services/questionStats'
import { trackEvent as trackAnalyticsEvent } from '../../services/analytics_events'
import CircularTimer from '../../components/CircularTimer'
import FloatingReactions from '../../components/FloatingReactions'
import AdBanner from '../../components/AdBanner'

const TOTAL_ROUNDS = 7
const QUESTION_TIMEOUT_MS = 15_000
const REVEAL_DURATION_MS = 5_000
const LOCK_IN_DURATION_MS = 1_500
const COUNTDOWN_DURATION_MS = 4_200   // 3×1s + 1.2s GO! display
const REMATCH_LOBBY_MS = 3_000

const CATEGORY_ROTATION = ['gk', 'bollywood', 'cricket', 'science', 'food', 'brain', 'random']

const CATEGORY_DISPLAY = {
  gk:        { label: 'General Knowledge', emoji: '🇮🇳' },
  bollywood: { label: 'Bollywood',         emoji: '🎬' },
  cricket:   { label: 'Cricket & Sports',  emoji: '🏏' },
  science:   { label: 'Science & Tech',    emoji: '🔬' },
  food:      { label: 'Food & Lifestyle',  emoji: '🍛' },
  brain:     { label: 'Brain & Culture',   emoji: '🧠' },
  random:    { label: 'Random',            emoji: '⚡' },
}

function catLabel(cat) {
  const d = CATEGORY_DISPLAY[cat]
  return d ? `${d.emoji} ${d.label}` : cat
}

// Tiered scoring: 0-5s→1000, 5-10s→900, 10-15s→800, wrong→0
function computeTieredScore(isCorrect, deltaSeconds) {
  if (!isCorrect) return 0
  if (deltaSeconds <= 5) return 1000
  if (deltaSeconds <= 10) return 900
  return 800
}

// Streak bonus on top of speed points
function getStreakBonus(streak) {
  const bonuses = { 1: 0, 2: 100, 3: 200, 4: 400, 5: 600, 6: 800, 7: 1000 }
  return bonuses[Math.min(streak, 7)] ?? 1000
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RapidFireBattle({ code }) {
  const navigate = useNavigate()
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

  const [starting, setStarting] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [localCountdown, setLocalCountdown] = useState(QUESTION_TIMEOUT_MS / 1000)
  const questionTimerRef = useRef(null)
  const countdownRef = useRef(null)
  const xpAwarded = useRef(false)
  const myAnswerIdxRef = useRef(null)
  const questionsRecordedRef = useRef(false)
  const myAnswersRef = useRef([])
  const earlyCloseTimerRef = useRef(null)

  const phase = roomState.phase || 'waiting'

  // ─── Reset xpAwarded on new game start ─────────────────────────────────────
  useEffect(() => {
    if (phase === 'waiting' || phase === 'countdown') {
      xpAwarded.current = false
    }
  }, [phase])

  // ─── Question frequency tracking ────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results') return
    if (questionsRecordedRef.current) return
    if (!isHost) return
    questionsRecordedRef.current = true
    const questions = roomState._questions ?? []
    if (questions.length > 0) {
      recordQuestionsShown(questions, 'firstbell')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    if (phase === 'countdown') {
      questionsRecordedRef.current = false
    }
  }, [phase])

  // ─── Analytics: game_start on countdown, game_complete on results ───────────
  useEffect(() => {
    if (phase === 'countdown') {
      trackAnalyticsEvent('game_start', 'firstbell', { category: roomState.category })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    if (phase !== 'results') return
    trackAnalyticsEvent('game_complete', 'firstbell', { playerCount: players.length })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ─── Reset per-game answer log on countdown (new game / rematch) ───────────
  useEffect(() => {
    if (phase === 'countdown') {
      myAnswersRef.current = []
      myAnswerIdxRef.current = null
    }
  }, [phase])

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
      writeGameStats('firstbell', { won: isWinner, gamesPlayed: 1 })
    }
    trackEvent('match_completed', {
      game: 'firstbell',
      roomType: room?.roomType,
      myScore,
      isWinner,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ─── Accumulate per-question local answers on reveal ──────────────────────
  useEffect(() => {
    if (phase === 'reveal') {
      const qIdx = roomState.questionIdx ?? 0
      myAnswersRef.current[qIdx] = {
        selectedIdx: myAnswerIdxRef.current,
        pts: roomState.roundScores?.[myId] ?? 0,
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roomState.questionIdx])

  // ─── Reset answered + countdown + answer idx when question changes ──────────
  useEffect(() => {
    if (phase === 'question') {
      setAnswered(false)
      setLocalCountdown(QUESTION_TIMEOUT_MS / 1000)
      myAnswerIdxRef.current = null
      if (earlyCloseTimerRef.current) {
        clearTimeout(earlyCloseTimerRef.current)
        earlyCloseTimerRef.current = null
      }
    }
  }, [phase, roomState.questionIdx])

  // ─── Client-side countdown during question ─────────────────────────────────
  useEffect(() => {
    if (phase !== 'question') return
    if (countdownRef.current) clearInterval(countdownRef.current)
    setLocalCountdown(QUESTION_TIMEOUT_MS / 1000)
    countdownRef.current = setInterval(() => {
      setLocalCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(countdownRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roomState.questionIdx])

  // ─── Host: all answered early close (600ms buffer for Firestore propagation) ─
  useEffect(() => {
    if (!isHost || phase !== 'question') return
    if (players.length > 0 && actions.length >= players.length) {
      if (earlyCloseTimerRef.current) return // already scheduled
      earlyCloseTimerRef.current = setTimeout(() => {
        earlyCloseTimerRef.current = null
        processRound()
      }, 600)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.questionIdx])

  // ─── Host: 15s hard timeout ────────────────────────────────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'question') return
    if (questionTimerRef.current) clearTimeout(questionTimerRef.current)
    questionTimerRef.current = setTimeout(() => {
      trackAnalyticsEvent('question_timeout', 'firstbell')
      processRound()
    }, QUESTION_TIMEOUT_MS + 600)
    return () => clearTimeout(questionTimerRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, roomState.questionIdx])

  // ─── Host: countdown → question 1 ─────────────────────────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'countdown') return
    const timer = setTimeout(() => {
      const questions = roomState._questions
      if (!questions?.length) {
        console.error('[FirstBell] countdown fired but _questions is empty/missing', roomState)
        return
      }
      setState({
        phase: 'question',
        questionIdx: 0,
        currentQuestion: questions[0],
        questionStartedAt: Date.now(),
        totalScores: {},
        streaks: {},
        correctCounts: {},
        fastestTimes: {},
        bestStreaks: {},
        category: roomState.category,
        _questions: questions,
      })
    }, COUNTDOWN_DURATION_MS)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase])

  // ─── Host: lockIn → reveal or results ──────────────────────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'lockIn') return
    const timer = setTimeout(() => {
      const base = {
        totalScores: roomState.totalScores,
        correctCounts: roomState.correctCounts,
        fastestTimes: roomState.fastestTimes,
        bestStreaks: roomState.bestStreaks,
        category: roomState.category,
      }
      if (roomState.isLastRound) {
        setState({ phase: 'results', ...base,
          responseTimes: roomState.responseTimes,
          winner: roomState.winner,
          _questions: roomState._questions,
          roundScores: roomState.roundScores,
        })
      } else {
        setState({ phase: 'reveal', ...base,
          questionIdx: roomState.questionIdx,
          currentQuestion: roomState.currentQuestion,
          correctIdx: roomState.correctIdx,
          roundScores: roomState.roundScores,
          responseTimes: roomState.responseTimes,
          streaks: roomState.streaks,
          streakBonuses: roomState.streakBonuses,
          _questions: roomState._questions,
          isLastRound: roomState.isLastRound,
        })
      }
    }, LOCK_IN_DURATION_MS)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, roomState.questionIdx])

  // ─── Host: reveal → next question ──────────────────────────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'reveal') return
    const timer = setTimeout(() => {
      const isLast = roomState.isLastRound

      if (isLast) {
        setState({
          phase: 'results',
          totalScores: roomState.totalScores,
          correctCounts: roomState.correctCounts,
          fastestTimes: roomState.fastestTimes,
          bestStreaks: roomState.bestStreaks,
          category: roomState.category,
          responseTimes: roomState.responseTimes,
          winner: roomState.winner,
          _questions: roomState._questions,
        })
      } else {
        const nextIdx = (roomState.questionIdx ?? 0) + 1
        const questions = roomState._questions
        if (!questions || nextIdx >= questions.length) return
        setState({
          phase: 'question',
          questionIdx: nextIdx,
          currentQuestion: questions[nextIdx],
          questionStartedAt: Date.now(),
          totalScores: roomState.totalScores,
          streaks: roomState.streaks,
          correctCounts: roomState.correctCounts,
          fastestTimes: roomState.fastestTimes,
          bestStreaks: roomState.bestStreaks,
          category: roomState.category,
          _questions: questions,
        })
      }
    }, REVEAL_DURATION_MS)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, roomState.questionIdx])

  // ─── Host: rematch → waiting ───────────────────────────────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'rematch') return
    const timer = setTimeout(() => {
      setState({ phase: 'waiting', nextCategory: roomState.nextCategory })
    }, REMATCH_LOBBY_MS)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase])

  // ─── processRound ──────────────────────────────────────────────────────────
  async function processRound() {
    if (questionTimerRef.current) clearTimeout(questionTimerRef.current)
    const { currentQuestion, questionStartedAt, questionIdx, totalScores = {} } = roomState
    if (!currentQuestion || !questionStartedAt) return

    const seen = new Set()
    const roundScores = {}
    const responseTimes = {}

    for (const a of [...actions].sort((a, b) => (a.payload.answeredAt ?? 0) - (b.payload.answeredAt ?? 0))) {
      if (a.type !== 'ANSWER' || seen.has(a.playerId)) continue
      seen.add(a.playerId)
      let deltaMs
      if (a.payload.elapsedMs != null) {
        // Use player's self-reported elapsed time (no cross-device clock skew)
        deltaMs = a.payload.elapsedMs
      } else {
        // Fallback for old clients without elapsedMs
        deltaMs = (a.payload.answeredAt ?? 0) - (questionStartedAt ?? 0)
      }
      const delta = deltaMs / 1000
      if (delta < 0 || delta > 16) continue
      const isCorrect = a.payload.optionIdx === currentQuestion.correctIdx
      roundScores[a.playerId] = computeTieredScore(isCorrect, delta)
      responseTimes[a.playerId] = delta
    }

    // Compute streaks first so we can apply bonuses before totalling
    const prevStreaks = roomState.streaks ?? {}
    const streaks = {}
    const streakBonuses = {}
    for (const p of players) {
      const correct = (roundScores[p.id] ?? 0) > 0
      const newStreak = correct ? (prevStreaks[p.id] ?? 0) + 1 : 0
      streaks[p.id] = newStreak
      if (correct) {
        const bonus = getStreakBonus(newStreak)
        streakBonuses[p.id] = bonus
        roundScores[p.id] += bonus
      } else {
        streakBonuses[p.id] = 0
      }
    }

    const newTotals = { ...totalScores }
    for (const [pid, pts] of Object.entries(roundScores)) {
      newTotals[pid] = (newTotals[pid] ?? 0) + pts
    }

    const correctCounts = { ...(roomState.correctCounts ?? {}) }
    for (const p of players) {
      if ((roundScores[p.id] ?? 0) > 0) correctCounts[p.id] = (correctCounts[p.id] ?? 0) + 1
    }

    const fastestTimes = { ...(roomState.fastestTimes ?? {}) }
    for (const p of players) {
      if ((roundScores[p.id] ?? 0) > 0 && responseTimes[p.id] != null) {
        fastestTimes[p.id] = Math.min(fastestTimes[p.id] ?? Infinity, responseTimes[p.id])
      }
    }

    const bestStreaks = { ...(roomState.bestStreaks ?? {}) }
    for (const p of players) {
      bestStreaks[p.id] = Math.max(bestStreaks[p.id] ?? 0, streaks[p.id] ?? 0)
    }

    // Fill in players whose answers didn't propagate in time — score stays 0
    for (const player of players) {
      if (!(player.id in roundScores)) {
        roundScores[player.id] = 0
        responseTimes[player.id] = null
        console.warn('[FirstBell] No answer recorded for', player.id, '— may be propagation delay')
      }
    }

    const nextIdx = (questionIdx ?? 0) + 1
    const isLast = nextIdx >= TOTAL_ROUNDS
    await clearActions()

    const lockInState = {
      phase: 'lockIn',
      questionIdx: questionIdx ?? 0,
      currentQuestion,
      correctIdx: currentQuestion.correctIdx,
      roundScores,
      responseTimes,
      totalScores: newTotals,
      streaks,
      streakBonuses,
      correctCounts,
      fastestTimes,
      bestStreaks,
      category: roomState.category,
      _questions: roomState._questions,
      isLastRound: isLast,
    }
    if (isLast) {
      const sorted2 = resolveTieBreak(players.map(p => p.id), newTotals, responseTimes)
      lockInState.winner = sorted2[0] ?? null
    }
    setState(lockInState)
  }

  // ─── handleAnswer ──────────────────────────────────────────────────────────
  async function handleAnswer(optionIdx) {
    if (answered) return
    setAnswered(true)
    myAnswerIdxRef.current = optionIdx
    const questionStart = roomState.questionStartedAt ?? Date.now()
    const elapsedMs = Date.now() - questionStart
    await sendAction({ type: 'ANSWER', payload: { optionIdx, answeredAt: Date.now(), elapsedMs: Math.min(Math.max(elapsedMs, 0), 15000) } })
    trackEvent('question_answered', { game: 'firstbell', optionIdx })
    trackAnalyticsEvent('question_answered', 'firstbell')
  }

  // ─── handleStart ───────────────────────────────────────────────────────────
  async function handleStart(category) {
    setStarting(true)
    const questions = fetchGameQuestions({ category, count: TOTAL_ROUNDS })
    setStarting(false)
    await clearActions()
    await setState({
      phase: 'countdown',
      category,
      questionIdx: 0,
      _questions: questions,
      totalScores: {},
      streaks: {},
      correctCounts: {},
      fastestTimes: {},
      bestStreaks: {},
    })
    trackEvent('room_created', { game: 'firstbell', category })
  }

  // ─── handleRematch ─────────────────────────────────────────────────────────
  async function handleRematch() {
    trackAnalyticsEvent('rematch', 'firstbell')
    const lastCat = roomState.category ?? 'gk'
    const idx = CATEGORY_ROTATION.indexOf(lastCat)
    const nextCategory = CATEGORY_ROTATION[(idx + 1) % CATEGORY_ROTATION.length]
    await clearActions()
    await setState({
      phase: 'rematch',
      nextCategory,
      totalScores: {},
      roundScores: {},
      correctCounts: {},
      fastestTimes: {},
      bestStreaks: {},
      streaks: {},
    })
  }

  // ─── handleRematchVote ─────────────────────────────────────────────────────
  async function handleRematchVote() {
    await sendAction({ type: 'REMATCH_VOTE', payload: {} })
  }

  const rematchVoteCount = actions.filter(a => a.type === 'REMATCH_VOTE').length

  // ─── Render ────────────────────────────────────────────────────────────────
  if (!room || !myId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-zinc-500 animate-pulse">Connecting...</p>
      </div>
    )
  }

  if (phase === 'waiting' || phase === 'setup') {
    return (
      <SetupScreen
        isHost={isHost}
        onStart={handleStart}
        lang={lang}
        t={t}
        nextCategory={roomState.nextCategory}
        code={code}
        loading={starting}
        myId={myId}
        players={players}
      />
    )
  }

  if (phase === 'countdown') {
    return <CountdownScreen category={roomState.category} players={players} myId={myId} />
  }

  if (phase === 'rematch') {
    return <RematchScreen nextCategory={roomState.nextCategory} />
  }

  if (phase === 'question' || phase === 'lockIn') {
    return (
      <div>
        <LiveScoreBar
          players={players}
          totalScores={roomState.totalScores ?? {}}
          myId={myId}
        />
        {phase === 'question' ? (
          <QuestionScreen
            question={roomState.currentQuestion}
            questionIdx={roomState.questionIdx ?? 0}
            answered={answered}
            localCountdown={localCountdown}
            onAnswer={handleAnswer}
            answeredCount={actions.length}
            totalPlayers={players.length}
            t={t}
          />
        ) : (
          <LockInScreen />
        )}
      </div>
    )
  }

  if (phase === 'reveal') {
    return (
      <div>
        <LiveScoreBar
          players={players}
          totalScores={roomState.totalScores ?? {}}
          myId={myId}
        />
        <RevealScreen
          question={roomState.currentQuestion}
          correctIdx={roomState.correctIdx}
          roundScores={roomState.roundScores ?? {}}
          responseTimes={roomState.responseTimes ?? {}}
          streaks={roomState.streaks ?? {}}
          streakBonuses={roomState.streakBonuses ?? {}}
          players={players}
          myId={myId}
          totalScores={roomState.totalScores ?? {}}
          questionIdx={roomState.questionIdx ?? 0}
          _questions={roomState._questions}
          t={t}
          myAnswerIdx={myAnswerIdxRef.current}
        />
      </div>
    )
  }

  if (phase === 'results') {
    // Capture Q7 synchronously before ResultScreen renders.
    // Q7 skips the reveal phase (lockIn → results directly), so the reveal
    // useEffect never fires for it. Writing the ref here — before the JSX
    // return — ensures myAnswersRef.current[lastIdx] is populated in the
    // same render pass that ResultScreen first mounts.
    const q7questions = roomState._questions
    if (q7questions?.length > 0) {
      const lastIdx = q7questions.length - 1
      if (!myAnswersRef.current[lastIdx]) {
        myAnswersRef.current[lastIdx] = {
          selectedIdx: myAnswerIdxRef.current,
          pts: roomState.roundScores?.[myId] ?? 0,
        }
      }
    }
    return (
      <ResultScreen
        totalScores={roomState.totalScores ?? {}}
        winner={roomState.winner}
        players={players}
        myId={myId}
        room={room}
        correctCounts={roomState.correctCounts ?? {}}
        fastestTimes={roomState.fastestTimes ?? {}}
        bestStreaks={roomState.bestStreaks ?? {}}
        category={roomState.category}
        isHost={isHost}
        onRematch={isHost ? handleRematch : null}
        onHome={() => {
          trackAnalyticsEvent('game_abandon', 'firstbell', { phase, questionIdx: roomState.questionIdx ?? 0 })
          navigate('/')
        }}
        onRematchVote={!isHost ? handleRematchVote : null}
        rematchVoteCount={rematchVoteCount}
        totalPlayers={players.length}
        t={t}
        questions={roomState._questions ?? []}
        myAnswers={myAnswersRef.current}
      />
    )
  }

  return null
}

// ─── LiveScoreBar ─────────────────────────────────────────────────────────────

function LiveScoreBar({ players, totalScores, myId }) {
  const sorted = [...players].sort(
    (a, b) => (totalScores[b.id] ?? 0) - (totalScores[a.id] ?? 0)
  )

  return (
    <div
      className="flex overflow-x-auto gap-3 px-4 py-2 mb-4 bg-zinc-800 border-b border-zinc-700/60"
      style={{ minHeight: 44, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {sorted.map(p => {
        const isMe = p.id === myId
        const score = totalScores[p.id] ?? 0
        const name = (p.name ?? '?').slice(0, 6)
        const avatar = p.avatar ?? p.name?.[0]?.toUpperCase() ?? '?'
        return (
          <div
            key={p.id}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0 text-xs font-semibold transition-all duration-300 border ${
              isMe
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-zinc-700/70 border-zinc-600/40 text-zinc-300'
            }`}
            style={{ width: 82 }}
          >
            <span className="text-sm leading-none shrink-0">{avatar}</span>
            <span className="truncate flex-1 min-w-0">{name}</span>
            <span className={`font-bold shrink-0 tabular-nums ${isMe ? 'text-amber-400' : 'text-zinc-200'}`}>
              {score}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── LockInScreen ─────────────────────────────────────────────────────────────

function LockInScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-3">
      <p className="text-zinc-100 font-bold text-2xl animate-pulse">All answers in...</p>
      <p className="text-zinc-500 text-base animate-pulse">Revealing answer...</p>
    </div>
  )
}

// ─── CountdownScreen ──────────────────────────────────────────────────────────

const COUNTDOWN_SEQ = [3, 2, 1, 'GO!']

function CountdownScreen({ category, players, myId }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= COUNTDOWN_SEQ.length - 1) return
    const t = setTimeout(() => setStep(s => s + 1), 1000)
    return () => clearTimeout(t)
  }, [step])

  const display = COUNTDOWN_SEQ[step]
  const isGo = display === 'GO!'

  return (
    <>
      <style>{`
        @keyframes countdownPop {
          0%   { opacity: 0;   transform: scale(0.5); }
          30%  { opacity: 1;   transform: scale(1.2); }
          75%  { opacity: 1;   transform: scale(1.0); }
          100% { opacity: 0.8; transform: scale(0.95); }
        }
      `}</style>
      <div className="flex flex-col items-center justify-center py-10 space-y-8">
        {category && (
          <p className="text-zinc-400 text-sm font-medium tracking-wide uppercase">
            {catLabel(category)}
          </p>
        )}

        <div
          key={String(display)}
          className={`font-black select-none leading-none ${isGo ? 'text-7xl text-emerald-400' : 'text-9xl text-white'}`}
          style={{ animation: 'countdownPop 0.95s ease-out forwards' }}
        >
          {display}
        </div>

        {players.length > 0 && (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {players.map(p => {
              const isMe = p.id === myId
              return (
                <div key={p.id} className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-base font-bold text-zinc-200 ${
                    isMe ? 'ring-2 ring-white border-2 border-white/60' : 'border border-zinc-600'
                  }`}>
                    {p.avatar ?? p.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <p className={`text-xs ${isMe ? 'text-white font-semibold' : 'text-zinc-500'}`}>
                    {p.name?.split(' ')[0]}{isMe ? ' (You)' : ''}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

// ─── RematchScreen ────────────────────────────────────────────────────────────

function RematchScreen({ nextCategory }) {
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (count <= 0) return
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count])

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <p className="text-white font-black text-3xl animate-pulse">Rematch!</p>
      <p className="text-zinc-400 text-lg">Starting in {count}...</p>
      {nextCategory && (
        <p className="text-zinc-500 text-sm">
          Next: {catLabel(nextCategory)}
        </p>
      )}
    </div>
  )
}

// ─── ShareSection ─────────────────────────────────────────────────────────────

function RoomCodeBar({ code }) {
  const [copied, setCopied] = useState(false)
  const url = window.location.href

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  const waText = encodeURIComponent(`🎮 Join my FirstBell quiz!\nTap to join: ${url}`)
  const waUrl = `https://wa.me/?text=${waText}`

  return (
    <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider leading-none mb-1">Room Code</p>
        <p className="text-white font-mono font-bold text-2xl tracking-widest leading-none">{code}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
        >
          📱 WhatsApp
        </a>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
            copied ? 'bg-zinc-700 border-zinc-600/50 text-emerald-400' : 'bg-zinc-700 border-zinc-600/50 text-zinc-200 hover:bg-zinc-600'
          }`}
        >
          {copied ? '✓' : '🔗'}
        </button>
      </div>
    </div>
  )
}

function ShareSection({ code }) {
  const [copied, setCopied] = useState(false)

  const url = window.location.href
  const waText = encodeURIComponent(`🎮 Join my FirstBell quiz!\nTap to join: ${url}`)
  const waUrl = `https://wa.me/?text=${waText}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
        >
          📱 Share on WhatsApp
        </a>
        <button
          onClick={handleCopy}
          className={`flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm border transition-colors ${
            copied
              ? 'bg-zinc-700 border-zinc-600/50 text-emerald-400'
              : 'bg-zinc-700 border-zinc-600/50 text-zinc-200 hover:bg-zinc-600'
          }`}
        >
          {copied ? '✓ Copied!' : '🔗 Copy Link'}
        </button>
      </div>
      {code && (
        <div className="text-center">
          <p className="text-zinc-600 text-xs mb-1.5">or share code manually</p>
          <p className="text-zinc-300 font-mono font-bold text-2xl tracking-widest">{code}</p>
        </div>
      )}
    </div>
  )
}

// ─── SetupScreen ─────────────────────────────────────────────────────────────

function SetupScreen({ isHost, onStart, lang, t, nextCategory, code, loading, myId, players }) {
  // Pre-select 'random' by default (UX 3)
  const [selected, setSelected] = useState(nextCategory ?? 'random')
  const [hasPickedCategory, setHasPickedCategory] = useState(false)
  const categoryRef = useRef(null)

  // Scroll to category grid when 2nd player joins
  useEffect(() => {
    if (players.length >= 2 && categoryRef.current) {
      categoryRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [players.length])

  return (
    <div className="space-y-4">
      {/* Room code — always at top so it's never missed */}
      {code && <RoomCodeBar code={code} />}

      {/* Host: player list */}
      {isHost && players.length > 0 && (
        <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
              Players ({players.length})
            </p>
            {players.length >= 2 && !hasPickedCategory && (
              <p className="text-amber-400 text-xs font-semibold">👇 Pick a category to begin</p>
            )}
          </div>
          {players.map(p => {
            const isMe = p.id === myId
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                  isMe
                    ? 'bg-zinc-700/80 border-2 border-white/60'
                    : 'bg-zinc-700/40 border border-zinc-700/50'
                }`}
              >
                <span className="text-xl leading-none">{p.avatar ?? '?'}</span>
                <span className={`font-semibold text-sm flex-1 ${isMe ? 'text-white' : 'text-zinc-200'}`}>
                  {p.name}
                </span>
                {isMe && <span className="text-zinc-400 text-xs">(You)</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* Guest: full waiting view */}
      {!isHost && (
        <div className="space-y-4">
          {/* 1. Waiting status */}
          <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-6 text-center space-y-2">
            <p className="text-4xl">🔔</p>
            <p className="text-zinc-300 font-semibold">{t('rapidFireBattle')}</p>
            <p className="text-zinc-500 text-sm">Waiting for host to pick a category...</p>
          </div>

          {/* 2. Player list */}
          {players.length > 0 && (
            <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-4 space-y-2">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">
                Players ({players.length})
              </p>
              {players.map(p => {
                const isMe = p.id === myId
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                      isMe
                        ? 'bg-zinc-700/80 border-2 border-white/60'
                        : 'bg-zinc-700/40 border border-zinc-700/50'
                    }`}
                  >
                    <span className="text-xl leading-none">{p.avatar ?? '?'}</span>
                    <span className={`font-semibold text-sm flex-1 ${isMe ? 'text-white' : 'text-zinc-200'}`}>
                      {p.name}
                    </span>
                    {isMe && <span className="text-zinc-400 text-xs">(You)</span>}
                  </div>
                )
              })}
            </div>
          )}

        </div>
      )}

      {/* Host: category grid */}
      {isHost && (
        <div ref={categoryRef} className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-5">
          <p className="text-zinc-300 font-semibold mb-4 text-center">{t('pickCategory')}</p>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORY_ROTATION.map(cat => {
              const d = CATEGORY_DISPLAY[cat]
              return (
                <button
                  key={cat}
                  onClick={() => { setSelected(cat); setHasPickedCategory(true) }}
                  className={`flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-xl font-semibold text-sm transition-colors border-2 ${
                    selected === cat
                      ? 'bg-amber-500 text-zinc-900 border-amber-400'
                      : 'bg-zinc-700/80 text-zinc-300 border-transparent hover:bg-zinc-600'
                  }`}
                >
                  <span className="text-3xl leading-none">{d?.emoji}</span>
                  <span className="text-xs font-semibold leading-tight text-center">{d?.label ?? cat}</span>
                  {cat === nextCategory && (
                    <span className="text-xs font-normal opacity-60 -mt-0.5">suggested</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Game info pill + scoring explainer — visible to all players */}
      <div className="flex justify-center">
        <span className="bg-zinc-700/60 rounded-full px-4 py-1.5 text-sm font-semibold text-white">
          {TOTAL_ROUNDS} questions · 15s each ⏱
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-center text-zinc-400 text-sm font-semibold">⚡ Faster answers = more points</p>
        <div className="flex gap-2 justify-center flex-wrap">
          <span className="bg-green-500/20 border border-green-500/40 text-green-300 text-xs font-bold px-3 py-1.5 rounded-full">⚡ 0–5s = 1000</span>
          <span className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-full">🕐 5–10s = 900</span>
          <span className="bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold px-3 py-1.5 rounded-full">🕑 10–15s = 800</span>
        </div>
        <p className="text-center text-zinc-500 text-xs">Wrong or no answer = 0 pts</p>
      </div>

      {/* Host: start button */}
      {isHost && (
        <>
          <button
            disabled={!selected || loading}
            onClick={() => onStart(selected)}
            className={`w-full py-3 rounded-xl font-bold text-base transition-all ${
              selected && !loading
                ? 'bg-amber-500 text-zinc-900 hover:bg-amber-400'
                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {loading
              ? 'Loading questions...'
              : selected
              ? `${CATEGORY_DISPLAY[selected]?.emoji ?? ''} Start · ${CATEGORY_DISPLAY[selected]?.label ?? selected}`
              : 'Select a category'}
          </button>
        </>
      )}

    </div>
  )
}

// ─── QuestionScreen ───────────────────────────────────────────────────────────

function QuestionScreen({ question, questionIdx, answered, localCountdown, onAnswer, answeredCount, totalPlayers, t }) {
  const [tipVisible, setTipVisible] = useState(
    () => questionIdx === 0 && !localStorage.getItem('partybox_fb_score_tip')
  )

  useEffect(() => {
    if (!tipVisible) return
    const timer = setTimeout(() => {
      localStorage.setItem('partybox_fb_score_tip', '1')
      setTipVisible(false)
    }, 4000)
    return () => clearTimeout(timer)
  }, [tipVisible])

  function dismissTip() {
    localStorage.setItem('partybox_fb_score_tip', '1')
    setTipVisible(false)
  }

  if (!question) return null

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <CircularTimer totalSeconds={15} secondsLeft={localCountdown} size={100} />
      </div>

      {/* Question card — visually distinct from options */}
      <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-5">
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
          Question {questionIdx + 1} of {TOTAL_ROUNDS}
        </p>
        <p className="text-white font-bold text-xl leading-snug">{question.question}</p>
      </div>

      {/* Q1 scoring tooltip */}
      {tipVisible && (
        <button
          type="button"
          onClick={dismissTip}
          className="w-full bg-zinc-700/80 border border-zinc-600/50 rounded-xl px-4 py-2.5 text-center"
        >
          <p className="text-zinc-200 text-xs font-semibold">⚡ 0–5s = 1000pts · 5–10s = 900pts · 10–15s = 800pts</p>
          <p className="text-zinc-500 text-xs mt-0.5">Tap to dismiss</p>
        </button>
      )}

      {/* Options — with A. B. C. D. labels, separated from question card */}
      <div className="grid grid-cols-1 gap-3 mt-2">
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
            <span className="text-zinc-500 mr-3 font-mono text-xs font-bold">{String.fromCharCode(65 + idx)}.</span>
            {opt}
          </button>
        ))}
      </div>

      <p className="text-center text-zinc-500 text-sm mt-2">
        {answered
          ? `Waiting for others... (${answeredCount}/${totalPlayers})`
          : `${answeredCount} of ${totalPlayers} answered`}
      </p>
    </div>
  )
}

// ─── FadeInRow ────────────────────────────────────────────────────────────────

function FadeInRow({ delay, children }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(6px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }}>
      {children}
    </div>
  )
}

// ─── StreakBanner ─────────────────────────────────────────────────────────────

function StreakBanner({ players, streaks }) {
  const [visible, setVisible] = useState(false)

  const topStreaker = [...players]
    .filter(p => (streaks[p.id] ?? 0) >= 3)
    .sort((a, b) => (streaks[b.id] ?? 0) - (streaks[a.id] ?? 0))[0]

  useEffect(() => {
    if (!topStreaker) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2000)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topStreaker?.id, topStreaker ? streaks[topStreaker.id] : null])

  if (!topStreaker || !visible) return null

  const n = streaks[topStreaker.id]
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-sm font-semibold text-amber-300 text-center animate-pulse">
      {n >= 5 ? '⚡' : '🔥'} {topStreaker.name} is on a {n}-answer streak!
    </div>
  )
}

// ─── RevealScreen ─────────────────────────────────────────────────────────────

function RevealScreen({ question, correctIdx, roundScores, responseTimes, streaks, streakBonuses, players, myId, totalScores, questionIdx, _questions, t, myAnswerIdx }) {
  if (!question) return null

  const correctPlayers = players
    .filter(p => (roundScores[p.id] ?? 0) > 0)
    .sort((a, b) => (responseTimes[a.id] ?? 99) - (responseTimes[b.id] ?? 99))
  const wrongPlayers = players.filter(p => (roundScores[p.id] ?? 0) === 0)
  const ranked = [...correctPlayers, ...wrongPlayers]
  const medals = ['🥇', '🥈', '🥉']

  // Use myAnswerIdx as the single local source of truth for what this player did.
  // myAnswerIdx is a ref set only when the local player taps an option — it is never
  // influenced by other players' actions or shared Firestore state.
  const myDidAnswer = myAnswerIdx !== null
  const myIsCorrect = myDidAnswer && myAnswerIdx === correctIdx

  // Floating reaction (emoji feedback)
  let myEmoji = null
  if (myDidAnswer) {
    const myTime = responseTimes[myId]
    const fastestCorrectTime = correctPlayers.length ? responseTimes[correctPlayers[0].id] : null
    const wasClose = !myIsCorrect && fastestCorrectTime != null && myTime != null && (myTime - fastestCorrectTime) <= 0.5
    myEmoji =
      myIsCorrect && correctPlayers[0]?.id === myId ? '🔥' :
      myIsCorrect ? '💪' :
      wasClose  ? '😅' : '😭'
  }
  const myReaction = myEmoji ? [{ emoji: myEmoji, playerId: myId }] : []

  // Proximity banner — derived entirely from local flags + shared score totals
  const myScore = totalScores[myId] ?? 0
  const sortedByScore = [...players].sort((a, b) => (totalScores[b.id] ?? 0) - (totalScores[a.id] ?? 0))
  const leader = sortedByScore[0]
  const leaderScore = totalScores[leader?.id] ?? 0
  const gap = leaderScore - myScore
  const iAmAtTop = myScore === leaderScore
  const playersAtTop = players.filter(p => (totalScores[p.id] ?? 0) === leaderScore)
  const iAmSoleLeader = iAmAtTop && playersAtTop.length === 1

  let proximityBanner, proximityClass
  if (!myDidAnswer) {
    proximityBanner = "Didn't answer this one — stay focused!"
    proximityClass = 'bg-zinc-700/60 border-zinc-600/40 text-zinc-400'
  } else if (myIsCorrect) {
    if (iAmSoleLeader) {
      proximityBanner = "You're leading — stay sharp! 🔥"
      proximityClass = 'bg-amber-500/20 border-amber-500/40 text-amber-300'
    } else if (iAmAtTop) {
      proximityBanner = "All tied up — anyone's game! 🤝"
      proximityClass = 'bg-blue-500/15 border-blue-500/30 text-blue-300'
    } else {
      proximityBanner = `You're ${gap} pts behind ${leader?.name} — catch up!`
      proximityClass = 'bg-rose-500/15 border-rose-500/30 text-rose-300'
    }
  } else {
    // answered wrong
    if (iAmAtTop && playersAtTop.length > 1) {
      proximityBanner = "It's all tied up! 🤝"
      proximityClass = 'bg-blue-500/15 border-blue-500/30 text-blue-300'
    } else if (gap === 0) {
      proximityBanner = "It's all tied up! 🤝"
      proximityClass = 'bg-blue-500/15 border-blue-500/30 text-blue-300'
    } else {
      proximityBanner = `You're ${gap} pts behind ${leader?.name} — catch up!`
      proximityClass = 'bg-rose-500/15 border-rose-500/30 text-rose-300'
    }
  }

  // Result banner — uses local myAnswerIdx signals only (no shared Firestore flags)
  let resultBanner
  if (!myDidAnswer) {
    resultBanner = (
      <div className="rounded-xl border px-4 py-3 text-sm font-bold bg-zinc-700/60 border-zinc-600/40 text-zinc-400 text-center">
        ⏰ You didn't answer
      </div>
    )
  } else if (myIsCorrect) {
    const myStreakBonus = streakBonuses?.[myId] ?? 0
    const mySpeedPts = (roundScores[myId] ?? 0) - myStreakBonus
    const myTotalPts = roundScores[myId] ?? 0
    const myStreak = streaks?.[myId] ?? 0
    resultBanner = (
      <div className="rounded-xl border px-4 py-3 bg-green-500/20 border-green-500/40 text-green-300 text-center">
        <div className="text-sm font-bold">✓ Correct! +{myTotalPts} pts</div>
        {myStreakBonus > 0 && (
          <>
            <div className="text-xs text-zinc-400 mt-0.5">({mySpeedPts} speed + {myStreakBonus} streak)</div>
            <div className="text-sm text-orange-400 font-semibold mt-1">🔥 {myStreak}x Streak! +{myStreakBonus} bonus</div>
          </>
        )}
      </div>
    )
  } else {
    resultBanner = (
      <div className="rounded-xl border px-4 py-3 text-sm font-bold bg-red-500/20 border-red-500/40 text-red-300 text-center">
        ✗ Wrong answer
      </div>
    )
  }

  const nextIdx = questionIdx + 1
  const nextQuestion = _questions?.[nextIdx]
  const isFinalNext = nextIdx === TOTAL_ROUNDS - 1

  return (
    <>
      <FloatingReactions reactions={myReaction} />
      <div className="space-y-4">
        <p className="text-zinc-500 text-sm text-center font-medium">
          Q {questionIdx + 1} / {TOTAL_ROUNDS} — {t('correctAnswer')}
        </p>

        {/* Question text */}
        <p className="text-white font-bold text-lg leading-snug text-center px-1">{question.question}</p>

        {/* Explanation — prominent, above options */}
        {question.explanation?.trim() && (
          <div className="bg-zinc-700/60 border border-zinc-600/60 rounded-xl px-4 py-3">
            <p className="text-sm text-white">💡 {question.explanation}</p>
          </div>
        )}

        {/* Options with answer highlight states */}
        <div className="grid grid-cols-1 gap-2">
          {question.options.map((opt, idx) => {
            const isCorrect = idx === correctIdx
            const isSelected = myAnswerIdx !== null && idx === myAnswerIdx

            let cls
            if (myAnswerIdx === null) {
              // player didn't answer
              cls = isCorrect
                ? 'bg-green-500/40 border-green-500/50 text-green-300'
                : 'bg-zinc-800/50 border-zinc-700/30 text-zinc-500 opacity-40'
            } else if (isSelected && isCorrect) {
              // State A: selected + correct
              cls = 'bg-green-500/80 border-green-400 text-white font-bold'
            } else if (isSelected && !isCorrect) {
              // State B: selected + wrong
              cls = 'bg-red-500/60 border-red-400 text-white'
            } else if (!isSelected && isCorrect) {
              // State C: not selected, correct answer
              cls = 'bg-green-500/40 border-green-500/50 text-green-300'
            } else {
              // State D: not selected, wrong
              cls = 'bg-zinc-800/50 border-zinc-700/30 text-zinc-500 opacity-40'
            }

            const icon = isSelected && isCorrect ? '✓' : isSelected && !isCorrect ? '✗' : null

            return (
              <div
                key={idx}
                className={`px-5 py-3 rounded-2xl font-semibold text-sm border flex items-center justify-between ${cls}`}
              >
                <span>
                  <span className="text-xs font-mono mr-2 opacity-70">{String.fromCharCode(65 + idx)}.</span>
                  {opt}
                </span>
                {icon && <span className="ml-2 text-base shrink-0">{icon}</span>}
              </div>
            )
          })}
        </div>

        {/* Result banner (correct/wrong/no answer) */}
        {resultBanner}

        <StreakBanner players={players} streaks={streaks} />

        {/* Proximity banner */}
        <div className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${proximityClass}`}>
          {proximityBanner}
        </div>

        {/* Per-player round results */}
        <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-4 space-y-1">
          {ranked.map((p, i) => {
            const streak = streaks[p.id] ?? 0
            const rt = responseTimes[p.id]
            const rtDisplay = (rt != null && rt >= 0 && rt <= 15) ? `${rt.toFixed(1)}s` : '—'
            return (
              <FadeInRow key={p.id} delay={i * 150}>
                <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${p.id === myId ? 'bg-zinc-700/60' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span>{i < correctPlayers.length ? (medals[i] ?? `${i + 1}.`) : '❌'}</span>
                    <span className={`text-sm font-medium ${p.id === myId ? 'text-amber-300 font-bold' : 'text-zinc-200'}`}>
                      {p.name}
                    </span>
                    {streak >= 5 && (
                      <span className="bg-yellow-500 text-zinc-900 text-xs font-bold px-2 py-0.5 rounded-full">{streak} ⚡</span>
                    )}
                    {streak >= 3 && streak < 5 && (
                      <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{streak} 🔥</span>
                    )}
                  </div>
                  {i < correctPlayers.length ? (
                    <span className="text-zinc-400 text-sm flex items-center gap-1">
                      {rtDisplay}
                      <span className="text-amber-400 font-bold ml-1">+{roundScores[p.id]}</span>
                      {(streakBonuses[p.id] ?? 0) > 0 && (
                        <span className="text-orange-400 text-xs font-semibold bg-orange-500/20 border border-orange-500/30 px-1.5 py-0.5 rounded-full">
                          +{streakBonuses[p.id]} 🔥
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-zinc-600 text-sm">Wrong</span>
                  )}
                </div>
              </FadeInRow>
            )
          })}
        </div>

        {nextQuestion && (
          <div className={`text-center font-semibold ${isFinalNext ? 'text-amber-400 text-base' : 'text-zinc-500 text-sm'}`}>
            {isFinalNext
              ? '🏆 FINAL QUESTION — Anything can happen!'
              : `Next up: ${catLabel(nextQuestion.category)}`}
          </div>
        )}
      </div>
    </>
  )
}

// ─── ResultScreen ─────────────────────────────────────────────────────────────

const PODIUM_COLORS = {
  0: 'bg-amber-400 text-zinc-900',
  1: 'bg-zinc-400 text-zinc-900',
  2: 'bg-amber-700 text-zinc-100',
}

const LOSER_SUBTEXTS = [
  "Revenge is one game away 👀",
  "Close one! Try again?",
  "Not bad... but not first 😏",
]
const LAST_SUBTEXTS = [
  "Plenty of room to grow 📈",
  "At least you showed up 😂",
  "The only way is up!",
]

function ResultScreen({ totalScores, winner, players, myId, room, correctCounts, fastestTimes, bestStreaks, category, isHost, onRematch, onHome, onRematchVote, rematchVoteCount, totalPlayers, t, questions, myAnswers }) {
  const [shareStatus, setShareStatus] = useState(null)
  const [myVoteSubmitted, setMyVoteSubmitted] = useState(false)
  const [loserSubtext] = useState(() => LOSER_SUBTEXTS[Math.floor(Math.random() * LOSER_SUBTEXTS.length)])
  const [lastSubtext] = useState(() => LAST_SUBTEXTS[Math.floor(Math.random() * LAST_SUBTEXTS.length)])

  // Fire confetti on mount
  useEffect(() => {
    import('canvas-confetti').then(mod => {
      const fire = mod.default
      fire({ particleCount: 140, spread: 70, origin: { y: 0.4 },
        colors: ['#f59e0b', '#fbbf24', '#34d399', '#60a5fa', '#f87171'] })
      setTimeout(() => {
        fire({ particleCount: 60, spread: 45, origin: { y: 0.6 }, angle: 60 })
        fire({ particleCount: 60, spread: 45, origin: { y: 0.6 }, angle: 120 })
      }, 700)
    })
  }, [])

  async function handleVote() {
    if (myVoteSubmitted) return
    setMyVoteSubmitted(true)
    await onRematchVote?.()
  }

  const ranked = resolveTieBreak(players.map(p => p.id), totalScores, {})
  const winnerPlayer = players.find(p => p.id === winner)
  const myPlayer = players.find(p => p.id === myId)
  const medals = ['🥇', '🥈', '🥉']

  const myRank = ranked.indexOf(myId)
  const isWinner = myRank === 0
  const isSecond = myRank === 1
  const isLast = myRank === ranked.length - 1 && ranked.length >= 3

  // Tie detection
  const maxScore = players.length > 0 ? Math.max(...players.map(p => totalScores[p.id] ?? 0)) : 0
  const tiedWinnerPlayers = players.filter(p => (totalScores[p.id] ?? 0) === maxScore)
  const isTie = tiedWinnerPlayers.length >= 2
  const catDisplay = catLabel(category) ?? 'Mixed'
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  const myScore = totalScores[myId] ?? 0
  const xpDisplay = room?.roomType === 'ranked' ? Math.round(myScore * 1.2) : myScore

  const accuracy = pid => Math.round(((correctCounts[pid] ?? 0) / TOTAL_ROUNDS) * 100)

  const fastestPlayer = [...players]
    .filter(p => fastestTimes[p.id] != null)
    .sort((a, b) => (fastestTimes[a.id] ?? 99) - (fastestTimes[b.id] ?? 99))[0]

  const mostAccurate = [...players].sort((a, b) => accuracy(b.id) - accuracy(a.id))[0]
  const bestStreaker = [...players].sort((a, b) => (bestStreaks[b.id] ?? 0) - (bestStreaks[a.id] ?? 0))[0]

  // Podium — visual order: 2nd | 1st | 3rd
  const podiumPids = ranked.slice(0, Math.min(3, players.length))
  const podiumVisual = podiumPids.length >= 3
    ? [podiumPids[1], podiumPids[0], podiumPids[2]]
    : podiumPids
  const podiumSlotHeights = podiumPids.length >= 3
    ? ['h-14', 'h-20', 'h-10']
    : podiumPids.length === 2
    ? ['h-20', 'h-14']
    : ['h-20']

  async function handleShare() {
    const top3 = ranked.slice(0, 3).map((pid, i) => {
      const p = players.find(x => x.id === pid)
      return `${medals[i] ?? `${i + 1}.`} ${p?.name ?? pid}: ${totalScores[pid] ?? 0} pts`
    }).join('\n')
    const text = `⚡ FirstBell — ${catDisplay} · ${players.length} players · ${dateStr}\n${top3}\n\nPlay at partybox-app.vercel.app`
    try {
      if (navigator.share) {
        await navigator.share({ title: '⚡ FirstBell Results', text })
      } else {
        await navigator.clipboard.writeText(text)
        setShareStatus('copied')
        setTimeout(() => setShareStatus(null), 2500)
      }
    } catch {
      // user dismissed — ignore
    }
  }

  return (
    <div className="space-y-5 pb-40">
      {/* Section 1 — Personalised announcement (UX 8 + BUG 3) */}
      {isWinner ? (
        <div className="text-center py-5 space-y-2 bg-gradient-to-b from-amber-500/20 to-transparent rounded-2xl">
          <div className="text-6xl">🏆</div>
          <p className="text-amber-400 font-black text-2xl leading-tight">You Won!</p>
          <p className="text-zinc-300 font-semibold text-base">Congratulations {myPlayer?.name}!</p>
          <p className="text-zinc-400 text-sm">Your score: {myScore} pts</p>
          <p className="text-amber-400 font-semibold text-sm">
            You earned +{xpDisplay} XP
            {room?.roomType === 'ranked' && (
              <span className="text-xs ml-1 text-amber-300/70">(ranked ×1.2)</span>
            )}
          </p>
        </div>
      ) : isSecond && !isTie ? (
        <div className="text-center py-5 space-y-2 bg-gradient-to-b from-zinc-500/20 to-transparent rounded-2xl">
          <div className="text-5xl">😅</div>
          <p className="text-zinc-200 font-black text-xl leading-tight">
            Almost! {winnerPlayer?.name ?? 'Someone'} got you this time
          </p>
          <p className="text-zinc-400 text-sm">{loserSubtext}</p>
          <p className="text-zinc-500 text-sm">Your score: {myScore} pts</p>
          <p className="text-amber-400 font-semibold text-sm">
            You earned +{xpDisplay} XP
            {room?.roomType === 'ranked' && (
              <span className="text-xs ml-1 text-amber-300/70">(ranked ×1.2)</span>
            )}
          </p>
        </div>
      ) : isLast && !isTie ? (
        <div className="text-center py-5 space-y-2">
          <div className="text-5xl">🏆</div>
          <p className="text-zinc-200 font-black text-xl leading-tight">
            {winnerPlayer?.name ?? 'Someone'} won this round
          </p>
          <p className="text-zinc-400 text-sm">{lastSubtext}</p>
          <p className="text-zinc-500 text-sm">Your score: {myScore} pts</p>
          <p className="text-amber-400 font-semibold text-sm">
            You earned +{xpDisplay} XP
            {room?.roomType === 'ranked' && (
              <span className="text-xs ml-1 text-amber-300/70">(ranked ×1.2)</span>
            )}
          </p>
        </div>
      ) : (
        // Tie or other positions
        <div className="text-center py-5 space-y-2">
          <div className="text-6xl">{isTie ? '🤝' : '🥈'}</div>
          <p className="text-white font-black text-2xl leading-tight">
            {isTie ? "It's a tie!" : `${winnerPlayer?.name ?? 'Player'} wins FirstBell!`}
          </p>
          {isTie && (
            <p className="text-zinc-300 font-semibold text-base">
              {tiedWinnerPlayers.map(p => p.name).join(' & ')}
            </p>
          )}
          <p className="text-zinc-400 text-sm">Your score: {myScore} pts</p>
          <p className="text-amber-400 font-semibold text-sm">
            You earned +{xpDisplay} XP
            {room?.roomType === 'ranked' && (
              <span className="text-xs ml-1 text-amber-300/70">(ranked ×1.2)</span>
            )}
          </p>
        </div>
      )}

      {/* Section 2 — Podium */}
      {players.length >= 2 && (
        <div className="flex items-end justify-center gap-2 px-2">
          {isTie && tiedWinnerPlayers.length >= 2 ? (
            <>
              <div className="flex-1 max-w-[60px]" />
              <div className="flex flex-col items-center gap-1 flex-[2]">
                <div className="flex items-center gap-1 justify-center">
                  {tiedWinnerPlayers.slice(0, 2).map((p) => (
                    <div key={p.id} className={`text-xl w-10 h-10 rounded-full flex items-center justify-center bg-zinc-700 ${p.id === myId ? 'ring-2 ring-amber-400' : ''}`}>
                      {p.avatar ?? p.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  ))}
                </div>
                <p className="text-zinc-300 text-xs font-semibold text-center leading-tight">
                  {tiedWinnerPlayers.slice(0, 2).map(p => p.name.split(' ')[0]).join(' 🤝 ')}
                </p>
                <p className="text-zinc-500 text-xs">{maxScore} each</p>
                <div className="w-full h-20 rounded-t-lg flex items-center justify-center font-black text-base bg-amber-400 text-zinc-900">
                  TIE
                </div>
              </div>
              {(() => {
                const thirdPid = ranked.find(pid => !tiedWinnerPlayers.some(p => p.id === pid))
                if (!thirdPid) return <div className="flex-1 max-w-[60px]" />
                const p = players.find(x => x.id === thirdPid)
                const isMe = thirdPid === myId
                return (
                  <div className="flex flex-col items-center gap-1 flex-1 max-w-[90px]">
                    <div className={`text-xl w-10 h-10 rounded-full flex items-center justify-center bg-zinc-700 ${isMe ? 'ring-2 ring-amber-400' : ''}`}>
                      {p?.avatar ?? p?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <p className={`text-xs font-semibold truncate w-full text-center ${isMe ? 'text-amber-300' : 'text-zinc-300'}`}>
                      {p?.name ?? thirdPid}
                    </p>
                    <p className="text-zinc-500 text-xs">{totalScores[thirdPid] ?? 0}</p>
                    <div className="w-full h-10 rounded-t-lg flex items-center justify-center font-bold text-lg bg-amber-700 text-zinc-100">
                      🥉
                    </div>
                  </div>
                )
              })()}
            </>
          ) : (
            podiumVisual.map((pid, slot) => {
              if (!pid) return null
              const p = players.find(x => x.id === pid)
              const trueRank = ranked.indexOf(pid)
              const isMe = pid === myId
              const initial = p?.avatar ?? p?.name?.[0]?.toUpperCase() ?? '?'
              return (
                <div key={pid} className="flex flex-col items-center gap-1 flex-1 max-w-[90px]">
                  <div className={`text-xl w-10 h-10 rounded-full flex items-center justify-center bg-zinc-700 ${isMe ? 'ring-2 ring-amber-400' : ''}`}>
                    {initial}
                  </div>
                  <p className={`text-xs font-semibold truncate w-full text-center ${isMe ? 'text-amber-300' : 'text-zinc-300'}`}>
                    {p?.name ?? pid}
                  </p>
                  <p className="text-zinc-500 text-xs">{totalScores[pid] ?? 0}</p>
                  <div className={`w-full rounded-t-lg flex items-center justify-center font-bold text-lg ${podiumSlotHeights[slot]} ${PODIUM_COLORS[trueRank] ?? 'bg-zinc-600 text-zinc-200'}`}>
                    {medals[trueRank] ?? `${trueRank + 1}`}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Section 3 — Full scoreboard */}
      <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-4">
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3">Scoreboard</p>
        <div className="space-y-1">
          {ranked.map((pid, rank) => {
            const p = players.find(x => x.id === pid)
            const isMe = pid === myId
            return (
              <div
                key={pid}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-zinc-700/60 border border-zinc-600/50' : ''}`}
              >
                <span className="w-6 text-center shrink-0">{medals[rank] ?? `${rank + 1}.`}</span>
                <span className={`flex-1 font-medium truncate ${isMe ? 'text-amber-300' : 'text-zinc-200'}`}>
                  {p?.name ?? pid}
                </span>
                <span className="text-zinc-500 text-xs shrink-0">{accuracy(pid)}%</span>
                <span className="text-amber-400 font-bold shrink-0">{totalScores[pid] ?? 0}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 4 — Stat highlights */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            icon: '⚡',
            label: 'Fastest',
            value: (() => {
              const ft = fastestPlayer ? fastestTimes[fastestPlayer.id] : null
              const valid = ft != null && ft >= 0 && ft <= 15
              return fastestPlayer && valid
                ? `${fastestPlayer.name.split(' ')[0]}\n${ft.toFixed(1)}s`
                : '—'
            })(),
          },
          {
            icon: '🎯',
            label: 'Accurate',
            value: mostAccurate
              ? `${mostAccurate.name.split(' ')[0]}\n${accuracy(mostAccurate.id)}%`
              : '—',
          },
          {
            icon: '🔥',
            label: 'Streak',
            value: bestStreaker && (bestStreaks[bestStreaker.id] ?? 0) > 0
              ? `${bestStreaker.name.split(' ')[0]}\n${bestStreaks[bestStreaker.id]}x`
              : '—',
          },
        ].map(s => (
          <div key={s.label} className="bg-zinc-800/80 border border-zinc-700/40 rounded-xl p-3 text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-zinc-500 text-xs mb-1">{s.label}</p>
            {s.value.split('\n').map((line, i) => (
              <p key={i} className={`leading-tight ${i === 0 ? 'text-zinc-200 text-xs font-semibold' : 'text-zinc-400 text-xs'}`}>
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>

      {/* Section 5 — Per-question breakdown */}
      {questions.length > 0 && (
        <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-4">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3">📋 How You Did</p>
          <div className="space-y-2">
            {questions.map((q, i) => {
              const ans = myAnswers?.[i]
              const selectedIdx = ans?.selectedIdx ?? null
              const pts = ans?.pts ?? 0
              const correctIdx = q.correctIdx
              const didAnswer = selectedIdx !== null
              const isCorrect = didAnswer && selectedIdx === correctIdx

              let cardCls, label
              if (!didAnswer) {
                cardCls = 'bg-zinc-700/40 border-zinc-600/40'
                label = <span className="text-zinc-500 text-xs">No answer</span>
              } else if (isCorrect) {
                cardCls = 'bg-green-500/10 border-green-500/30'
                label = <span className="text-green-400 text-xs font-semibold">✓ Correct</span>
              } else {
                cardCls = 'bg-red-500/10 border-red-500/30'
                label = <span className="text-red-400 text-xs font-semibold">✗ Wrong</span>
              }

              return (
                <div key={i} className={`rounded-xl border p-3 ${cardCls}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-zinc-300 text-xs font-medium leading-snug flex-1">
                      <span className="text-zinc-500 mr-1.5">Q{i + 1}.</span>{q.question}
                    </p>
                    {pts > 0 && (
                      <span className="text-amber-400 text-xs font-bold shrink-0">+{pts}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {label}
                    {!didAnswer && (
                      <span className="text-zinc-400 text-xs">→ {q.options[correctIdx]}</span>
                    )}
                    {didAnswer && !isCorrect && (
                      <>
                        <span className="text-red-400 text-xs line-through opacity-60">{q.options[selectedIdx]}</span>
                        <span className="text-zinc-500 text-xs">→</span>
                        <span className="text-green-400 text-xs">{q.options[correctIdx]}</span>
                      </>
                    )}
                    {didAnswer && isCorrect && (
                      <span className="text-green-300 text-xs">{q.options[correctIdx]}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Section 6 — Share */}
      <div className="bg-zinc-800/60 border border-zinc-700/40 rounded-2xl p-4 space-y-3">
        <div className="text-center">
          <p className="text-amber-400 font-black text-lg tracking-tight">⚡ FirstBell</p>
          <p className="text-zinc-500 text-xs">{catDisplay} · {players.length} players · {dateStr}</p>
          <div className="mt-2 space-y-0.5">
            {ranked.slice(0, 3).map((pid, i) => {
              const p = players.find(x => x.id === pid)
              return (
                <p key={pid} className="text-zinc-300 text-xs">
                  {medals[i]} {p?.name ?? pid} · {totalScores[pid] ?? 0} pts
                </p>
              )
            })}
          </div>
          <p className="text-zinc-600 text-xs mt-2">partybox-app.vercel.app</p>
        </div>
        <button
          onClick={handleShare}
          className="w-full py-2.5 rounded-xl font-semibold text-sm bg-zinc-700 border border-zinc-600/50 text-zinc-200 hover:bg-zinc-600 transition-colors"
        >
          {shareStatus === 'copied' ? '✅ Copied!' : '📱 Share Result'}
        </button>
      </div>

      {/* Section 7 — Actions (sticky) */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-sm px-4 pt-3 pb-6 border-t border-zinc-800 space-y-2">
        <AdBanner slot="firstbell-results" className="mb-3" />
        {isHost ? (
          <>
            <button
              onClick={onRematch}
              className="w-full py-3.5 rounded-xl font-bold text-base bg-amber-500 text-zinc-900 hover:bg-amber-400 transition-colors"
            >
              🔄 Rematch
            </button>
            {rematchVoteCount > 0 && (
              <p className="text-center text-zinc-500 text-xs">
                {rematchVoteCount}/{totalPlayers} want a rematch 🔥
              </p>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleVote}
              disabled={myVoteSubmitted}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors border ${
                myVoteSubmitted
                  ? 'bg-zinc-700 border-zinc-600 text-emerald-400 cursor-not-allowed'
                  : 'bg-zinc-700 border-zinc-600/50 text-zinc-200 hover:bg-zinc-600'
              }`}
            >
              {myVoteSubmitted ? '✓ Rematch requested!' : '👍 Want a Rematch?'}
            </button>
            {rematchVoteCount > 0 && (
              <p className="text-center text-zinc-500 text-xs">
                {rematchVoteCount}/{totalPlayers} want a rematch 🔥
              </p>
            )}
            <p className="text-center text-zinc-600 text-xs animate-pulse">
              Waiting for host to start a rematch...
            </p>
          </>
        )}
        <button
          onClick={onHome}
          className="w-full py-2.5 rounded-xl font-semibold text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          🏠 Home
        </button>
      </div>
    </div>
  )
}
