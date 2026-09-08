import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useLang } from '../../store/LangContext'
import { filterPrompts, pickRandomPrompt } from './prompts'
import { tallyVotes, resolveWinners } from './voting'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import { LobbyScreen } from './LobbyScreen'
import { VotingScreen } from './VotingScreen'
import { RevealScreen } from './RevealScreen'
import { ResultsScreen } from './ResultsScreen'
import metadata from './metadata'

export default function SabseZyadaKaunOnline({ code }) {
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
  const voteCloseTimer = useRef(null)
  const advanceGuard = useRef(false)

  const [starting, setStarting] = useState(false)
  const [advancing, setAdvancing] = useState(false)

  useEffect(() => {
    if (phase === 'waiting') xpAwarded.current = false
  }, [phase])

  useEffect(() => {
    if (phase === 'voting') advanceGuard.current = false
  }, [phase, roomState.currentRound])

  // ── Host: voting -> reveal, automatically once everyone has voted ──────
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

  // No countdown/hard-timeout — the host can see how many have voted and
  // ends the round manually via handleEndVoting() whenever they choose.

  async function advanceToReveal() {
    if (advanceGuard.current) return
    advanceGuard.current = true
    const tally = tallyVotes(actions)
    const winnerIds = resolveWinners(tally)
    const cumulative = { ...(roomState.cumulativeScores ?? {}) }
    for (const id of winnerIds) cumulative[id] = (cumulative[id] ?? 0) + 1
    await clearActions()
    await setState({
      phase: 'reveal',
      roundCount: roomState.roundCount,
      currentRound: roomState.currentRound,
      selectedTags: roomState.selectedTags,
      includeAdult: roomState.includeAdult,
      usedPromptIds: roomState.usedPromptIds,
      currentPrompt: roomState.currentPrompt,
      tally,
      winnerIds,
      cumulativeScores: cumulative,
    })
  }

  // Host-only manual override — end voting before everyone's in, e.g. if
  // someone's AFK. Same advance path as the auto early-close above.
  function handleEndVoting() {
    advanceToReveal()
  }

  // ── XP / stats / badge on results ───────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results' || !myId || xpAwarded.current) return
    xpAwarded.current = true
    const cumulative = roomState.cumulativeScores ?? {}
    const myScore = cumulative[myId] ?? 0
    const sorted = Object.entries(cumulative).sort((a, b) => b[1] - a[1])
    const isWinner = sorted.length > 0 && sorted[0][0] === myId

    awardXP(myScore, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('sabse-zyada-kaun', { won: isWinner, gamesPlayed: 1 })
    }
    if (isWinner) awardBadge(metadata.onlineBadge.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleStart({ selectedTags, includeAdult, roundCount }) {
    setStarting(true)
    const pool = filterPrompts(selectedTags, includeAdult)
    const prompt = pickRandomPrompt(pool, [])
    await clearActions()
    await setState({
      phase: 'voting',
      roundCount,
      currentRound: 1,
      selectedTags,
      includeAdult,
      usedPromptIds: prompt ? [prompt.id] : [],
      currentPrompt: prompt,
      cumulativeScores: {},
      phaseStartedAt: Date.now(),
    })
    setStarting(false)
  }

  function handleVote(targetPlayerId) {
    sendAction({ type: 'VOTE', payload: { targetPlayerId } })
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
    const pool = filterPrompts(roomState.selectedTags, roomState.includeAdult)
    const prompt = pickRandomPrompt(pool, roomState.usedPromptIds ?? [])
    await clearActions()
    await setState({
      phase: 'voting',
      roundCount: roomState.roundCount,
      currentRound: nextRound,
      selectedTags: roomState.selectedTags,
      includeAdult: roomState.includeAdult,
      usedPromptIds: prompt ? [...(roomState.usedPromptIds ?? []), prompt.id] : roomState.usedPromptIds,
      currentPrompt: prompt,
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
        isHost={isHost}
        minPlayers={metadata.minPlayers}
        players={players}
        onStart={handleStart}
        starting={starting}
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
        players={players}
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
        tally={roomState.tally ?? {}}
        winnerIds={roomState.winnerIds ?? []}
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
