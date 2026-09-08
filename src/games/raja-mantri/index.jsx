import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useLang } from '../../store/LangContext'
import { assignRoles, computeRoundScores } from './roles'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import { LobbyScreen } from './LobbyScreen'
import { RoleRevealScreen } from './RoleRevealScreen'
import { MantriGuessScreen } from './MantriGuessScreen'
import { RoundRevealScreen } from './RoundRevealScreen'
import { ResultsScreen } from './ResultsScreen'
import metadata from './metadata'

const ROLE_REVEAL_TIMEOUT_MS = 8000
const MANTRI_GUESS_TIMEOUT_MS = 25000

export default function RajaMantriChorSipahi({ code }) {
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
  const xpAwarded = useRef(false)
  const roleAckCloseTimer = useRef(null)
  const mantriGuessCloseTimer = useRef(null)
  const roleAdvanceGuard = useRef(false)
  const revealAdvanceGuard = useRef(false)

  const [starting, setStarting] = useState(false)
  const [ackSent, setAckSent] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(MANTRI_GUESS_TIMEOUT_MS / 1000)

  // ── Reset per-round local UI state ──────────────────────────────────────────
  useEffect(() => {
    if (phase === 'role_reveal') setAckSent(false)
  }, [phase, roomState.currentRound])

  useEffect(() => {
    if (phase === 'waiting') xpAwarded.current = false
  }, [phase])

  useEffect(() => {
    if (phase === 'role_reveal') roleAdvanceGuard.current = false
  }, [phase, roomState.currentRound])

  useEffect(() => {
    if (phase === 'mantri_guess') revealAdvanceGuard.current = false
  }, [phase, roomState.currentRound])

  // ── Client-side countdown during mantri_guess ───────────────────────────────
  useEffect(() => {
    if (phase !== 'mantri_guess') return
    const started = roomState.phaseStartedAt ?? Date.now()
    const totalSec = MANTRI_GUESS_TIMEOUT_MS / 1000
    const tick = () => {
      const elapsed = (Date.now() - started) / 1000
      setSecondsLeft(Math.max(0, Math.round(totalSec - elapsed)))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [phase, roomState.phaseStartedAt])

  // ── Host: role_reveal -> mantri_guess (all acked, early close) ──────────────
  useEffect(() => {
    if (!isHost || phase !== 'role_reveal') return
    const acked = actions.filter((a) => a.type === 'ROLE_ACK').length
    if (players.length > 0 && acked >= players.length) {
      if (roleAckCloseTimer.current) return
      roleAckCloseTimer.current = setTimeout(() => {
        roleAckCloseTimer.current = null
        advanceToMantriGuess()
      }, 600)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.currentRound])

  // ── Host: role_reveal hard timeout ──────────────────────────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'role_reveal') return
    const timer = setTimeout(() => advanceToMantriGuess(), ROLE_REVEAL_TIMEOUT_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, roomState.currentRound])

  async function advanceToMantriGuess() {
    if (roleAdvanceGuard.current) return
    roleAdvanceGuard.current = true
    await clearActions()
    await setState({
      phase: 'mantri_guess',
      roundCount: roomState.roundCount,
      currentRound: roomState.currentRound,
      roles: roomState.roles,
      cumulativeScores: roomState.cumulativeScores,
      phaseStartedAt: Date.now(),
    })
  }

  // ── Host: mantri_guess -> round_reveal (mantri answered, early close) ──────
  useEffect(() => {
    if (!isHost || phase !== 'mantri_guess') return
    const mantriId = Object.keys(roomState.roles || {}).find((id) => roomState.roles[id] === 'mantri')
    const guessAction = actions.find((a) => a.type === 'MANTRI_GUESS' && a.playerId === mantriId)
    if (!guessAction) return
    if (mantriGuessCloseTimer.current) return
    mantriGuessCloseTimer.current = setTimeout(() => {
      mantriGuessCloseTimer.current = null
      advanceToRoundReveal(guessAction.payload?.targetPlayerId ?? null)
    }, 600)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.currentRound])

  // ── Host: mantri_guess hard timeout (mantri never answers) ──────────────────
  useEffect(() => {
    if (!isHost || phase !== 'mantri_guess') return
    const timer = setTimeout(() => advanceToRoundReveal(null), MANTRI_GUESS_TIMEOUT_MS + 600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, roomState.currentRound])

  async function advanceToRoundReveal(guessedId) {
    if (revealAdvanceGuard.current) return
    revealAdvanceGuard.current = true
    const { scores, correct } = computeRoundScores(roomState.roles, guessedId)
    const cumulative = { ...(roomState.cumulativeScores ?? {}) }
    for (const [id, pts] of Object.entries(scores)) {
      cumulative[id] = (cumulative[id] ?? 0) + pts
    }
    await clearActions()
    await setState({
      phase: 'round_reveal',
      roundCount: roomState.roundCount,
      currentRound: roomState.currentRound,
      roles: roomState.roles,
      mantriGuessId: guessedId,
      correct,
      roundScores: scores,
      cumulativeScores: cumulative,
    })
  }

  // ── XP / stats / badge on results ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results' || !myId || xpAwarded.current) return
    xpAwarded.current = true
    const cumulative = roomState.cumulativeScores ?? {}
    const myScore = cumulative[myId] ?? 0
    const sorted = Object.entries(cumulative).sort((a, b) => b[1] - a[1])
    const isWinner = sorted.length > 0 && sorted[0][0] === myId

    awardXP(myScore, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('raja-mantri', { won: isWinner, gamesPlayed: 1 })
    }
    if (isWinner) awardBadge(metadata.onlineBadge.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleStart(roundCount) {
    setStarting(true)
    const roles = assignRoles(players.map((p) => p.id))
    await clearActions()
    await setState({
      phase: 'role_reveal',
      roundCount,
      currentRound: 1,
      roles,
      cumulativeScores: {},
      phaseStartedAt: Date.now(),
    })
    setStarting(false)
  }

  function handleAck() {
    if (ackSent) return
    setAckSent(true)
    sendAction({ type: 'ROLE_ACK', payload: {} })
  }

  function handleGuess(targetPlayerId) {
    sendAction({ type: 'MANTRI_GUESS', payload: { targetPlayerId } })
  }

  async function handleNextRound() {
    setAdvancing(true)
    const nextRound = (roomState.currentRound ?? 1) + 1
    if (nextRound > roomState.roundCount) {
      await setState({
        phase: 'results',
        roundCount: roomState.roundCount,
        cumulativeScores: roomState.cumulativeScores,
      })
      setAdvancing(false)
      return
    }
    const roles = assignRoles(players.map((p) => p.id))
    await clearActions()
    await setState({
      phase: 'role_reveal',
      roundCount: roomState.roundCount,
      currentRound: nextRound,
      roles,
      cumulativeScores: roomState.cumulativeScores,
      phaseStartedAt: Date.now(),
    })
    setAdvancing(false)
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
        players={players}
        isHost={isHost}
        minPlayers={metadata.minPlayers}
        onStart={handleStart}
        starting={starting}
        t={t}
      />
    )
  }

  if (phase === 'role_reveal') {
    const myRole = roomState.roles?.[myId]
    const ackedCount = actions.filter((a) => a.type === 'ROLE_ACK').length
    return (
      <RoleRevealScreen
        role={myRole}
        roundCount={roomState.roundCount}
        currentRound={roomState.currentRound}
        ackSent={ackSent}
        onAck={handleAck}
        ackedCount={ackedCount}
        totalPlayers={players.length}
        t={t}
      />
    )
  }

  if (phase === 'mantri_guess') {
    const isMantri = roomState.roles?.[myId] === 'mantri'
    const myGuessSent = actions.some((a) => a.type === 'MANTRI_GUESS' && a.playerId === myId)
    return (
      <MantriGuessScreen
        isMantri={isMantri}
        players={players}
        myId={myId}
        secondsLeft={secondsLeft}
        totalSeconds={MANTRI_GUESS_TIMEOUT_MS / 1000}
        onGuess={handleGuess}
        guessed={myGuessSent}
        t={t}
      />
    )
  }

  if (phase === 'round_reveal') {
    return (
      <RoundRevealScreen
        roles={roomState.roles ?? {}}
        roundScores={roomState.roundScores ?? {}}
        cumulativeScores={roomState.cumulativeScores ?? {}}
        correct={roomState.correct}
        players={players}
        isHost={isHost}
        isLastRound={(roomState.currentRound ?? 1) >= (roomState.roundCount ?? 1)}
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
