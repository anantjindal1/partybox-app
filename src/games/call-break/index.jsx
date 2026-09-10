import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { createDeck, shuffleDeck, parseCard } from '../../multiplayer/deck'
import { removeCardFromHand, sortHand } from '../../multiplayer/hand'
import { dealCards } from '../../multiplayer/deal'
import { resolveTrick, getLegalPlays } from '../../multiplayer/trick'
import { advanceTurn } from '../../multiplayer/turnManager'
import { CardTable } from '../../components/cards/CardTable'
import { BiddingScreen } from './BiddingScreen'
import { RoundRevealScreen } from './RoundRevealScreen'
import { ResultsScreen } from './ResultsScreen'
import { computeRoundResults, addToCumulative } from './scoring'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import metadata from './metadata'

const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }
const TOTAL_ROUNDS = 5

export default function CallBreak({ code }) {
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
  const [advancing, setAdvancing] = useState(false)
  const [bidSubmitted, setBidSubmitted] = useState(false)

  const xpAwarded = useRef(false)
  const biddingGuard = useRef(false)
  const bidCloseTimer = useRef(null)

  function persist(overrides) {
    return setState({ ...roomStateRef.current, ...overrides })
  }

  useEffect(() => {
    if (phase === 'waiting') xpAwarded.current = false
  }, [phase])

  useEffect(() => {
    if (phase === 'bidding') {
      setBidSubmitted(false)
      biddingGuard.current = false
    }
  }, [phase, roomState.roundNumber])

  // ── Host: bidding -> playing, once all 4 have bid ───────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'bidding') return
    const bidCount = actions.filter(a => a.type === 'BID').length
    if (players.length > 0 && bidCount >= players.length) {
      if (bidCloseTimer.current) return
      bidCloseTimer.current = setTimeout(() => {
        bidCloseTimer.current = null
        advanceFromBidding()
      }, 600)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.roundNumber])

  async function advanceFromBidding() {
    if (biddingGuard.current) return
    biddingGuard.current = true
    const current = roomStateRef.current
    const bids = Object.fromEntries(
      actions.filter(a => a.type === 'BID').map(a => [a.playerId, a.payload.bid])
    )
    await clearActions()
    await persist({
      phase: 'playing',
      bids,
      currentIdx: current.leaderIdx,
      currentTrick: [],
      ledSuit: null,
      tricksWon: Object.fromEntries(current.turnOrder.map(id => [id, 0]))
    })
  }

  // ── Host: process the current turn-holder's play ─────────────────────────
  const processingRef = useRef(false)
  useEffect(() => {
    if (!isHost || phase !== 'playing' || processingRef.current) return
    const current = roomState.turnOrder?.[roomState.currentIdx]
    const action = actions.find(a => a.playerId === current && a.type === 'PLAY')
    if (!action) return
    processingRef.current = true
    ;(async () => {
      await applyPlay(action.payload.cardId)
      processingRef.current = false
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.currentIdx])

  async function applyPlay(cardId) {
    const current = roomStateRef.current
    const actingPlayerId = current.turnOrder[current.currentIdx]
    const newHand = removeCardFromHand(current.hands[actingPlayerId], cardId)
    const newHands = { ...current.hands, [actingPlayerId]: newHand }
    const newTrick = [...current.currentTrick, { playerId: actingPlayerId, card: cardId }]
    const newLedSuit = current.ledSuit ?? parseCard(cardId).suit

    if (newTrick.length === current.turnOrder.length) {
      const winnerId = resolveTrick(newTrick, newLedSuit, 'spades')
      const newTricksWon = { ...current.tricksWon, [winnerId]: (current.tricksWon[winnerId] ?? 0) + 1 }

      if (newHand.length === 0) {
        // Round complete — every hand is always the same length at any
        // point in a round, so the acting player's hand hitting 0 means
        // everyone's does.
        const results = computeRoundResults(current.turnOrder, current.bids, newTricksWon)
        const cumulativeScores = addToCumulative(current.cumulativeScores, results)
        await clearActions()
        await persist({
          hands: newHands,
          tricksWon: newTricksWon,
          currentTrick: [],
          ledSuit: null,
          cumulativeScores,
          lastRoundResult: {
            roundNumber: current.roundNumber,
            perPlayer: Object.fromEntries(
              current.turnOrder.map(id => [id, {
                bid: current.bids[id],
                tricksWon: newTricksWon[id],
                scoreDelta: results[id],
                cumulativeAfter: cumulativeScores[id]
              }])
            )
          },
          phase: 'round_reveal'
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

    // Trick not complete — plain seat-advance. advanceTurn's own `round`
    // field is deliberately discarded, not persisted: Call Break already
    // owns a separate, semantically different `roundNumber`.
    const turnState = advanceTurn({
      playerIds: current.turnOrder,
      currentIdx: current.currentIdx,
      round: current.roundNumber
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
      const deck = shuffleDeck(createDeck())
      const playerIds = players.map(p => p.id)
      const { hands } = dealCards(deck, playerIds, 13)
      const zeroed = Object.fromEntries(playerIds.map(id => [id, 0]))
      await clearActions()
      await persist({
        phase: 'bidding',
        turnOrder: playerIds,
        roundNumber: 1,
        leaderIdx: 0,
        bids: {},
        tricksWon: zeroed,
        hands,
        currentTrick: [],
        ledSuit: null,
        cumulativeScores: zeroed,
        lastRoundResult: null
      })
    } finally {
      setStarting(false)
    }
  }

  function handleBid(bid) {
    if (bidSubmitted) return
    setBidSubmitted(true)
    sendAction({ type: 'BID', payload: { bid } })
  }

  function handlePlayCard(cardId) {
    sendAction({ type: 'PLAY', payload: { cardId } })
  }

  async function handleNextRound() {
    if (advancing) return
    setAdvancing(true)
    try {
      const current = roomStateRef.current
      const nextRound = current.roundNumber + 1
      if (nextRound > TOTAL_ROUNDS) {
        await persist({ phase: 'results' })
        return
      }
      const deck = shuffleDeck(createDeck())
      const { hands } = dealCards(deck, current.turnOrder, 13)
      const zeroed = Object.fromEntries(current.turnOrder.map(id => [id, 0]))
      await clearActions()
      await persist({
        phase: 'bidding',
        roundNumber: nextRound,
        leaderIdx: (nextRound - 1) % current.turnOrder.length,
        bids: {},
        tricksWon: zeroed,
        hands,
        currentTrick: [],
        ledSuit: null,
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

  // ── XP / stats / badge on results — flat constants, never the raw score,
  // since cumulativeScores can be negative and awardXP/saveProfile never
  // clamp a profile's XP floor. ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results' || !myId || xpAwarded.current) return
    xpAwarded.current = true
    const cumulative = roomState.cumulativeScores ?? {}
    const maxScore = Math.max(...players.map(p => cumulative[p.id] ?? 0))
    const isWinner = (cumulative[myId] ?? 0) === maxScore
    awardXP(isWinner ? 100 : 20, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('call-break', { won: isWinner, gamesPlayed: 1 })
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
    const roomFull = players.length > 4
    return (
      <div className="flex flex-col gap-4 max-w-lg w-full mx-auto pt-2">
        {roomFull && (
          <p className="text-center text-error text-sm">
            Room full (4/4) — ask the host to remove a player to start.
          </p>
        )}
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={players.length !== 4 || starting}
            className="min-h-[48px] rounded-xl bg-turquoise text-onTurquoise font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {starting ? 'Dealing...' : players.length < 4 ? `Waiting for players (${players.length}/4)` : 'Start Game →'}
          </button>
        ) : (
          <p className="text-center text-textMuted text-sm">Waiting for host to start...</p>
        )}
      </div>
    )
  }

  if (phase === 'bidding') {
    const bidsIn = actions.filter(a => a.type === 'BID').length
    return (
      <BiddingScreen
        roundNumber={roomState.roundNumber}
        bidsIn={bidsIn}
        totalPlayers={players.length}
        onSubmit={handleBid}
        submitted={bidSubmitted}
      />
    )
  }

  if (phase === 'playing') {
    const myHand = sortHand(roomState.hands?.[myId] ?? [])
    const isMyTurn = roomState.turnOrder?.[roomState.currentIdx] === myId
    const legalPlays = isMyTurn ? getLegalPlays(myHand, roomState.ledSuit) : []
    const disabledCardIds = isMyTurn ? myHand.filter(id => !legalPlays.includes(id)) : myHand
    const highlightedCardIds = myHand.filter(id => parseCard(id).suit === 'spades')
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

    return (
      <div className="flex flex-col gap-3 max-w-2xl w-full mx-auto pt-2 pb-6">
        <p className="text-center text-textMuted text-xs uppercase tracking-wider">
          Round {roomState.roundNumber} of {TOTAL_ROUNDS} — your bid: {roomState.bids?.[myId]}
        </p>
        <CardTable
          otherSeats={otherSeats}
          myHand={myHand}
          myIsActiveTurn={isMyTurn}
          centerCards={centerCards}
          disabledCardIds={disabledCardIds}
          highlightedCardIds={highlightedCardIds}
          onCardTap={handlePlayCard}
          accent="turquoise"
        />
        <p className="text-center text-textMuted text-sm py-2">
          {!isMyTurn
            ? 'Waiting for your turn...'
            : roomState.ledSuit
              ? `Follow suit: ${SUIT_LABEL[roomState.ledSuit]}`
              : 'Lead any card'}
        </p>
      </div>
    )
  }

  if (phase === 'round_reveal') {
    return (
      <RoundRevealScreen
        lastRoundResult={roomState.lastRoundResult}
        players={players}
        isHost={isHost}
        isLastRound={(roomState.roundNumber ?? 1) >= TOTAL_ROUNDS}
        onNextRound={handleNextRound}
        advancing={advancing}
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
        onRematch={handleRematch}
        onHome={() => navigate('/')}
      />
    )
  }

  return null
}
