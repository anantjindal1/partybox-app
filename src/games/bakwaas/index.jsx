import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useLang } from '../../store/LangContext'
import { filterPrompts, pickRandomPrompt } from './prompts'
import { tallyVotes, resolveWinners, buildAnswerList } from './voting'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import { LobbyScreen } from './LobbyScreen'
import { AnsweringScreen } from './AnsweringScreen'
import { VotingScreen } from './VotingScreen'
import { RevealScreen } from './RevealScreen'
import { ResultsScreen } from './ResultsScreen'
import metadata from './metadata'

export default function Bakwaas({ code }) {
  const navigate = useNavigate()
  const { t } = useLang()
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

  const phase = roomState.phase || 'waiting'
  const roomStateRef = useRef(roomState)
  roomStateRef.current = roomState

  const [starting, setStarting] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)

  const xpAwarded = useRef(false)
  const answeringGuard = useRef(false)
  const votingGuard = useRef(false)
  const answerCloseTimer = useRef(null)
  const voteCloseTimer = useRef(null)

  function persist(overrides) {
    return setState({ ...roomStateRef.current, ...overrides })
  }

  useEffect(() => {
    if (phase === 'waiting') xpAwarded.current = false
  }, [phase])

  useEffect(() => {
    if (phase === 'answering') {
      setAnswerSubmitted(false)
      answeringGuard.current = false
    }
  }, [phase, roomState.currentRound])

  useEffect(() => {
    if (phase === 'voting') votingGuard.current = false
  }, [phase, roomState.currentRound])

  // ── Host: answering -> voting (or reveal, if too few answers) ──────────────
  useEffect(() => {
    if (!isHost || phase !== 'answering') return
    const answered = actions.filter((a) => a.type === 'ANSWER').length
    if (players.length > 0 && answered >= players.length) {
      if (answerCloseTimer.current) return
      answerCloseTimer.current = setTimeout(() => {
        answerCloseTimer.current = null
        advanceFromAnswering()
      }, 600)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.currentRound])

  async function advanceFromAnswering() {
    if (answeringGuard.current) return
    answeringGuard.current = true
    const answers = buildAnswerList(actions.filter((a) => a.type === 'ANSWER'))
    await clearActions()
    if (answers.length < 2) {
      await persist({
        phase: 'reveal',
        answers,
        tally: {},
        winnerAuthorIds: [],
        cumulativeScores: roomStateRef.current.cumulativeScores ?? {},
        skippedVoting: true,
      })
    } else {
      await persist({ phase: 'voting', answers, skippedVoting: false })
    }
  }

  // ── Host: voting -> reveal (everyone voted, early close) ────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'voting') return
    const votes = actions.filter((a) => a.type === 'VOTE').length
    if (players.length > 0 && votes >= players.length) {
      if (voteCloseTimer.current) return
      voteCloseTimer.current = setTimeout(() => {
        voteCloseTimer.current = null
        advanceToReveal()
      }, 600)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.currentRound])

  async function advanceToReveal() {
    if (votingGuard.current) return
    votingGuard.current = true
    const tally = tallyVotes(actions)
    const winnerAuthorIds = resolveWinners(tally)
    const current = roomStateRef.current
    const cumulative = { ...(current.cumulativeScores ?? {}) }
    for (const [playerId, votes] of Object.entries(tally)) {
      cumulative[playerId] = (cumulative[playerId] ?? 0) + votes
    }
    await clearActions()
    await persist({ phase: 'reveal', tally, winnerAuthorIds, cumulativeScores: cumulative, skippedVoting: false })
  }

  // ── XP / stats / badge on results ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results' || !myId || xpAwarded.current) return
    xpAwarded.current = true
    const cumulative = roomState.cumulativeScores ?? {}
    const myScore = cumulative[myId] ?? 0
    const maxScore = Math.max(0, ...Object.values(cumulative))
    const isWinner = myScore > 0 && myScore === maxScore

    awardXP(myScore, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('bakwaas', { won: isWinner, gamesPlayed: 1 })
    }
    if (isWinner) awardBadge(metadata.onlineBadge.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleStart({ selectedTags, includeAdult, roundCount }) {
    setStarting(true)
    try {
      const pool = filterPrompts(selectedTags, includeAdult)
      const prompt = pickRandomPrompt(pool, [])
      await clearActions()
      await persist({
        phase: 'answering',
        roundCount,
        currentRound: 1,
        selectedTags,
        includeAdult,
        usedPromptIds: prompt ? [prompt.id] : [],
        currentPrompt: prompt,
        cumulativeScores: {},
        answers: [],
        tally: {},
        winnerAuthorIds: [],
        skippedVoting: false,
      })
    } finally {
      setStarting(false)
    }
  }

  function handleSubmitAnswer(text) {
    if (answerSubmitted) return
    setAnswerSubmitted(true)
    sendAction({ type: 'ANSWER', payload: { text } })
  }

  function handleRevealAnswersNow() {
    advanceFromAnswering()
  }

  function handleVote(targetPlayerId) {
    sendAction({ type: 'VOTE', payload: { targetPlayerId } })
  }

  function handleEndVoting() {
    advanceToReveal()
  }

  async function handleNextRound() {
    if (advancing) return
    setAdvancing(true)
    try {
      const current = roomStateRef.current
      const nextRound = (current.currentRound ?? 1) + 1
      if (nextRound > current.roundCount) {
        await persist({ phase: 'results', cumulativeScores: current.cumulativeScores })
        return
      }
      const pool = filterPrompts(current.selectedTags, current.includeAdult)
      const prompt = pickRandomPrompt(pool, current.usedPromptIds ?? [])
      await clearActions()
      await persist({
        phase: 'answering',
        currentRound: nextRound,
        usedPromptIds: prompt ? [...(current.usedPromptIds ?? []), prompt.id] : current.usedPromptIds,
        currentPrompt: prompt,
        answers: [],
        tally: {},
        winnerAuthorIds: [],
        skippedVoting: false,
      })
    } finally {
      setAdvancing(false)
    }
  }

  async function handleRematch() {
    await clearActions()
    await setState({})
  }

  async function handleRematchVote() {
    await sendAction({ type: 'REMATCH_VOTE', payload: {} })
  }

  const rematchVoteCount = actions.filter((a) => a.type === 'REMATCH_VOTE').length

  // ── Render ───────────────────────────────────────────────────────────────
  if (!room || !myId) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <p className="text-textMuted animate-pulse">Connecting…</p>
      </div>
    )
  }

  if (phase === 'waiting') {
    return (
      <LobbyScreen
        isHost={isHost}
        minPlayers={metadata.minPlayers}
        players={players}
        onStart={handleStart}
        starting={starting}
        t={t}
      />
    )
  }

  if (phase === 'answering') {
    const answersIn = actions.filter((a) => a.type === 'ANSWER').length
    return (
      <AnsweringScreen
        prompt={roomState.currentPrompt}
        answersIn={answersIn}
        totalPlayers={players.length}
        onSubmit={handleSubmitAnswer}
        submitted={answerSubmitted}
        isHost={isHost}
        onRevealNow={handleRevealAnswersNow}
        currentRound={roomState.currentRound}
        roundCount={roomState.roundCount}
        t={t}
      />
    )
  }

  if (phase === 'voting') {
    const myVoteSent = actions.some((a) => a.type === 'VOTE' && a.playerId === myId)
    const votesIn = actions.filter((a) => a.type === 'VOTE').length
    return (
      <VotingScreen
        prompt={roomState.currentPrompt}
        answers={roomState.answers ?? []}
        myId={myId}
        votesIn={votesIn}
        totalPlayers={players.length}
        onVote={handleVote}
        voted={myVoteSent}
        isHost={isHost}
        onEndVoting={handleEndVoting}
        currentRound={roomState.currentRound}
        roundCount={roomState.roundCount}
        t={t}
      />
    )
  }

  if (phase === 'reveal') {
    return (
      <RevealScreen
        prompt={roomState.currentPrompt}
        answers={roomState.answers ?? []}
        tally={roomState.tally ?? {}}
        winnerAuthorIds={roomState.winnerAuthorIds ?? []}
        players={players}
        isHost={isHost}
        isLastRound={(roomState.currentRound ?? 1) >= (roomState.roundCount ?? 1)}
        skippedVoting={!!roomState.skippedVoting}
        onNextRound={handleNextRound}
        advancing={advancing}
        t={t}
      />
    )
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        players={players}
        cumulativeScores={roomState.cumulativeScores ?? {}}
        myId={myId}
        isHost={isHost}
        onRematch={isHost ? handleRematch : null}
        onHome={() => navigate('/')}
        onRematchVote={!isHost ? handleRematchVote : null}
        rematchVoteCount={rematchVoteCount}
        totalPlayers={players.length}
        t={t}
      />
    )
  }

  return null
}
