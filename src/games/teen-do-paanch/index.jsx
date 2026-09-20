import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useTurnVibration } from '../../hooks/useTurnVibration'
import { useLang } from '../../store/LangContext'
import { shuffleDeck, parseCard } from '../../multiplayer/deck'
import { removeCardFromHand, addCardsToHand, sortHand } from '../../multiplayer/hand'
import { dealCards } from '../../multiplayer/deal'
import { resolveTrick, getLegalPlays } from '../../multiplayer/trick'
import { advanceTurn } from '../../multiplayer/turnManager'
import { CardTable } from '../../components/cards/CardTable'
import { HandWinnerOverlay } from '../../components/cards/HandWinnerOverlay'
import { LastHandButton } from '../../components/cards/LastHandButton'
import { TableScoreBar } from '../../components/cards/TableScoreBar'
import { SUIT_TEXT_CLASS } from '../../components/cards/suitIcons'
import { GameRulesPanel } from '../../components/GameRulesPanel'
import { TrumpCallScreen } from './TrumpCallScreen'
import { RoundRevealScreen } from './RoundRevealScreen'
import { ResultsScreen } from './ResultsScreen'
import {
  computeTargets,
  getCallerId,
  computeRoundScores,
  checkGameWinners,
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
    players,
    leaveSeat,
    claimSeat
  } = useOnlineRoom(code)

  const phase = roomState.phase || 'waiting'
  useTurnVibration(phase === 'playing' && roomState.turnOrder?.[roomState.currentIdx] === myId)
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
  }, [phase, roomState.roundNumber])

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
        currentHand: [],
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
    const remainingCards = removeCardFromHand(current.hands[actingPlayerId], cardId)
    const newHands = { ...current.hands, [actingPlayerId]: remainingCards }
    const newHand = [...current.currentHand, { playerId: actingPlayerId, card: cardId }]
    const newLedSuit = current.ledSuit ?? parseCard(cardId).suit

    if (newHand.length === current.turnOrder.length) {
      const winnerId = resolveTrick(newHand, newLedSuit, current.trumpRevealed ? current.trumpSuit : null)
      const newHandsWon = { ...current.handsWon, [winnerId]: (current.handsWon[winnerId] ?? 0) + 1 }

      // Keep all cards visible and reveal the winner for a beat before
      // clearing/advancing — otherwise the hand vanishes the instant the
      // last card lands, with no chance to see what happened.
      await clearActions()
      await persist({ hands: newHands, currentHand: newHand, handWinnerId: winnerId, lastHand: { cards: newHand, winnerId } })
      await new Promise(resolve => setTimeout(resolve, 1500))

      if (remainingCards.length === 0) {
        // Round complete — all 10 hands played.
        const roundScores = computeRoundScores(current.targets, newHandsWon)
        const gameScores = Object.fromEntries(
          current.turnOrder.map(id => [id, (current.gameScores[id] ?? 0) + roundScores[id]])
        )
        const winnerIds = checkGameWinners(gameScores)
        await persist({
          hands: newHands,
          handsWon: newHandsWon,
          currentHand: [],
          handWinnerId: null,
          ledSuit: null,
          gameScores,
          lastRoundResult: {
            roundNumber: current.roundNumber,
            targets: current.targets,
            handsWon: newHandsWon,
            roundScores,
            gameScoresAfter: gameScores,
            trumpSuit: current.trumpSuit,
            trumpMode: current.trumpMode,
            callerId: current.callerId,
            winnerIds
          },
          phase: 'round_reveal'
        })
        return
      }

      await persist({
        hands: newHands,
        handsWon: newHandsWon,
        currentHand: [],
        handWinnerId: null,
        ledSuit: null,
        currentIdx: current.turnOrder.indexOf(winnerId)
      })
      return
    }

    const turnState = advanceTurn({
      playerIds: current.turnOrder,
      currentIdx: current.currentIdx,
      round: current.roundNumber
    })
    await clearActions()
    await persist({
      hands: newHands,
      currentHand: newHand,
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
        roundNumber: 0,
        targets,
        callerId,
        trumpSuit: null,
        trumpMode: null,
        trumpRevealed: false,
        hands,
        remainingDeck: remaining,
        handsWon: zeroed,
        currentHand: [],
        handWinnerId: null,
        lastHand: null,
        ledSuit: null,
        currentIdx: null,
        gameScores: zeroed,
        lastRoundResult: null
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

  async function handleNextRound() {
    if (advancing) return
    setAdvancing(true)
    try {
      const current = roomStateRef.current
      if (current.lastRoundResult?.winnerIds) {
        await persist({ phase: 'results' })
        return
      }
      const nextRoundNumber = current.roundNumber + 1
      const deck = shuffleDeck(createReducedDeck())
      const { hands, remaining } = dealCards(deck, current.turnOrder, 5)
      const targets = computeTargets(current.turnOrder, nextRoundNumber)
      const callerId = getCallerId(targets)
      const zeroed = Object.fromEntries(current.turnOrder.map(id => [id, 0]))
      await clearActions()
      await persist({
        phase: 'calling_trump',
        roundNumber: nextRoundNumber,
        targets,
        callerId,
        trumpSuit: null,
        trumpMode: null,
        trumpRevealed: false,
        hands,
        remainingDeck: remaining,
        handsWon: zeroed,
        currentHand: [],
        handWinnerId: null,
        lastHand: null,
        ledSuit: null,
        currentIdx: null,
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
    const winnerIds = roomState.lastRoundResult?.winnerIds ?? []
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
    // Nothing should be tappable while a completed hand is still being
    // held on screen for review (currentIdx doesn't advance until the
    // hand-reveal pause finishes — see applyPlay).
    const isInteractive = isMyTurn && !roomState.handWinnerId
    const currentTurnName = players.find(p => p.id === roomState.turnOrder?.[roomState.currentIdx])?.name ?? 'player'
    const legalPlays = isInteractive ? getLegalPlays(myHand, roomState.ledSuit) : []
    const disabledCardIds = isInteractive ? myHand.filter(id => !legalPlays.includes(id)) : myHand
    const iAmCaller = myId === roomState.callerId
    const knowTrump = iAmCaller || roomState.trumpRevealed
    const highlightedCardIds = knowTrump ? myHand.filter(id => parseCard(id).suit === roomState.trumpSuit) : []
    const canReveal = isInteractive && roomState.trumpMode === 'hidden' && !roomState.trumpRevealed &&
      canRequestReveal(myHand, roomState.ledSuit)
    const centerCards = (roomState.currentHand ?? []).map(({ playerId, card }) => ({
      card,
      playerId,
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
        value: `${roomState.handsWon?.[id] ?? 0}/${roomState.targets?.[id] ?? '?'}`
      })),
      { label: 'Trump', value: knowTrump ? SUIT_LABEL[roomState.trumpSuit] : 'Hidden', valueClassName: knowTrump ? SUIT_TEXT_CLASS[roomState.trumpSuit] : undefined }
    ]

    const handWinnerId = roomState.handWinnerId
    const handWinnerName = handWinnerId ? (players.find(p => p.id === handWinnerId)?.name ?? 'Player') : null
    const centerSlot = handWinnerId ? (
      <HandWinnerOverlay
        centerCards={centerCards}
        handWinnerId={handWinnerId}
        handWinnerName={handWinnerName}
        accentColorClass="text-orchid"
      />
    ) : null

    return (
      <div className="flex flex-col gap-3 max-w-2xl w-full mx-auto pt-2 pb-6">
        <LastHandButton lastHand={roomState.lastHand} players={players} accent="orchid" />
        <TableScoreBar entries={scoreEntries} />
        <CardTable
          otherSeats={otherSeats}
          myHand={myHand}
          myIsActiveTurn={isMyTurn}
          centerCards={centerCards}
          centerSlot={centerSlot}
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
              ? `Waiting for ${currentTurnName} to play...`
              : roomState.ledSuit
                ? `Follow suit: ${SUIT_LABEL[roomState.ledSuit]}`
                : 'Lead any card'}
          </p>
        )}
      </div>
    )
  }

  if (phase === 'round_reveal') {
    const openSeats = room?.openSeats ?? []
    const isSpectator = (room?.spectators ?? []).some(p => p.id === myId)
    return (
      <RoundRevealScreen
        lastRoundResult={roomState.lastRoundResult}
        players={players}
        isHost={isHost}
        onNextRound={handleNextRound}
        advancing={advancing}
        seatManagement={{
          turnOrder: roomState.turnOrder ?? [],
          openSeats,
          myId,
          isSpectator,
          onLeaveSeat: leaveSeat,
          onClaimSeat: (seatPlayerId) => {
            // gameScores is player-id-keyed and needs remapping (the
            // running score belongs to the seat). callerId for the NEXT
            // round is always freshly recomputed from turnOrder in
            // handleNextRound (computeTargets + getCallerId), so it needs
            // no remap here — it'll already be correct once turnOrder is.
            const gameScores = { ...roomState.gameScores }
            if (seatPlayerId in gameScores) {
              gameScores[myId] = gameScores[seatPlayerId]
              delete gameScores[seatPlayerId]
            }
            claimSeat(seatPlayerId, {
              turnOrder: roomState.turnOrder.map(id => id === seatPlayerId ? myId : id),
              gameScores
            })
          }
        }}
      />
    )
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        players={players}
        gameScores={roomState.gameScores ?? {}}
        winnerIds={roomState.lastRoundResult?.winnerIds ?? []}
        myId={myId}
        isHost={isHost}
        onRematch={handleRematch}
        onHome={() => navigate('/')}
      />
    )
  }

  return null
}
