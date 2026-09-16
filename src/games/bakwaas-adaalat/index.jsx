import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useLang } from '../../store/LangContext'
import { CASES } from './cases'
import { pickLawyers, tallyVotes, resolveWinners } from './adaalatLogic'
import { LobbyScreen } from './LobbyScreen'
import { ArguingScreen } from './ArguingScreen'
import { VotingScreen } from './VotingScreen'
import { RevealScreen } from './RevealScreen'
import { ResultsScreen } from './ResultsScreen'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import metadata from './metadata'

function pickCaseId(usedIds, rng = Math.random) {
  const fresh = CASES.filter(c => !usedIds.includes(c.id))
  const pool = fresh.length > 0 ? fresh : CASES
  return pool[Math.floor(rng() * pool.length)].id
}

export default function BakwaasAdaalat({ code }) {
  const navigate = useNavigate()
  const { lang } = useLang()
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

  const [starting, setStarting] = useState(false)
  const [advancing, setAdvancing] = useState(false)

  const xpAwarded = useRef(false)
  const argTimerRef = useRef(null)
  const voteCloseTimer = useRef(null)
  const voteResolveGuard = useRef(false)

  function persist(overrides) {
    return setState({ ...roomStateRef.current, ...overrides })
  }

  useEffect(() => {
    if (phase === 'waiting') xpAwarded.current = false
  }, [phase])

  // ── Host: run the two lawyers' speaking timers ───────────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'arguing') return
    const seconds = roomState.turnSeconds ?? 30
    argTimerRef.current = setTimeout(() => {
      const current = roomStateRef.current
      if (current.argSlot === 0) {
        persist({ argSlot: 1 })
      } else {
        voteResolveGuard.current = false
        persist({ phase: 'voting' })
      }
    }, seconds * 1000)
    return () => clearTimeout(argTimerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, roomState.argSlot, roomState.roundNumber])

  // ── Host: voting -> reveal, once every eligible voter has voted ─────────
  useEffect(() => {
    if (!isHost || phase !== 'voting') return
    const lawyerIds = roomState.lawyerIds ?? []
    const eligibleVoters = players.filter(p => !lawyerIds.includes(p.id))
    const votes = actions.filter(a => a.type === 'VOTE' && !lawyerIds.includes(a.playerId)).length
    if (eligibleVoters.length > 0 && votes >= eligibleVoters.length) {
      if (voteCloseTimer.current) return
      voteCloseTimer.current = setTimeout(() => {
        voteCloseTimer.current = null
        resolveVoting()
      }, 600)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.lawyerIds])

  async function resolveVoting() {
    if (voteResolveGuard.current) return
    voteResolveGuard.current = true
    const current = roomStateRef.current
    const lawyerIds = current.lawyerIds ?? []
    const validVotes = actions.filter(a => a.type === 'VOTE' && !lawyerIds.includes(a.playerId))
    const tally = tallyVotes(validVotes)
    const winnerIds = resolveWinners(tally, lawyerIds)
    const scores = { ...current.scores }
    for (const id of winnerIds) scores[id] = (scores[id] ?? 0) + 1
    await clearActions()
    await persist({
      scores,
      lastRoundResult: {
        caseText: CASES.find(c => c.id === current.caseId)?.[lang] ?? '',
        lawyerIds,
        tally,
        winnerIds
      },
      phase: 'reveal'
    })
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleStartGame({ turnSeconds, roundCount }) {
    setStarting(true)
    try {
      const playerIds = players.map(p => p.id)
      const { lawyerIds, nextArguedIds } = pickLawyers(playerIds, [])
      const caseId = pickCaseId([])
      const zeroed = Object.fromEntries(playerIds.map(id => [id, 0]))
      await clearActions()
      await persist({
        phase: 'arguing',
        turnSeconds,
        roundCount,
        roundNumber: 1,
        turnOrder: playerIds,
        caseId,
        usedCaseIds: [caseId],
        lawyerIds,
        arguedIds: nextArguedIds,
        argSlot: 0,
        scores: zeroed,
        lastRoundResult: null
      })
    } finally {
      setStarting(false)
    }
  }

  function handleVote(targetPlayerId) {
    sendAction({ type: 'VOTE', payload: { targetPlayerId } })
  }

  async function handleNextRound() {
    if (advancing) return
    setAdvancing(true)
    try {
      const current = roomStateRef.current
      const nextRoundNumber = current.roundNumber + 1
      if (nextRoundNumber > current.roundCount) {
        await persist({ phase: 'results' })
        return
      }
      const { lawyerIds, nextArguedIds } = pickLawyers(current.turnOrder, current.arguedIds ?? [])
      const caseId = pickCaseId(current.usedCaseIds ?? [])
      await clearActions()
      await persist({
        phase: 'arguing',
        roundNumber: nextRoundNumber,
        caseId,
        usedCaseIds: [...(current.usedCaseIds ?? []), caseId],
        lawyerIds,
        arguedIds: nextArguedIds,
        argSlot: 0,
        lastRoundResult: null
      })
    } finally {
      setAdvancing(false)
    }
  }

  async function handleRematch() {
    await clearActions()
    await setState({})
  }

  // ── XP / stats / badge on results ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results' || !myId || xpAwarded.current) return
    xpAwarded.current = true
    const scores = roomState.scores ?? {}
    const maxScore = Math.max(0, ...players.map(p => scores[p.id] ?? 0))
    const isWinner = maxScore > 0 && (scores[myId] ?? 0) === maxScore
    awardXP(isWinner ? 100 : 20, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('bakwaas-adaalat', { won: isWinner, gamesPlayed: 1 })
    }
    if (isWinner) awardBadge(metadata.onlineBadge.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── Client-side visual countdown for the arguing timer ───────────────────
  const [secondsLeft, setSecondsLeft] = useState(roomState.turnSeconds ?? 30)
  useEffect(() => {
    if (phase !== 'arguing') return
    setSecondsLeft(roomState.turnSeconds ?? 30)
    const interval = setInterval(() => {
      setSecondsLeft(prev => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase, roomState.argSlot, roomState.roundNumber, roomState.turnSeconds])

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
        onStart={handleStartGame}
        starting={starting}
      />
    )
  }

  if (phase === 'arguing') {
    const caseText = CASES.find(c => c.id === roomState.caseId)?.[lang] ?? ''
    const lawyerNames = (roomState.lawyerIds ?? []).map(id => players.find(p => p.id === id)?.name ?? 'Player')
    return (
      <ArguingScreen
        caseText={caseText}
        lawyerNames={lawyerNames}
        argSlot={roomState.argSlot ?? 0}
        turnSeconds={roomState.turnSeconds ?? 30}
        secondsLeft={secondsLeft}
      />
    )
  }

  if (phase === 'voting') {
    const caseText = CASES.find(c => c.id === roomState.caseId)?.[lang] ?? ''
    const lawyerIds = roomState.lawyerIds ?? []
    const lawyers = lawyerIds.map(id => players.find(p => p.id === id)).filter(Boolean)
    const canVote = !lawyerIds.includes(myId)
    const eligibleVoters = players.filter(p => !lawyerIds.includes(p.id))
    const votesIn = actions.filter(a => a.type === 'VOTE' && !lawyerIds.includes(a.playerId)).length
    const myVoteSent = actions.some(a => a.type === 'VOTE' && a.playerId === myId)
    return (
      <VotingScreen
        caseText={caseText}
        lawyers={lawyers}
        canVote={canVote}
        votesIn={votesIn}
        totalVoters={eligibleVoters.length}
        onVote={handleVote}
        voted={myVoteSent}
        isHost={isHost}
        onEndVoting={resolveVoting}
      />
    )
  }

  if (phase === 'reveal') {
    return (
      <RevealScreen
        lastRoundResult={roomState.lastRoundResult}
        players={players}
        roundNumber={roomState.roundNumber ?? 1}
        totalRounds={roomState.roundCount ?? 1}
        isHost={isHost}
        isLastRound={(roomState.roundNumber ?? 1) >= (roomState.roundCount ?? 1)}
        onNextRound={handleNextRound}
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
