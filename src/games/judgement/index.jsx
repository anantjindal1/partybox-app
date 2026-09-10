import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useLang } from '../../store/LangContext'
import { createDeck, shuffleDeck, parseCard } from '../../multiplayer/deck'
import { removeCardFromHand, sortHand } from '../../multiplayer/hand'
import { dealCards } from '../../multiplayer/deal'
import { resolveTrick, getLegalPlays } from '../../multiplayer/trick'
import { advanceTurn } from '../../multiplayer/turnManager'
import { CardTable } from '../../components/cards/CardTable'
import { GameRulesPanel } from '../../components/GameRulesPanel'
import { BiddingScreen } from './BiddingScreen'
import { TrumpChoiceScreen } from './TrumpChoiceScreen'
import { RoundRevealScreen } from './RoundRevealScreen'
import { ResultsScreen } from './ResultsScreen'
import { computeRoundResults, addToCumulative } from './scoring'
import { computeHandSizeSequence, rotate, getForbiddenBid, determineTrumpChooser } from './hillLogic'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import metadata from './metadata'

const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }

export default function Judgement({ code }) {
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
  const [bidSubmitted, setBidSubmitted] = useState(false)

  const xpAwarded = useRef(false)
  const biddingGuard = useRef(false)
  const bidCloseTimer = useRef(null)
  const trumpGuard = useRef(false)
  const processingRef = useRef(false)

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
  }, [phase, roomState.roundIndex])

  useEffect(() => {
    if (phase === 'choosing_trump') trumpGuard.current = false
  }, [phase, roomState.roundIndex])

  // ── Host: bidding -> choosing_trump, once everyone has bid ───────────────
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
  }, [actions, isHost, phase, roomState.roundIndex])

  async function advanceFromBidding() {
    if (biddingGuard.current) return
    biddingGuard.current = true
    const current = roomStateRef.current
    const bids = Object.fromEntries(
      actions.filter(a => a.type === 'BID').map(a => [a.playerId, a.payload.bid])
    )
    const bidOrder = rotate(current.turnOrder, current.leaderIdx)
    const trumpChooserId = determineTrumpChooser(bidOrder, bids)
    await clearActions()
    await persist({ phase: 'choosing_trump', bids, trumpChooserId })
  }

  // ── Host: choosing_trump -> playing, once the chooser has picked ─────────
  useEffect(() => {
    if (!isHost || phase !== 'choosing_trump' || trumpGuard.current) return
    const action = actions.find(a => a.playerId === roomState.trumpChooserId && a.type === 'CHOOSE_TRUMP')
    if (!action) return
    trumpGuard.current = true
    ;(async () => {
      const current = roomStateRef.current
      const chooserIdx = current.turnOrder.indexOf(current.trumpChooserId)
      await clearActions()
      await persist({
        phase: 'playing',
        trumpSuit: action.payload.suit,
        currentIdx: chooserIdx,
        currentTrick: [],
        ledSuit: null
      })
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase])

  // ── Host: process the current turn-holder's play ─────────────────────────
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
      const winnerId = resolveTrick(newTrick, newLedSuit, current.trumpSuit)
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
            roundIndex: current.roundIndex,
            handSize: current.handSizeSequence[current.roundIndex],
            trumpSuit: current.trumpSuit,
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
    // field is deliberately discarded, not persisted: Judgement already
    // owns a separate, semantically different `roundIndex`.
    const turnState = advanceTurn({
      playerIds: current.turnOrder,
      currentIdx: current.currentIdx,
      round: current.roundIndex
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
      const maxHandSize = Math.floor(52 / playerIds.length)
      const handSizeSequence = computeHandSizeSequence(maxHandSize)
      const deck = shuffleDeck(createDeck())
      const { hands } = dealCards(deck, playerIds, handSizeSequence[0])
      const zeroed = Object.fromEntries(playerIds.map(id => [id, 0]))
      await clearActions()
      await persist({
        phase: 'bidding',
        turnOrder: playerIds,
        maxHandSize,
        handSizeSequence,
        roundIndex: 0,
        leaderIdx: 0,
        bids: {},
        trumpSuit: null,
        trumpChooserId: null,
        hands,
        tricksWon: zeroed,
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

  function handleChooseTrump(suit) {
    sendAction({ type: 'CHOOSE_TRUMP', payload: { suit } })
  }

  function handlePlayCard(cardId) {
    sendAction({ type: 'PLAY', payload: { cardId } })
  }

  async function handleNextRound() {
    if (advancing) return
    setAdvancing(true)
    try {
      const current = roomStateRef.current
      const nextIndex = current.roundIndex + 1
      if (nextIndex >= current.handSizeSequence.length) {
        await persist({ phase: 'results' })
        return
      }
      const handSize = current.handSizeSequence[nextIndex]
      const deck = shuffleDeck(createDeck())
      const { hands } = dealCards(deck, current.turnOrder, handSize)
      const zeroed = Object.fromEntries(current.turnOrder.map(id => [id, 0]))
      await clearActions()
      await persist({
        phase: 'bidding',
        roundIndex: nextIndex,
        leaderIdx: nextIndex % current.turnOrder.length,
        bids: {},
        trumpSuit: null,
        trumpChooserId: null,
        hands,
        tricksWon: zeroed,
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
      writeGameStats('judgement', { won: isWinner, gamesPlayed: 1 })
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
    const roomFull = players.length > metadata.maxPlayers
    return (
      <div className="flex flex-col gap-4 max-w-lg w-full mx-auto pt-2">
        <GameRulesPanel
          title={metadata.title[lang]}
          rules={metadata.rules[lang]}
          tutorialSlides={metadata.tutorial[lang]}
          accent="peridot"
          phase={phase}
        />
        {roomFull && (
          <p className="text-center text-error text-sm">
            Room full ({metadata.maxPlayers}/{metadata.maxPlayers}) — ask the host to remove a player to start.
          </p>
        )}
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={players.length < metadata.minPlayers || players.length > metadata.maxPlayers || starting}
            className="min-h-[48px] rounded-xl bg-peridot text-onPeridot font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {starting
              ? 'Dealing...'
              : players.length < metadata.minPlayers
                ? `Waiting for players (${players.length}/${metadata.minPlayers})`
                : 'Start Game →'}
          </button>
        ) : (
          <p className="text-center text-textMuted text-sm">Waiting for host to start...</p>
        )}
      </div>
    )
  }

  if (phase === 'bidding') {
    const roundNumber = (roomState.roundIndex ?? 0) + 1
    const totalRounds = roomState.handSizeSequence?.length ?? 1
    const handSizeThisRound = roomState.handSizeSequence?.[roomState.roundIndex] ?? 1
    const bidOrder = rotate(roomState.turnOrder ?? [], roomState.leaderIdx ?? 0)
    const lastBidderId = bidOrder[bidOrder.length - 1]
    const isLastBidder = myId === lastBidderId
    const othersBidActions = actions.filter(a => a.type === 'BID' && a.playerId !== myId)
    const allOthersHaveBid = othersBidActions.length === players.length - 1
    const othersBids = Object.fromEntries(othersBidActions.map(a => [a.playerId, a.payload.bid]))
    const forbiddenBid = isLastBidder ? getForbiddenBid(handSizeThisRound, othersBids) : null
    const bidsIn = actions.filter(a => a.type === 'BID').length

    return (
      <BiddingScreen
        roundNumber={roundNumber}
        totalRounds={totalRounds}
        handSizeThisRound={handSizeThisRound}
        isLastBidder={isLastBidder}
        allOthersHaveBid={allOthersHaveBid}
        forbiddenBid={forbiddenBid}
        bidsIn={bidsIn}
        totalPlayers={players.length}
        onSubmit={handleBid}
        submitted={bidSubmitted}
      />
    )
  }

  if (phase === 'choosing_trump') {
    const isChooser = myId === roomState.trumpChooserId
    const chooserName = players.find(p => p.id === roomState.trumpChooserId)?.name ?? 'Player'
    return (
      <TrumpChoiceScreen
        isChooser={isChooser}
        chooserName={chooserName}
        onChoose={handleChooseTrump}
      />
    )
  }

  if (phase === 'playing') {
    const myHand = sortHand(roomState.hands?.[myId] ?? [])
    const isMyTurn = roomState.turnOrder?.[roomState.currentIdx] === myId
    const legalPlays = isMyTurn ? getLegalPlays(myHand, roomState.ledSuit) : []
    const disabledCardIds = isMyTurn ? myHand.filter(id => !legalPlays.includes(id)) : myHand
    const highlightedCardIds = myHand.filter(id => parseCard(id).suit === roomState.trumpSuit)
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
    const roundNumber = (roomState.roundIndex ?? 0) + 1
    const totalRounds = roomState.handSizeSequence?.length ?? 1

    return (
      <div className="flex flex-col gap-3 max-w-2xl w-full mx-auto pt-2 pb-6">
        <p className="text-center text-textMuted text-xs uppercase tracking-wider">
          Round {roundNumber} of {totalRounds} — Trump: {SUIT_LABEL[roomState.trumpSuit]} — your bid: {roomState.bids?.[myId]}
        </p>
        <CardTable
          otherSeats={otherSeats}
          myHand={myHand}
          myIsActiveTurn={isMyTurn}
          centerCards={centerCards}
          disabledCardIds={disabledCardIds}
          highlightedCardIds={highlightedCardIds}
          onCardTap={handlePlayCard}
          accent="peridot"
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
    const totalRounds = roomState.handSizeSequence?.length ?? 1
    return (
      <RoundRevealScreen
        lastRoundResult={roomState.lastRoundResult}
        roundNumber={(roomState.lastRoundResult?.roundIndex ?? 0) + 1}
        totalRounds={totalRounds}
        players={players}
        isHost={isHost}
        isLastRound={(roomState.roundIndex ?? 0) + 1 >= totalRounds}
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
