import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { assignBhed } from './roles'
import { tallyVotes, resolveWinners } from './voting'
import { CATEGORIES, filterWords, pickSecretWord, pickGuessOptions } from './words'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import { RoleRevealScreen } from './RoleRevealScreen'
import { ClueRoundScreen } from './ClueRoundScreen'
import { VotingScreen } from './VotingScreen'
import { RevealScreen } from './RevealScreen'
import { BhedGuessScreen } from './BhedGuessScreen'
import { ResultsScreen } from './ResultsScreen'
import metadata from './metadata'

const ROLE_REVEAL_TIMEOUT_MS = 8000

export default function Bhed({ code }) {
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

  const [starting, setStarting] = useState(false)
  const [ackSent, setAckSent] = useState(false)
  const [turnAdvancing, setTurnAdvancing] = useState(false)
  const [revealAdvancing, setRevealAdvancing] = useState(false)
  const [guessRevealing, setGuessRevealing] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState(Object.keys(CATEGORIES))

  const xpAwarded = useRef(false)
  const roleRevealGuard = useRef(false)
  const votingGuard = useRef(false)
  const roleAckCloseTimer = useRef(null)
  const voteCloseTimer = useRef(null)

  function persist(overrides) {
    return setState({ ...roomStateRef.current, ...overrides })
  }

  useEffect(() => {
    if (phase === 'waiting') xpAwarded.current = false
  }, [phase])

  useEffect(() => {
    if (phase === 'role_reveal') {
      setAckSent(false)
      roleRevealGuard.current = false
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'voting') votingGuard.current = false
  }, [phase])

  // ── Host: role_reveal -> clue_giving (all acked, early close) ────────────
  useEffect(() => {
    if (!isHost || phase !== 'role_reveal') return
    const acked = actions.filter(a => a.type === 'ROLE_ACK').length
    if (players.length > 0 && acked >= players.length) {
      if (roleAckCloseTimer.current) return
      roleAckCloseTimer.current = setTimeout(() => {
        roleAckCloseTimer.current = null
        advanceToClueGiving()
      }, 600)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase])

  // ── Host: role_reveal hard timeout ────────────────────────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'role_reveal') return
    const timer = setTimeout(() => advanceToClueGiving(), ROLE_REVEAL_TIMEOUT_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase])

  async function advanceToClueGiving() {
    if (roleRevealGuard.current) return
    roleRevealGuard.current = true
    await clearActions()
    await persist({
      phase: 'clue_giving',
      turnOrder: players.map(p => p.id),
      currentTurnIndex: 0
    })
  }

  // ── Host: voting -> reveal (everyone voted, early close) ──────────────────
  useEffect(() => {
    if (!isHost || phase !== 'voting') return
    const votes = actions.filter(a => a.type === 'VOTE').length
    if (players.length > 0 && votes >= players.length) {
      if (voteCloseTimer.current) return
      voteCloseTimer.current = setTimeout(() => {
        voteCloseTimer.current = null
        advanceToReveal()
      }, 600)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase])

  async function advanceToReveal() {
    if (votingGuard.current) return
    votingGuard.current = true
    const tally = tallyVotes(actions)
    const winners = resolveWinners(tally)
    const votedOutId = winners.length === 1 ? winners[0] : null
    const caught = votedOutId != null && votedOutId === roomStateRef.current.bhedId
    await clearActions()
    await persist({ phase: 'reveal', tally, votedOutId, caught })
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  function toggleCategory(key) {
    setSelectedCategories(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    )
  }

  async function handleStartGame() {
    setStarting(true)
    const bhedId = assignBhed(players.map(p => p.id))
    const pool = filterWords(selectedCategories.length ? selectedCategories : Object.keys(CATEGORIES))
    const secretWord = pickSecretWord(pool, [])
    try {
      await clearActions()
      await persist({
        phase: 'role_reveal',
        categories: selectedCategories,
        bhedId,
        secretWord,
        usedWordIds: secretWord ? [secretWord.id] : []
      })
    } finally {
      setStarting(false)
    }
  }

  function handleAck() {
    if (ackSent) return
    setAckSent(true)
    sendAction({ type: 'ROLE_ACK', payload: {} })
  }

  async function handleNextPlayer() {
    if (turnAdvancing) return
    setTurnAdvancing(true)
    try {
      await persist({ currentTurnIndex: (roomStateRef.current.currentTurnIndex ?? 0) + 1 })
    } finally {
      setTurnAdvancing(false)
    }
  }

  async function handleMoveToVoting() {
    if (turnAdvancing) return
    setTurnAdvancing(true)
    try {
      await clearActions()
      await persist({ phase: 'voting' })
    } finally {
      setTurnAdvancing(false)
    }
  }

  function handleVote(targetPlayerId) {
    sendAction({ type: 'VOTE', payload: { targetPlayerId } })
  }

  async function handleEndVoting() {
    await advanceToReveal()
  }

  async function handleContinueFromReveal() {
    if (revealAdvancing) return
    setRevealAdvancing(true)
    try {
      const current = roomStateRef.current
      await clearActions()
      if (current.caught) {
        const pool = filterWords(current.categories?.length ? current.categories : Object.keys(CATEGORIES))
        const guessOptions = pickGuessOptions(current.secretWord, pool, 5)
        await persist({ phase: 'bhed_guess', guessOptions })
      } else {
        const reason = current.votedOutId ? 'wrong_person' : 'tie'
        await persist({ phase: 'results', winnerTeam: 'bhed', reason })
      }
    } finally {
      setRevealAdvancing(false)
    }
  }

  function handleBhedGuess(wordId) {
    sendAction({ type: 'BHED_GUESS', payload: { wordId } })
  }

  async function handleRevealGuess() {
    if (guessRevealing) return
    setGuessRevealing(true)
    try {
      const current = roomStateRef.current
      const guessAction = actions.find(a => a.type === 'BHED_GUESS' && a.playerId === current.bhedId)
      const guessedId = guessAction?.payload?.wordId ?? null
      const correct = guessedId != null && guessedId === current.secretWord?.id
      await clearActions()
      await persist({
        phase: 'results',
        winnerTeam: correct ? 'bhed' : 'villagers',
        reason: correct ? 'guessed_correctly' : 'guessed_wrong',
        guessedId
      })
    } finally {
      setGuessRevealing(false)
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
    const amIBhed = myId === roomState.bhedId
    const winnerTeam = roomState.winnerTeam
    const isWinner = (amIBhed && winnerTeam === 'bhed') || (!amIBhed && winnerTeam === 'villagers')
    const myXP = winnerTeam === 'bhed' ? (amIBhed ? 100 : 10) : (amIBhed ? 10 : 50)

    awardXP(myXP, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('bhed', { won: isWinner, gamesPlayed: 1 })
    }
    if (amIBhed && winnerTeam === 'bhed') awardBadge(metadata.onlineBadge.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

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
      <div className="flex flex-col gap-4 max-w-lg w-full mx-auto pt-2">
        {isHost ? (
          <>
            <div>
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Word Categories</p>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => toggleCategory(key)}
                    className={`min-h-[44px] rounded-xl border-[1.5px] px-4 text-left font-semibold transition-colors ${
                      selectedCategories.includes(key)
                        ? 'bg-emerald text-onEmerald border-emerald'
                        : 'bg-surfaceElevated text-textPrimary border-border hover:border-emerald/50'
                    }`}
                  >
                    {label.en}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleStartGame}
              disabled={players.length < metadata.minPlayers || starting || selectedCategories.length === 0}
              className="min-h-[48px] rounded-xl bg-emerald text-onEmerald font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {starting ? 'Assigning roles...' : 'Start Game →'}
            </button>
          </>
        ) : (
          <p className="text-center text-textMuted text-sm">Waiting for host to start...</p>
        )}
      </div>
    )
  }

  if (phase === 'role_reveal') {
    const ackedCount = actions.filter(a => a.type === 'ROLE_ACK').length
    return (
      <RoleRevealScreen
        isBhed={myId === roomState.bhedId}
        secretWord={roomState.secretWord}
        ackSent={ackSent}
        onAck={handleAck}
        ackedCount={ackedCount}
        totalPlayers={players.length}
      />
    )
  }

  if (phase === 'clue_giving') {
    return (
      <ClueRoundScreen
        players={players}
        turnOrder={roomState.turnOrder ?? []}
        currentTurnIndex={roomState.currentTurnIndex ?? 0}
        isHost={isHost}
        myId={myId}
        onNextPlayer={handleNextPlayer}
        onMoveToVoting={handleMoveToVoting}
        advancing={turnAdvancing}
      />
    )
  }

  if (phase === 'voting') {
    const myVoteSent = actions.some(a => a.type === 'VOTE' && a.playerId === myId)
    const votesIn = actions.filter(a => a.type === 'VOTE').length
    return (
      <VotingScreen
        players={players}
        myId={myId}
        votesIn={votesIn}
        totalPlayers={players.length}
        onVote={handleVote}
        voted={myVoteSent}
        isHost={isHost}
        onEndVoting={handleEndVoting}
      />
    )
  }

  if (phase === 'reveal') {
    return (
      <RevealScreen
        tally={roomState.tally ?? {}}
        votedOutId={roomState.votedOutId}
        players={players}
        actualBhedId={roomState.bhedId}
        caught={roomState.caught}
        isHost={isHost}
        onContinue={handleContinueFromReveal}
      />
    )
  }

  if (phase === 'bhed_guess') {
    const isBhed = myId === roomState.bhedId
    const myGuessSent = actions.some(a => a.type === 'BHED_GUESS' && a.playerId === myId)
    const hasGuess = actions.some(a => a.type === 'BHED_GUESS' && a.playerId === roomState.bhedId)
    return (
      <BhedGuessScreen
        isBhed={isBhed}
        guessOptions={roomState.guessOptions ?? []}
        onGuess={handleBhedGuess}
        guessed={myGuessSent}
        isHost={isHost}
        onRevealGuess={handleRevealGuess}
        revealing={guessRevealing}
        hasGuess={hasGuess}
      />
    )
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        winnerTeam={roomState.winnerTeam}
        bhedPlayer={players.find(p => p.id === roomState.bhedId)}
        secretWord={roomState.secretWord}
        reason={roomState.reason}
        isHost={isHost}
        onRematch={handleRematch}
        onHome={() => navigate('/')}
      />
    )
  }

  return null
}
