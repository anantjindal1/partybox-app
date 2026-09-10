import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useLang } from '../../store/LangContext'
import { createDeck, shuffleDeck, parseCard } from '../../multiplayer/deck'
import { removeCardFromHand, addCardsToHand, sortHandByRank } from '../../multiplayer/hand'
import { advanceTurn } from '../../multiplayer/turnManager'
import { dealEven } from '../../multiplayer/deal'
import { CardTable } from '../../components/cards/CardTable'
import { GameRulesPanel } from '../../components/GameRulesPanel'
import { BluffPile } from './BluffPile'
import { BluffControls } from './BluffControls'
import { ResultsScreen } from './ResultsScreen'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import metadata from './metadata'

export default function Bluff({ code }) {
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

  // ── Host: process the current turn-holder's action ───────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'playing' || processingRef.current) return
    const current = roomState.turnOrder?.[roomState.currentIdx]
    const action = actions.find(
      a => a.playerId === current && ['OPEN_ROUND', 'ADD', 'PASS', 'CHALLENGE'].includes(a.type)
    )
    if (!action) return
    processingRef.current = true
    ;(async () => {
      if (action.type === 'OPEN_ROUND') {
        await applyOpenRound(action.payload.cardIds, action.payload.claimedRank)
      } else if (action.type === 'ADD') {
        await applyAdd(action.payload.cardIds)
      } else if (action.type === 'PASS') {
        await applyPass()
      } else {
        await applyChallenge()
      }
      processingRef.current = false
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.currentIdx])

  async function applyOpenRound(cardIds, claimedRank) {
    const current = roomStateRef.current
    const actingPlayerId = current.turnOrder[current.currentIdx]

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
      pile: cardIds,
      claimedRank,
      latestHandPlayerId: actingPlayerId,
      latestHandCardIds: cardIds,
      currentIdx: turnState.currentIdx,
      round: turnState.round
    })
  }

  async function applyAdd(cardIds) {
    const current = roomStateRef.current
    const actingPlayerId = current.turnOrder[current.currentIdx]

    // The outgoing latest-hand owner just got buried under this new add —
    // if that emptied their hand, they win right here; this add is never
    // applied (the game already ended one tick earlier).
    if (current.hands[current.latestHandPlayerId].length === 0) {
      await clearActions()
      await persist({ phase: 'results', winnerId: current.latestHandPlayerId })
      return
    }

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
      pile: [...current.pile, ...cardIds],
      latestHandPlayerId: actingPlayerId,
      latestHandCardIds: cardIds,
      currentIdx: turnState.currentIdx,
      round: turnState.round
    })
  }

  async function applyPass() {
    const current = roomStateRef.current
    const actingPlayerId = current.turnOrder[current.currentIdx]

    if (actingPlayerId !== current.latestHandPlayerId) {
      // Ordinary pass — nothing about the round changes, just move on.
      const turnState = advanceTurn({
        playerIds: current.turnOrder,
        currentIdx: current.currentIdx,
        round: current.round
      })
      await clearActions()
      await persist({ currentIdx: turnState.currentIdx, round: turnState.round })
      return
    }

    // A full pass-around just completed — this is a burn.
    if (current.hands[actingPlayerId].length === 0) {
      await clearActions()
      await persist({ phase: 'results', winnerId: actingPlayerId })
      return
    }

    await clearActions()
    await persist({
      pile: [],
      claimedRank: null,
      latestHandPlayerId: null,
      latestHandCardIds: null
      // currentIdx unchanged — same player opens the next round
    })
  }

  async function applyChallenge() {
    const current = roomStateRef.current
    const challengerId = current.turnOrder[current.currentIdx]
    const correct = current.latestHandCardIds.every(id => parseCard(id).rank === current.claimedRank)

    await clearActions()
    await persist({
      pendingReveal: {
        challengerId,
        claimantId: current.latestHandPlayerId,
        correct,
        actualCardIds: current.latestHandCardIds
      }
    })
  }

  async function handleResolveReveal() {
    if (revealResolving) return
    setRevealResolving(true)
    try {
      const current = roomStateRef.current
      const { pendingReveal, hands, pile, turnOrder } = current
      const claimantId = pendingReveal.claimantId

      if (pendingReveal.correct && hands[claimantId].length === 0) {
        await clearActions()
        await persist({ phase: 'results', winnerId: claimantId, pendingReveal: null })
        return
      }

      const pileTakerId = pendingReveal.correct ? pendingReveal.challengerId : claimantId
      const nextStarterId = pendingReveal.correct ? claimantId : pendingReveal.challengerId
      const newHand = addCardsToHand(hands[pileTakerId], pile)

      await clearActions()
      await persist({
        hands: { ...hands, [pileTakerId]: newHand },
        pile: [],
        claimedRank: null,
        latestHandPlayerId: null,
        latestHandCardIds: null,
        pendingReveal: null,
        currentIdx: turnOrder.indexOf(nextStarterId),
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
      const { hands } = dealEven(deck, playerIds)
      await clearActions()
      await persist({
        phase: 'playing',
        turnOrder: playerIds,
        currentIdx: 0,
        round: 1,
        hands,
        pile: [],
        claimedRank: null,
        latestHandPlayerId: null,
        latestHandCardIds: null,
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

  function handleOpenRound(cardIds, claimedRank) {
    sendAction({ type: 'OPEN_ROUND', payload: { cardIds, claimedRank } })
    setSelectedCardIds([])
  }

  function handleAdd(cardIds) {
    sendAction({ type: 'ADD', payload: { cardIds } })
    setSelectedCardIds([])
  }

  function handlePass() {
    sendAction({ type: 'PASS', payload: {} })
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
        <GameRulesPanel
          title={metadata.title[lang]}
          rules={metadata.rules[lang]}
          tutorialSlides={metadata.tutorial[lang]}
          accent="indigo"
          phase={phase}
        />
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
    const myHand = sortHandByRank(roomState.hands?.[myId] ?? [])
    const isMyTurn = roomState.turnOrder?.[roomState.currentIdx] === myId
    const amLatestHandOwner = roomState.latestHandPlayerId === myId
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
              claimedRank={roomState.claimedRank}
              latestHandPlayerId={roomState.latestHandPlayerId}
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
            roundOpen={roomState.claimedRank != null}
            amLatestHandOwner={amLatestHandOwner}
            selectedCardIds={selectedCardIds}
            onOpenRound={handleOpenRound}
            onAdd={handleAdd}
            onPass={handlePass}
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
