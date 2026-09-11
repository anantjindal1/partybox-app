import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useLang } from '../../store/LangContext'
import { shuffleDeck, parseCard } from '../../multiplayer/deck'
import { removeCardFromHand, addCardsToHand, sortHand } from '../../multiplayer/hand'
import { dealCards } from '../../multiplayer/deal'
import { resolveTrick, getLegalPlays } from '../../multiplayer/trick'
import { advanceTurn } from '../../multiplayer/turnManager'
import { CardTable } from '../../components/cards/CardTable'
import { TableScoreBar } from '../../components/cards/TableScoreBar'
import { GameRulesPanel } from '../../components/GameRulesPanel'
import { TrumpCallScreen } from './TrumpCallScreen'
import { HandRevealScreen } from './HandRevealScreen'
import { ResultsScreen } from './ResultsScreen'
import {
  computeTargets,
  getCallerId,
  computeHandScores,
  checkMatchWinners,
  canRequestReveal,
  createReducedDeck
} from './teenDoPaanchLogic'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import metadata from './metadata'

const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }

export default function TeenDoPaanch({ code }) {
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
  const [callSubmitted, setCallSubmitted] = useState(false)

  const xpAwarded = useRef(false)
  const trumpGuard = useRef(false)
  const processingRef = useRef(false)

  function persist(overrides) {
    return setState({ ...roomStateRef.current, ...overrides })
  }

  useEffect(() => {
    if (phase === 'waiting') xpAwarded.current = false
  }, [phase])

  useEffect(() => {
    if (phase === 'calling_trump') {
      setCallSubmitted(false)
      trumpGuard.current = false
    }
  }, [phase, roomState.handNumber])

  // ── Host: calling_trump -> playing, once the caller has called ──────────
  useEffect(() => {
    if (!isHost || phase !== 'calling_trump' || trumpGuard.current) return
    const action = actions.find(a => a.playerId === roomState.callerId && a.type === 'CALL_TRUMP')
    if (!action) return
    trumpGuard.current = true
    ;(async () => {
      const current = roomStateRef.current
      const { hands: secondDeal } = dealCards(current.remainingDeck, current.turnOrder, 5)
      const mergedHands = Object.fromEntries(
        current.turnOrder.map(id => [id, addCardsToHand(current.hands[id], secondDeal[id])])
      )
      const callerIdx = current.turnOrder.indexOf(current.callerId)
      await clearActions()
      await persist({
        phase: 'playing',
        trumpSuit: action.payload.suit,
        trumpMode: action.payload.mode,
        trumpRevealed: action.payload.mode === 'declared',
        hands: mergedHands,
        remainingDeck: null,
        currentIdx: callerIdx,
        currentTrick: [],
        ledSuit: null
      })
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase])

  // ── Host: process the current turn-holder's reveal or play ──────────────
  useEffect(() => {
    if (!isHost || phase !== 'playing' || processingRef.current) return
    const current = roomState.turnOrder?.[roomState.currentIdx]
    const action = actions.find(a => a.playerId === current && (a.type === 'PLAY' || a.type === 'REVEAL_TRUMP'))
    if (!action) return
    processingRef.current = true
    ;(async () => {
      if (action.type === 'REVEAL_TRUMP') await applyReveal()
      else await applyPlay(action.payload.cardId)
      processingRef.current = false
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.currentIdx])

  async function applyReveal() {
    await clearActions()
    await persist({ trumpRevealed: true })
  }

  async function applyPlay(cardId) {
    const current = roomStateRef.current
    const actingPlayerId = current.turnOrder[current.currentIdx]
    const newHand = removeCardFromHand(current.hands[actingPlayerId], cardId)
    const newHands = { ...current.hands, [actingPlayerId]: newHand }
    const newTrick = [...current.currentTrick, { playerId: actingPlayerId, card: cardId }]
    const newLedSuit = current.ledSuit ?? parseCard(cardId).suit

    if (newTrick.length === current.turnOrder.length) {
      const winnerId = resolveTrick(newTrick, newLedSuit, current.trumpRevealed ? current.trumpSuit : null)
      const newTricksWon = { ...current.tricksWon, [winnerId]: (current.tricksWon[winnerId] ?? 0) + 1 }

      if (newHand.length === 0) {
        // Hand complete — all 10 tricks played.
        const handScores = computeHandScores(current.targets, newTricksWon)
        const matchScores = Object.fromEntries(
          current.turnOrder.map(id => [id, (current.matchScores[id] ?? 0) + handScores[id]])
        )
        const winnerIds = checkMatchWinners(matchScores)
        await clearActions()
        await persist({
          hands: newHands,
          tricksWon: newTricksWon,
          currentTrick: [],
          ledSuit: null,
          matchScores,
          lastHandResult: {
            handNumber: current.handNumber,
            targets: current.targets,
            tricksWon: newTricksWon,
            handScores,
            matchScoresAfter: matchScores,
            trumpSuit: current.trumpSuit,
            trumpMode: current.trumpMode,
            callerId: current.callerId,
            winnerIds
          },
          phase: 'hand_reveal'
        })
        return
      }

      await clearActions()
      await persist({
        hands: newHands,
        tricksWon: newTricksWon,
        currentTrick: [],
        ledSuit: null,
        currentIdx: current.turnOrder.indexOf(winnerId)
      })
      return
    }

    const turnState = advanceTurn({
      playerIds: current.turnOrder,
      currentIdx: current.currentIdx,
      round: current.handNumber
    })
    await clearActions()
    await persist({
      hands: newHands,
      currentTrick: newTrick,
      ledSuit: newLedSuit,
      currentIdx: turnState.currentIdx
    })
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleStartGame() {
    setStarting(true)
    try {
      const playerIds = players.map(p => p.id)
      const deck = shuffleDeck(createReducedDeck())
      const { hands, remaining } = dealCards(deck, playerIds, 5)
      const targets = computeTargets(playerIds, 0)
      const callerId = getCallerId(targets)
      const zeroed = Object.fromEntries(playerIds.map(id => [id, 0]))
      await clearActions()
      await persist({
        phase: 'calling_trump',
        turnOrder: playerIds,
        handNumber: 0,
        targets,
        callerId,
        trumpSuit: null,
        trumpMode: null,
        trumpRevealed: false,
        hands,
        remainingDeck: remaining,
        tricksWon: zeroed,
        currentTrick: [],
        ledSuit: null,
        currentIdx: null,
        matchScores: zeroed,
        lastHandResult: null
      })
    } finally {
      setStarting(false)
    }
  }

  function handleCallTrump(suit, mode) {
    if (callSubmitted) return
    setCallSubmitted(true)
    sendAction({ type: 'CALL_TRUMP', payload: { suit, mode } })
  }

  function handlePlayCard(cardId) {
    sendAction({ type: 'PLAY', payload: { cardId } })
  }

  function handleRevealTrump() {
    sendAction({ type: 'REVEAL_TRUMP', payload: {} })
  }

  async function handleNextHand() {
    if (advancing) return
    setAdvancing(true)
    try {
      const current = roomStateRef.current
      if (current.lastHandResult?.winnerIds) {
        await persist({ phase: 'results' })
        return
      }
      const nextHandNumber = current.handNumber + 1
      const deck = shuffleDeck(createReducedDeck())
      const { hands, remaining } = dealCards(deck, current.turnOrder, 5)
      const targets = computeTargets(current.turnOrder, nextHandNumber)
      const callerId = getCallerId(targets)
      const zeroed = Object.fromEntries(current.turnOrder.map(id => [id, 0]))
      await clearActions()
      await persist({
        phase: 'calling_trump',
        handNumber: nextHandNumber,
        targets,
        callerId,
        trumpSuit: null,
        trumpMode: null,
        trumpRevealed: false,
        hands,
        remainingDeck: remaining,
        tricksWon: zeroed,
        currentTrick: [],
        ledSuit: null,
        currentIdx: null,
        lastHandResult: null
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
    const winnerIds = roomState.lastHandResult?.winnerIds ?? []
    const isWinner = winnerIds.includes(myId)
    awardXP(isWinner ? 100 : 20, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('teen-do-paanch', { won: isWinner, gamesPlayed: 1 })
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
          accent="orchid"
          phase={phase}
        />
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={players.length !== 3 || starting}
            className="min-h-[48px] rounded-xl bg-orchid text-onOrchid font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {starting ? 'Dealing...' : players.length < 3 ? `Waiting for players (${players.length}/3)` : 'Start Game →'}
          </button>
        ) : (
          <p className="text-center text-textMuted text-sm">Waiting for host to start...</p>
        )}
      </div>
    )
  }

  if (phase === 'calling_trump') {
    const isCaller = myId === roomState.callerId
    const callerName = players.find(p => p.id === roomState.callerId)?.name ?? 'Player'
    const myHand = sortHand(roomState.hands?.[myId] ?? [])
    return (
      <TrumpCallScreen
        isCaller={isCaller}
        callerName={callerName}
        myHand={myHand}
        onCall={handleCallTrump}
      />
    )
  }

  if (phase === 'playing') {
    const myHand = sortHand(roomState.hands?.[myId] ?? [])
    const isMyTurn = roomState.turnOrder?.[roomState.currentIdx] === myId
    const legalPlays = isMyTurn ? getLegalPlays(myHand, roomState.ledSuit) : []
    const disabledCardIds = isMyTurn ? myHand.filter(id => !legalPlays.includes(id)) : myHand
    const iAmCaller = myId === roomState.callerId
    const knowTrump = iAmCaller || roomState.trumpRevealed
    const highlightedCardIds = knowTrump ? myHand.filter(id => parseCard(id).suit === roomState.trumpSuit) : []
    const canReveal = isMyTurn && roomState.trumpMode === 'hidden' && !roomState.trumpRevealed &&
      canRequestReveal(myHand, roomState.ledSuit)
    const centerCards = (roomState.currentTrick ?? []).map(({ playerId, card }) => ({
      card,
      playerName: players.find(p => p.id === playerId)?.name
    }))
    const otherSeats = players
      .filter(p => p.id !== myId)
      .map(p => ({
        player: p,
        cardCount: roomState.hands?.[p.id]?.length ?? 0,
        isActiveTurn: roomState.turnOrder?.[roomState.currentIdx] === p.id
      }))

    const scoreEntries = [
      ...(roomState.turnOrder ?? []).map(id => ({
        label: players.find(p => p.id === id)?.name ?? 'Player',
        value: `${roomState.tricksWon?.[id] ?? 0}/${roomState.targets?.[id] ?? '?'}`
      })),
      { label: 'Trump', value: knowTrump ? SUIT_LABEL[roomState.trumpSuit] : 'Hidden' }
    ]

    return (
      <div className="flex flex-col gap-3 max-w-2xl w-full mx-auto pt-2 pb-6">
        <TableScoreBar entries={scoreEntries} />
        <CardTable
          otherSeats={otherSeats}
          myHand={myHand}
          myIsActiveTurn={isMyTurn}
          centerCards={centerCards}
          disabledCardIds={disabledCardIds}
          highlightedCardIds={highlightedCardIds}
          onCardTap={handlePlayCard}
          accent="orchid"
        />
        {canReveal ? (
          <button
            onClick={handleRevealTrump}
            className="min-h-[44px] rounded-xl bg-orchid text-onOrchid font-bold"
          >
            Can't follow suit — Reveal Trump →
          </button>
        ) : (
          <p className="text-center text-textMuted text-sm py-2">
            {!isMyTurn
              ? 'Waiting for your turn...'
              : roomState.ledSuit
                ? `Follow suit: ${SUIT_LABEL[roomState.ledSuit]}`
                : 'Lead any card'}
          </p>
        )}
      </div>
    )
  }

  if (phase === 'hand_reveal') {
    return (
      <HandRevealScreen
        lastHandResult={roomState.lastHandResult}
        players={players}
        isHost={isHost}
        onNextHand={handleNextHand}
        advancing={advancing}
      />
    )
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        players={players}
        matchScores={roomState.matchScores ?? {}}
        winnerIds={roomState.lastHandResult?.winnerIds ?? []}
        myId={myId}
        isHost={isHost}
        onRematch={handleRematch}
        onHome={() => navigate('/')}
      />
    )
  }

  return null
}
