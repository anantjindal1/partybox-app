import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { buildConfessionOrder, buildGuessMap, scoreConfession } from './detectiveLogic'
import { LobbyScreen } from './LobbyScreen'
import { ConfessingScreen } from './ConfessingScreen'
import { DetectingScreen } from './DetectingScreen'
import { RevealScreen } from './RevealScreen'
import { ResultsScreen } from './ResultsScreen'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import metadata from './metadata'

function buildConfessions(actions) {
  const byPlayer = new Map()
  for (const a of actions) {
    if (a.type !== 'CONFESS') continue
    const text = a.payload?.text?.trim()
    if (!text) continue
    byPlayer.set(a.playerId, text)
  }
  return Array.from(byPlayer.entries()).map(([authorId, text], i) => ({ id: `c${i}_${authorId}`, authorId, text }))
}

export default function ChugliDetective({ code }) {
  const navigate = useNavigate()
  const {
    room,
    roomState,
    actions,
    sendAction,
    setState,
    clearActions,
    isHost,
    myId,
    players
  } = useOnlineRoom(code)

  const phase = roomState.phase || 'waiting'
  const roomStateRef = useRef(roomState)
  roomStateRef.current = roomState
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  const [starting, setStarting] = useState(false)
  const [advancing, setAdvancing] = useState(false)

  const xpAwarded = useRef(false)
  const confessCloseTimer = useRef(null)
  const confessResolveGuard = useRef(false)
  const voteCloseTimer = useRef(null)
  const voteResolveGuard = useRef(false)

  function persist(overrides) {
    return setState({ ...roomStateRef.current, ...overrides })
  }

  useEffect(() => {
    if (phase === 'waiting') xpAwarded.current = false
  }, [phase])

  // ── Host: confessing -> detecting, once everyone has submitted ──────────
  useEffect(() => {
    if (!isHost || phase !== 'confessing') return
    const submitted = new Set(actions.filter(a => a.type === 'CONFESS').map(a => a.playerId)).size
    if (submitted >= players.length) {
      if (confessCloseTimer.current) return
      confessCloseTimer.current = setTimeout(() => {
        confessCloseTimer.current = null
        closeConfessing()
      }, 600)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase])

  async function closeConfessing() {
    if (confessResolveGuard.current) return
    confessResolveGuard.current = true
    const confessions = buildConfessions(actionsRef.current)
    const confessionOrder = buildConfessionOrder(confessions)
    await clearActions()
    await persist({
      phase: 'detecting',
      confessions,
      confessionOrder,
      confessionIndex: 0,
      lastResult: null
    })
  }

  // ── Host: detecting -> reveal, once every eligible voter has voted ───────
  useEffect(() => {
    if (!isHost || phase !== 'detecting') return
    const current = roomStateRef.current
    const confession = current.confessions?.find(c => c.id === current.confessionOrder?.[current.confessionIndex])
    if (!confession) return
    const eligibleVoters = players.filter(p => p.id !== confession.authorId)
    const votes = actions.filter(a => a.type === 'GUESS' && a.playerId !== confession.authorId).length
    if (eligibleVoters.length > 0 && votes >= eligibleVoters.length) {
      if (voteCloseTimer.current) return
      voteCloseTimer.current = setTimeout(() => {
        voteCloseTimer.current = null
        resolveVoting()
      }, 600)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.confessionIndex])

  async function resolveVoting() {
    if (voteResolveGuard.current) return
    voteResolveGuard.current = true
    const current = roomStateRef.current
    const confession = current.confessions?.find(c => c.id === current.confessionOrder?.[current.confessionIndex])
    if (!confession) {
      voteResolveGuard.current = false
      return
    }
    const eligibleVoters = players.filter(p => p.id !== confession.authorId).map(p => p.id)
    const validVotes = actions.filter(a => a.type === 'GUESS' && a.playerId !== confession.authorId)
    const guessMap = buildGuessMap(validVotes)
    const { correctGuesserIds, authorPoints } = scoreConfession(guessMap, confession.authorId, eligibleVoters)
    const scores = { ...current.scores }
    for (const id of correctGuesserIds) scores[id] = (scores[id] ?? 0) + 1
    if (authorPoints > 0) scores[confession.authorId] = (scores[confession.authorId] ?? 0) + authorPoints
    await clearActions()
    await persist({
      scores,
      lastResult: {
        confessionText: confession.text,
        authorId: confession.authorId,
        correctGuesserIds,
        authorPoints
      },
      phase: 'reveal'
    })
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleStartGame() {
    setStarting(true)
    try {
      const playerIds = players.map(p => p.id)
      const zeroed = Object.fromEntries(playerIds.map(id => [id, 0]))
      confessResolveGuard.current = false
      voteResolveGuard.current = false
      await clearActions()
      await persist({
        phase: 'confessing',
        turnOrder: playerIds,
        scores: zeroed,
        confessions: [],
        confessionOrder: [],
        confessionIndex: 0,
        lastResult: null
      })
    } finally {
      setStarting(false)
    }
  }

  function handleSubmitConfession(text) {
    sendAction({ type: 'CONFESS', payload: { text } })
  }

  function handleForceAdvanceConfessing() {
    closeConfessing()
  }

  function handleVote(targetPlayerId) {
    sendAction({ type: 'GUESS', payload: { targetPlayerId } })
  }

  async function handleNextConfession() {
    if (advancing) return
    setAdvancing(true)
    try {
      const current = roomStateRef.current
      const nextIndex = current.confessionIndex + 1
      if (nextIndex >= (current.confessionOrder?.length ?? 0)) {
        await persist({ phase: 'results' })
        return
      }
      voteResolveGuard.current = false
      await clearActions()
      await persist({
        phase: 'detecting',
        confessionIndex: nextIndex,
        lastResult: null
      })
    } finally {
      setAdvancing(false)
    }
  }

  async function handleRematch() {
    await clearActions()
    await setState({})
  }

  // ── XP / stats / badge on results ────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results' || !myId || xpAwarded.current) return
    xpAwarded.current = true
    const scores = roomState.scores ?? {}
    const maxScore = Math.max(0, ...players.map(p => scores[p.id] ?? 0))
    const isWinner = maxScore > 0 && (scores[myId] ?? 0) === maxScore
    awardXP(isWinner ? 100 : 20, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('chugli-detective', { won: isWinner, gamesPlayed: 1 })
    }
    if (isWinner) awardBadge(metadata.onlineBadge.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── Render ────────────────────────────────────────────────────────────────
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
        onStart={handleStartGame}
        starting={starting}
      />
    )
  }

  if (phase === 'confessing') {
    const submitted = actions.some(a => a.type === 'CONFESS' && a.playerId === myId)
    const submittedCount = new Set(actions.filter(a => a.type === 'CONFESS').map(a => a.playerId)).size
    return (
      <ConfessingScreen
        submitted={submitted}
        submittedCount={submittedCount}
        totalPlayers={players.length}
        onSubmit={handleSubmitConfession}
        isHost={isHost}
        onForceAdvance={handleForceAdvanceConfessing}
      />
    )
  }

  if (phase === 'detecting') {
    const confessionOrder = roomState.confessionOrder ?? []
    const confessions = roomState.confessions ?? []
    const confessionIndex = roomState.confessionIndex ?? 0
    const confession = confessions.find(c => c.id === confessionOrder[confessionIndex])
    if (!confession) return null
    const canVote = myId !== confession.authorId
    const suspects = players.filter(p => p.id !== myId)
    const eligibleVoters = players.filter(p => p.id !== confession.authorId)
    const votesIn = actions.filter(a => a.type === 'GUESS' && a.playerId !== confession.authorId).length
    const myVoteSent = actions.some(a => a.type === 'GUESS' && a.playerId === myId)
    return (
      <DetectingScreen
        confessionText={confession.text}
        confessionIndex={confessionIndex}
        totalConfessions={confessionOrder.length}
        canVote={canVote}
        suspects={suspects}
        onVote={handleVote}
        voted={myVoteSent}
        votesIn={votesIn}
        totalVoters={eligibleVoters.length}
        isHost={isHost}
        onEndVoting={resolveVoting}
      />
    )
  }

  if (phase === 'reveal') {
    return (
      <RevealScreen
        lastResult={roomState.lastResult}
        players={players}
        confessionIndex={roomState.confessionIndex ?? 0}
        totalConfessions={(roomState.confessionOrder ?? []).length}
        isHost={isHost}
        isLast={(roomState.confessionIndex ?? 0) >= (roomState.confessionOrder ?? []).length - 1}
        onNext={handleNextConfession}
        advancing={advancing}
      />
    )
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        players={players}
        scores={roomState.scores ?? {}}
        myId={myId}
        isHost={isHost}
        onRematch={handleRematch}
        onHome={() => navigate('/')}
      />
    )
  }

  return null
}
