import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useLang } from '../../store/LangContext'
import { shuffleDeck } from '../../multiplayer/deck'
import { dealCards } from '../../multiplayer/deal'
import { GameRulesPanel } from '../../components/GameRulesPanel'
import { PassingScreen } from './PassingScreen'
import { ReactingScreen } from './ReactingScreen'
import { RoundRevealScreen } from './RoundRevealScreen'
import { ResultsScreen } from './ResultsScreen'
import {
  buildDonkeyDeck,
  hasFourOfAKind,
  resolvePassRound,
  nextLetters,
  isEliminated,
  resolveDonkeyRound
} from './donkeyLogic'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import metadata from './metadata'

const PASS_TIMEOUT_MS = 3000
const REACT_TIMEOUT_MS = 8000

function buildRoundStartFields(activePlayerIds) {
  const deck = shuffleDeck(buildDonkeyDeck(activePlayerIds.length))
  const { hands } = dealCards(deck, activePlayerIds, 4)
  return {
    turnOrder: activePlayerIds,
    hands,
    phase: 'passing',
    passRoundIndex: 0,
    passDeadline: Date.now() + PASS_TIMEOUT_MS,
    signaledPlayerIds: [],
    lastRoundResult: null
  }
}

export default function Donkey({ code }) {
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
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  const [starting, setStarting] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [hasChosen, setHasChosen] = useState(false)
  const [hasReacted, setHasReacted] = useState(false)

  const xpAwarded = useRef(false)
  const passResolveGuard = useRef(false)
  const reactResolveGuard = useRef(false)
  const passTimerRef = useRef(null)
  const reactTimerRef = useRef(null)

  function persist(overrides) {
    return setState({ ...roomStateRef.current, ...overrides })
  }

  useEffect(() => {
    if (phase === 'waiting') xpAwarded.current = false
  }, [phase])

  useEffect(() => {
    setHasChosen(false)
  }, [phase, roomState.passRoundIndex])

  useEffect(() => {
    setHasReacted(false)
  }, [phase, roomState.reactDeadline])

  // ── Host: passing — early-resolve once everyone has chosen ───────────────
  useEffect(() => {
    if (!isHost || phase !== 'passing') return
    const submittedIds = new Set(actions.filter(a => a.type === 'PASS_CARD').map(a => a.playerId))
    const allSubmitted = (roomState.turnOrder ?? []).every(id => submittedIds.has(id))
    if (allSubmitted) resolvePassRoundIfNeeded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase])

  // ── Host: passing — hard timeout ──────────────────────────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'passing') return
    if (passTimerRef.current) clearTimeout(passTimerRef.current)
    const msLeft = (roomState.passDeadline ?? Date.now()) - Date.now()
    passTimerRef.current = setTimeout(() => resolvePassRoundIfNeeded(), Math.max(msLeft, 0) + 600)
    return () => clearTimeout(passTimerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, roomState.passRoundIndex, roomState.passDeadline])

  useEffect(() => {
    if (phase === 'passing') passResolveGuard.current = false
  }, [phase, roomState.passRoundIndex])

  async function resolvePassRoundIfNeeded() {
    if (passResolveGuard.current) return
    passResolveGuard.current = true
    const current = roomStateRef.current
    const chosenCards = {}
    for (const id of current.turnOrder) {
      const action = actionsRef.current.find(a => a.playerId === id && a.type === 'PASS_CARD')
      chosenCards[id] = action ? action.payload.cardId : current.hands[id][Math.floor(Math.random() * current.hands[id].length)]
    }
    const newHands = resolvePassRound(current.hands, current.turnOrder, chosenCards)
    const signaled = current.turnOrder.filter(id => hasFourOfAKind(newHands[id]))

    await clearActions()
    if (signaled.length > 0 && signaled.length < current.turnOrder.length) {
      await persist({
        hands: newHands,
        signaledPlayerIds: signaled,
        phase: 'reacting',
        reactDeadline: Date.now() + REACT_TIMEOUT_MS
      })
    } else {
      // Either nobody signaled, or (the vanishingly rare case) EVERYONE
      // signaled in the same pass-round, leaving nobody left to react —
      // either way, just deal into another pass-round.
      await persist({
        hands: newHands,
        passRoundIndex: current.passRoundIndex + 1,
        passDeadline: Date.now() + PASS_TIMEOUT_MS
      })
    }
  }

  // ── Host: reacting — early-resolve once everyone expected has reacted ────
  useEffect(() => {
    if (!isHost || phase !== 'reacting') return
    const expectedReactors = (roomState.turnOrder ?? []).filter(id => !(roomState.signaledPlayerIds ?? []).includes(id))
    const reactedIds = new Set(actions.filter(a => a.type === 'REACT').map(a => a.playerId))
    const allReacted = expectedReactors.length > 0 && expectedReactors.every(id => reactedIds.has(id))
    if (allReacted) resolveReactingIfNeeded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase])

  // ── Host: reacting — hard timeout ─────────────────────────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'reacting') return
    if (reactTimerRef.current) clearTimeout(reactTimerRef.current)
    const msLeft = (roomState.reactDeadline ?? Date.now()) - Date.now()
    reactTimerRef.current = setTimeout(() => resolveReactingIfNeeded(), Math.max(msLeft, 0) + 600)
    return () => clearTimeout(reactTimerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, roomState.reactDeadline])

  useEffect(() => {
    if (phase === 'reacting') reactResolveGuard.current = false
  }, [phase, roomState.reactDeadline])

  async function resolveReactingIfNeeded() {
    if (reactResolveGuard.current) return
    reactResolveGuard.current = true
    // A short buffer for server timestamps to fully resolve before relying
    // on them to rank reactions — without this, an action written on THIS
    // same client can still show a pending (unresolved) createdAt when
    // read back immediately, which would misrank it as having happened at
    // time zero instead of its real, later time.
    await new Promise(resolve => setTimeout(resolve, 600))
    const current = roomStateRef.current
    const expectedReactors = current.turnOrder.filter(id => !current.signaledPlayerIds.includes(id))
    const reactActions = actionsRef.current.filter(a => a.type === 'REACT')
    const donkeyId = resolveDonkeyRound(reactActions, expectedReactors)

    const newLetters = { ...current.letters, [donkeyId]: nextLetters(current.letters[donkeyId]) }
    const justEliminated = isEliminated(newLetters[donkeyId])
    const newEliminated = justEliminated
      ? [...current.eliminatedPlayerIds, donkeyId]
      : current.eliminatedPlayerIds
    const remaining = current.allPlayerIds.filter(id => !newEliminated.includes(id))
    const matchWinnerId = remaining.length === 1 ? remaining[0] : null

    await clearActions()
    await persist({
      letters: newLetters,
      eliminatedPlayerIds: newEliminated,
      matchWinnerId,
      lastRoundResult: {
        roundNumber: current.roundNumber,
        signaledPlayerIds: current.signaledPlayerIds,
        donkeyId,
        lettersAfter: newLetters[donkeyId],
        eliminated: justEliminated,
        matchWinnerId
      },
      phase: 'round_reveal'
    })
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleStartMatch() {
    setStarting(true)
    try {
      const allPlayerIds = players.map(p => p.id)
      await clearActions()
      await persist({
        allPlayerIds,
        eliminatedPlayerIds: [],
        letters: Object.fromEntries(allPlayerIds.map(id => [id, ''])),
        roundNumber: 0,
        matchWinnerId: null,
        ...buildRoundStartFields(allPlayerIds)
      })
    } finally {
      setStarting(false)
    }
  }

  function handleChooseCard(cardId) {
    if (hasChosen) return
    setHasChosen(true)
    sendAction({ type: 'PASS_CARD', payload: { cardId } })
  }

  function handleReact() {
    if (hasReacted) return
    setHasReacted(true)
    sendAction({ type: 'REACT', payload: {} })
  }

  async function handleNextRound() {
    if (advancing) return
    setAdvancing(true)
    try {
      const current = roomStateRef.current
      if (current.matchWinnerId) {
        await persist({ phase: 'results' })
        return
      }
      const remaining = current.allPlayerIds.filter(id => !current.eliminatedPlayerIds.includes(id))
      await clearActions()
      await persist({
        roundNumber: current.roundNumber + 1,
        ...buildRoundStartFields(remaining)
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
    const isWinner = myId === roomState.matchWinnerId
    awardXP(isWinner ? 100 : 20, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('donkey', { won: isWinner, gamesPlayed: 1 })
    }
    if (isWinner) awardBadge(metadata.onlineBadge.id)
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
        <GameRulesPanel
          title={metadata.title[lang]}
          rules={metadata.rules[lang]}
          tutorialSlides={metadata.tutorial[lang]}
          accent="amber"
          phase={phase}
        />
        {isHost ? (
          <button
            onClick={handleStartMatch}
            disabled={players.length < metadata.minPlayers || players.length > metadata.maxPlayers || starting}
            className="min-h-[48px] rounded-xl bg-amber text-onAmber font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {starting ? 'Dealing...' : 'Start Game →'}
          </button>
        ) : (
          <p className="text-center text-textMuted text-sm">Waiting for host to start...</p>
        )}
      </div>
    )
  }

  const iAmEliminated = (roomState.eliminatedPlayerIds ?? []).includes(myId)
  if (iAmEliminated && (phase === 'passing' || phase === 'reacting')) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 gap-2">
        <p className="text-lg font-bold text-textPrimary">You've been eliminated</p>
        <p className="text-sm text-textMuted">Spectating the rest of the match…</p>
      </div>
    )
  }

  if (phase === 'passing') {
    const myHand = roomState.hands?.[myId] ?? []
    const chosenCount = (roomState.turnOrder ?? []).filter(id =>
      actions.some(a => a.playerId === id && a.type === 'PASS_CARD')
    ).length
    return (
      <PassingScreen
        myHand={myHand}
        deadline={roomState.passDeadline}
        chosenCount={chosenCount}
        totalCount={(roomState.turnOrder ?? []).length}
        hasChosen={hasChosen}
        onChoose={handleChooseCard}
      />
    )
  }

  if (phase === 'reacting') {
    const isSignaled = (roomState.signaledPlayerIds ?? []).includes(myId)
    return (
      <ReactingScreen
        players={players}
        myId={myId}
        signaledPlayerIds={roomState.signaledPlayerIds ?? []}
        deadline={roomState.reactDeadline}
        isSignaled={isSignaled}
        hasReacted={hasReacted}
        onReact={handleReact}
      />
    )
  }

  if (phase === 'round_reveal') {
    return (
      <RoundRevealScreen
        lastRoundResult={roomState.lastRoundResult}
        players={players}
        isHost={isHost}
        onNextRound={handleNextRound}
        advancing={advancing}
      />
    )
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        players={players}
        eliminatedPlayerIds={roomState.eliminatedPlayerIds ?? []}
        matchWinnerId={roomState.matchWinnerId}
        myId={myId}
        isHost={isHost}
        onRematch={handleRematch}
        onHome={() => navigate('/')}
      />
    )
  }

  return null
}
