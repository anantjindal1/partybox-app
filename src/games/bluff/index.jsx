import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { createDeck, shuffleDeck, parseCard } from '../../multiplayer/deck'
import { removeCardFromHand, addCardsToHand } from '../../multiplayer/hand'
import { advanceTurn } from '../../multiplayer/turnManager'
import { dealUneven } from './dealUneven'
import { CardTable } from '../../components/cards/CardTable'
import { BluffPile } from './BluffPile'
import { BluffControls } from './BluffControls'
import { ResultsScreen } from './ResultsScreen'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import metadata from './metadata'

export default function Bluff({ code }) {
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
  const [selectedCardIds, setSelectedCardIds] = useState([])
  const [revealResolving, setRevealResolving] = useState(false)
  const xpAwarded = useRef(false)
  const processingRef = useRef(false)

  function persist(overrides) {
    return setState({ ...roomStateRef.current, ...overrides })
  }

  useEffect(() => {
    if (phase === 'waiting') xpAwarded.current = false
  }, [phase])

  // ── Host: process the current turn-holder's PLAY or CHALLENGE action ────
  useEffect(() => {
    if (!isHost || phase !== 'playing' || processingRef.current) return
    const current = roomState.turnOrder?.[roomState.currentIdx]
    const action = actions.find(a => a.playerId === current && (a.type === 'PLAY' || a.type === 'CHALLENGE'))
    if (!action) return
    processingRef.current = true
    ;(async () => {
      if (action.type === 'PLAY') {
        await applyPlay(action.payload.cardIds, action.payload.claimedRank)
      } else {
        await applyChallenge()
      }
      processingRef.current = false
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.currentIdx])

  async function applyPlay(cardIds, claimedRank) {
    const current = roomStateRef.current
    const actingPlayerId = current.turnOrder[current.currentIdx]

    // The outgoing lastPlay just went unchallenged — if it emptied that
    // player's hand, they win right here; this new play never applies.
    if (current.lastPlay && current.hands[current.lastPlay.playerId].length === 0) {
      await clearActions()
      await persist({ phase: 'results', winnerId: current.lastPlay.playerId })
      return
    }

    // The outgoing lastPlay's cards join the pile permanently now — this
    // is the ONLY place that happens, so they're never double-counted
    // later when a future reveal merges pile + a (different) lastPlay.
    const pile = current.lastPlay ? [...current.pile, ...current.lastPlay.cardIds] : current.pile

    let hand = current.hands[actingPlayerId]
    for (const id of cardIds) hand = removeCardFromHand(hand, id)

    const turnState = advanceTurn({
      playerIds: current.turnOrder,
      currentIdx: current.currentIdx,
      round: current.round
    })

    await clearActions()
    await persist({
      hands: { ...current.hands, [actingPlayerId]: hand },
      pile,
      lastPlay: { playerId: actingPlayerId, cardIds, claimedRank },
      currentIdx: turnState.currentIdx,
      round: turnState.round
    })
  }

  async function applyChallenge() {
    const current = roomStateRef.current
    const challengerId = current.turnOrder[current.currentIdx]
    const { lastPlay } = current
    const correct = lastPlay.cardIds.every(id => parseCard(id).rank === lastPlay.claimedRank)

    await clearActions()
    await persist({
      pendingReveal: {
        challengerId,
        claimantId: lastPlay.playerId,
        correct,
        actualCardIds: lastPlay.cardIds
      }
    })
  }

  async function handleResolveReveal() {
    if (revealResolving) return
    setRevealResolving(true)
    try {
      const current = roomStateRef.current
      const { pendingReveal, lastPlay, hands, pile, turnOrder } = current
      const claimantId = pendingReveal.claimantId

      if (pendingReveal.correct && hands[claimantId].length === 0) {
        await clearActions()
        await persist({ phase: 'results', winnerId: claimantId, pendingReveal: null })
        return
      }

      const pileTakerId = pendingReveal.correct ? pendingReveal.challengerId : claimantId
      const newHand = addCardsToHand(hands[pileTakerId], [...pile, ...lastPlay.cardIds])
      const nextIdx = (turnOrder.indexOf(pileTakerId) + 1) % turnOrder.length

      await clearActions()
      await persist({
        hands: { ...hands, [pileTakerId]: newHand },
        pile: [],
        lastPlay: null,
        pendingReveal: null,
        currentIdx: nextIdx,
        round: (current.round ?? 1) + 1
      })
    } finally {
      setRevealResolving(false)
    }
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleStartGame() {
    setStarting(true)
    try {
      const deck = shuffleDeck(createDeck())
      const playerIds = players.map(p => p.id)
      const { hands } = dealUneven(deck, playerIds)
      await clearActions()
      await persist({
        phase: 'playing',
        turnOrder: playerIds,
        currentIdx: 0,
        round: 1,
        hands,
        pile: [],
        lastPlay: null,
        pendingReveal: null,
        winnerId: null
      })
    } finally {
      setStarting(false)
    }
  }

  function toggleCard(cardId) {
    setSelectedCardIds(prev => prev.includes(cardId) ? prev.filter(c => c !== cardId) : [...prev, cardId])
  }

  function handlePlayCards(cardIds, claimedRank) {
    sendAction({ type: 'PLAY', payload: { cardIds, claimedRank } })
    setSelectedCardIds([])
  }

  function handleChallenge() {
    sendAction({ type: 'CHALLENGE', payload: {} })
  }

  async function handleRematch() {
    await clearActions()
    await setState({})
  }

  // ── XP / stats / badge on results ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results' || !myId || xpAwarded.current) return
    xpAwarded.current = true
    const isWinner = myId === roomState.winnerId
    awardXP(isWinner ? 100 : 20, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('bluff', { won: isWinner, gamesPlayed: 1 })
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
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={players.length < metadata.minPlayers || starting}
            className="min-h-[48px] rounded-xl bg-indigo text-onIndigo font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {starting ? 'Dealing...' : 'Start Game →'}
          </button>
        ) : (
          <p className="text-center text-textMuted text-sm">Waiting for host to start...</p>
        )}
      </div>
    )
  }

  if (phase === 'playing') {
    const myHand = roomState.hands?.[myId] ?? []
    const isMyTurn = roomState.turnOrder?.[roomState.currentIdx] === myId
    const otherSeats = players
      .filter(p => p.id !== myId)
      .map(p => ({
        player: p,
        cardCount: roomState.hands?.[p.id]?.length ?? 0,
        isActiveTurn: roomState.turnOrder?.[roomState.currentIdx] === p.id
      }))

    return (
      <div className="flex flex-col gap-3 max-w-2xl w-full mx-auto pt-2 pb-6">
        <CardTable
          otherSeats={otherSeats}
          myHand={myHand}
          myIsActiveTurn={isMyTurn}
          centerSlot={
            <BluffPile
              pileCount={roomState.pile?.length ?? 0}
              lastPlay={roomState.lastPlay}
              players={players}
              pendingReveal={roomState.pendingReveal}
              isHost={isHost}
              onResolveReveal={handleResolveReveal}
            />
          }
          selectedCardIds={selectedCardIds}
          onCardTap={toggleCard}
          accent="indigo"
        />
        {!roomState.pendingReveal && (
          <BluffControls
            isMyTurn={isMyTurn}
            canChallenge={isMyTurn && !!roomState.lastPlay}
            selectedCardIds={selectedCardIds}
            onPlay={handlePlayCards}
            onChallenge={handleChallenge}
          />
        )}
      </div>
    )
  }

  if (phase === 'results') {
    const winner = players.find(p => p.id === roomState.winnerId)
    return (
      <ResultsScreen
        winner={winner}
        isHost={isHost}
        onRematch={handleRematch}
        onHome={() => navigate('/')}
      />
    )
  }

  return null
}
