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
import { TableScoreBar } from '../../components/cards/TableScoreBar'
import { GameRulesPanel } from '../../components/GameRulesPanel'
import { BiddingScreen } from './BiddingScreen'
import { HandRevealScreen } from './HandRevealScreen'
import { ResultsScreen } from './ResultsScreen'
import {
  getTeamA,
  getTeamB,
  getTeamOf,
  computeTeamTricks,
  determineInitialShuffler,
  computeBiddingOrder,
  checkTeriHandWinner,
  computeHandPoints,
  applyShufflerScore,
  checkMatchWinner
} from './teriLogic'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import metadata from './metadata'

const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }

function getPartnerOf(playerId, turnOrder) {
  const teamA = getTeamA(turnOrder)
  const teamB = getTeamB(turnOrder)
  const team = teamA.includes(playerId) ? teamA : teamB
  return team.find(id => id !== playerId)
}

export default function Teri({ code }) {
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

  const xpAwarded = useRef(false)
  const processingBidRef = useRef(false)
  const processingRef = useRef(false)

  function persist(overrides) {
    return setState({ ...roomStateRef.current, ...overrides })
  }

  useEffect(() => {
    if (phase === 'waiting') xpAwarded.current = false
  }, [phase])

  // ── Host: process the current bidder's BID or PASS ───────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'bidding' || processingBidRef.current) return
    const current = roomState.biddingOrder?.[roomState.bidTurnIndex]
    if (!current) return
    const action = actions.find(a => a.playerId === current && (a.type === 'BID' || a.type === 'PASS'))
    if (!action) return
    processingBidRef.current = true
    ;(async () => {
      await applyBidAction(current, action)
      processingBidRef.current = false
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.bidTurnIndex])

  // ── Client: once passed, auto-submit PASS on later turns ─────────────────
  useEffect(() => {
    if (phase !== 'bidding' || !myId) return
    const current = roomState.biddingOrder?.[roomState.bidTurnIndex]
    if (current !== myId) return
    if ((roomState.passedPlayers ?? []).includes(myId)) {
      sendAction({ type: 'PASS', payload: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roomState.bidTurnIndex, myId])

  async function applyBidAction(playerId, action) {
    const current = roomStateRef.current
    const passedPlayers = action.type === 'PASS'
      ? [...(current.passedPlayers ?? []), playerId]
      : (current.passedPlayers ?? [])
    const currentHighBid = action.type === 'BID'
      ? { number: action.payload.number, suit: action.payload.suit, playerId }
      : current.currentHighBid
    const nextIdx = current.bidTurnIndex + 1
    await clearActions()
    if (nextIdx >= 8) {
      const gameLeadId = currentHighBid.playerId
      const zeroed = Object.fromEntries(current.turnOrder.map(id => [id, 0]))
      await persist({
        passedPlayers,
        currentHighBid,
        gameLeadId,
        trumpSuit: currentHighBid.suit,
        bid: currentHighBid.number,
        tricksWon: zeroed,
        currentTrick: [],
        ledSuit: null,
        currentIdx: current.turnOrder.indexOf(gameLeadId),
        suggestedCardId: null,
        phase: 'playing'
      })
      return
    }
    await persist({ passedPlayers, currentHighBid, bidTurnIndex: nextIdx })
  }

  // ── Host: process the current turn-holder's play (or GameLead's play for
  // their partner), and the partner's suggestion ────────────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'playing' || processingRef.current) return
    const current = roomState.turnOrder?.[roomState.currentIdx]
    const partnerOfGameLead = getPartnerOf(roomState.gameLeadId, roomState.turnOrder)
    const isPartnerTurn = current === partnerOfGameLead
    const action = actions.find(a => {
      if (a.type === 'SUGGEST_CARD') return a.playerId === current
      if (a.type === 'PLAY') {
        // On the partner's own turn, only GameLead may submit the play —
        // the partner's own PLAY (even though it's nominally "their turn")
        // must be rejected, not just discouraged by the UI.
        if (isPartnerTurn) return a.playerId === roomState.gameLeadId
        return a.playerId === current
      }
      return false
    })
    if (!action) return
    processingRef.current = true
    ;(async () => {
      if (action.type === 'SUGGEST_CARD') await applySuggest(action.payload.cardId)
      else await applyPlay(action.payload.cardId)
      processingRef.current = false
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.currentIdx])

  async function applySuggest(cardId) {
    await clearActions()
    await persist({ suggestedCardId: cardId })
  }

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
      const gameLeadTeam = getTeamOf(current.gameLeadId, current.turnOrder)
      const defenderTeam = gameLeadTeam === 'teamA' ? 'teamB' : 'teamA'
      const teamTricks = computeTeamTricks(current.turnOrder, newTricksWon)
      const gameLeadTricks = teamTricks[gameLeadTeam]
      const defenderTricks = teamTricks[defenderTeam]

      // Hand can end EARLY, mid-trick-loop, once a threshold is crossed —
      // not just when a hand becomes empty. checkTeriHandWinner is always
      // non-null by trick 13 at the latest (bid + (14-bid) = 14 > 13), so
      // the hand-empty check below is a defensive fallback only.
      const outcome = checkTeriHandWinner(gameLeadTricks, defenderTricks, current.bid)

      if (outcome || newHand.length === 0) {
        const resolved = outcome ?? {
          winner: gameLeadTricks > defenderTricks ? 'gameLead' : 'defender',
          isTeri: gameLeadTricks === 13 || defenderTricks === 13
        }
        const handPoints = computeHandPoints(current.bid, resolved.winner, resolved.isTeri)

        const shufflerId = current.shufflerId
        const isShufflerOnGameLeadTeam = getTeamOf(shufflerId, current.turnOrder) === gameLeadTeam
        const shufflerPartnerId = getPartnerOf(shufflerId, current.turnOrder)
        const shufflerIdx = current.turnOrder.indexOf(shufflerId)
        const nextCounterClockwiseId = current.turnOrder[(shufflerIdx + 1) % current.turnOrder.length]

        const shufflerResult = applyShufflerScore({
          currentScore: current.shufflerScore,
          handPointsForGameLead: handPoints,
          isShufflerOnGameLeadTeam,
          shufflerId,
          shufflerPartnerId,
          nextCounterClockwiseId
        })

        const newBurstPlayerIds = shufflerResult.burstPlayerId
          ? [...(current.burstPlayerIds ?? []), shufflerResult.burstPlayerId]
          : (current.burstPlayerIds ?? [])
        const matchWinnerTeam = checkMatchWinner(newBurstPlayerIds, current.turnOrder)

        const gameLeadTeamIds = gameLeadTeam === 'teamA' ? getTeamA(current.turnOrder) : getTeamB(current.turnOrder)
        const defenderTeamIds = defenderTeam === 'teamA' ? getTeamA(current.turnOrder) : getTeamB(current.turnOrder)

        await clearActions()
        await persist({
          hands: newHands,
          tricksWon: newTricksWon,
          currentTrick: [],
          ledSuit: null,
          shufflerId: shufflerResult.shufflerId,
          shufflerScore: shufflerResult.score,
          burstPlayerIds: newBurstPlayerIds,
          matchWinnerTeam,
          lastHandResult: {
            handNumber: current.handNumber,
            bid: current.bid,
            trumpSuit: current.trumpSuit,
            gameLeadTeamIds,
            defenderTeamIds,
            gameLeadTricks,
            defenderTricks,
            winner: resolved.winner,
            isTeri: resolved.isTeri,
            handPoints,
            shufflerBefore: { id: shufflerId, score: current.shufflerScore },
            shufflerAfter: { id: shufflerResult.shufflerId, score: shufflerResult.score },
            burstPlayerId: shufflerResult.burstPlayerId,
            matchWinnerTeam
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
        currentIdx: current.turnOrder.indexOf(winnerId),
        suggestedCardId: null
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
      currentIdx: turnState.currentIdx,
      suggestedCardId: null
    })
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleStartGame() {
    setStarting(true)
    try {
      const playerIds = players.map(p => p.id)
      const shufflerId = determineInitialShuffler(shuffleDeck(createDeck()), playerIds)
      const { hands } = dealCards(shuffleDeck(createDeck()), playerIds, 13)
      const biddingOrder = computeBiddingOrder(playerIds, shufflerId)
      await clearActions()
      await persist({
        phase: 'bidding',
        turnOrder: playerIds,
        shufflerId,
        shufflerScore: 0,
        burstPlayerIds: [],
        handNumber: 0,
        biddingOrder,
        bidTurnIndex: 0,
        passedPlayers: [],
        currentHighBid: null,
        hands,
        gameLeadId: null,
        trumpSuit: null,
        bid: null,
        lastHandResult: null,
        matchWinnerTeam: null
      })
    } finally {
      setStarting(false)
    }
  }

  function handleBid(number, suit) {
    sendAction({ type: 'BID', payload: { number, suit } })
  }

  function handlePass() {
    sendAction({ type: 'PASS', payload: {} })
  }

  function handlePlayCard(cardId) {
    sendAction({ type: 'PLAY', payload: { cardId } })
  }

  function handleSuggestCard(cardId) {
    sendAction({ type: 'SUGGEST_CARD', payload: { cardId } })
  }

  async function handleNextHand() {
    if (advancing) return
    setAdvancing(true)
    try {
      const current = roomStateRef.current
      if (current.matchWinnerTeam) {
        await persist({ phase: 'results' })
        return
      }
      const nextHandNumber = current.handNumber + 1
      const { hands } = dealCards(shuffleDeck(createDeck()), current.turnOrder, 13)
      const biddingOrder = computeBiddingOrder(current.turnOrder, current.shufflerId)
      await clearActions()
      await persist({
        phase: 'bidding',
        handNumber: nextHandNumber,
        biddingOrder,
        bidTurnIndex: 0,
        passedPlayers: [],
        currentHighBid: null,
        hands,
        gameLeadId: null,
        trumpSuit: null,
        bid: null,
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
    const isWinner = getTeamOf(myId, roomState.turnOrder) === roomState.matchWinnerTeam
    awardXP(isWinner ? 100 : 20, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('teri', { won: isWinner, gamesPlayed: 1 })
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
          accent="cobalt"
          phase={phase}
        />
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={players.length !== 4 || starting}
            className="min-h-[48px] rounded-xl bg-cobalt text-onCobalt font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
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
    const myHand = sortHand(roomState.hands?.[myId] ?? [])
    const currentBidder = roomState.biddingOrder?.[roomState.bidTurnIndex]
    const isMyTurn = currentBidder === myId
    const isFirstTurn = roomState.bidTurnIndex === 0
    const currentBidderName = players.find(p => p.id === currentBidder)?.name ?? 'Player'
    return (
      <BiddingScreen
        myHand={myHand}
        isMyTurn={isMyTurn}
        isFirstTurn={isFirstTurn}
        currentHighBid={roomState.currentHighBid}
        currentBidderName={currentBidderName}
        onBid={handleBid}
        onPass={handlePass}
      />
    )
  }

  if (phase === 'playing') {
    const gameLeadId = roomState.gameLeadId
    const partnerOfGameLead = getPartnerOf(gameLeadId, roomState.turnOrder)
    const isGameLead = myId === gameLeadId
    const isPartnerOfGameLead = myId === partnerOfGameLead
    const currentTurnHolder = roomState.turnOrder?.[roomState.currentIdx]
    const isPartnerTurn = currentTurnHolder === partnerOfGameLead
    const isMyTurnNormally = currentTurnHolder === myId

    let activeHand
    let onCardTap
    let activeLabel = null
    if (isGameLead && isPartnerTurn) {
      activeHand = sortHand(roomState.hands?.[partnerOfGameLead] ?? [])
      onCardTap = handlePlayCard
      activeLabel = `Playing for ${players.find(p => p.id === partnerOfGameLead)?.name ?? 'partner'}`
    } else if (isPartnerOfGameLead && isPartnerTurn) {
      activeHand = sortHand(roomState.hands?.[myId] ?? [])
      onCardTap = handleSuggestCard
      activeLabel = 'GameLead is choosing your card — tap to suggest'
    } else {
      activeHand = sortHand(roomState.hands?.[myId] ?? [])
      onCardTap = handlePlayCard
    }

    const isInteractive = isMyTurnNormally || (isGameLead && isPartnerTurn) || (isPartnerOfGameLead && isPartnerTurn)
    const legalPlays = isInteractive ? getLegalPlays(activeHand, roomState.ledSuit) : []
    const disabledCardIds = isInteractive ? activeHand.filter(id => !legalPlays.includes(id)) : []
    const highlightedCardIds = activeHand.filter(id => parseCard(id).suit === roomState.trumpSuit)
    const selectedCardIds = (isPartnerTurn && roomState.suggestedCardId) ? [roomState.suggestedCardId] : []

    const centerCards = (roomState.currentTrick ?? []).map(({ playerId, card }) => ({
      card,
      playerName: players.find(p => p.id === playerId)?.name
    }))

    const otherSeats = players
      .filter(p => p.id !== myId)
      .map(p => {
        const isPartnerSeat = p.id === partnerOfGameLead
        const labels = []
        if (p.id === roomState.shufflerId) labels.push('Shuffler')
        if (p.id === gameLeadId) labels.push('GameLead')
        if (isPartnerSeat) labels.push('Partner')
        return {
          player: p,
          cardCount: roomState.hands?.[p.id]?.length ?? 0,
          isActiveTurn: currentTurnHolder === p.id,
          label: labels.length ? labels.join(' · ') : undefined,
          exposedCards: isPartnerSeat ? roomState.hands?.[p.id] : undefined
        }
      })

    const teamTricks = computeTeamTricks(roomState.turnOrder, roomState.tricksWon ?? {})
    const gameLeadTeam = getTeamOf(gameLeadId, roomState.turnOrder)
    const defenderTeam = gameLeadTeam === 'teamA' ? 'teamB' : 'teamA'
    const scoreEntries = [
      { label: 'GameLead', value: `${teamTricks[gameLeadTeam]}/${roomState.bid}` },
      { label: 'Defenders', value: `${teamTricks[defenderTeam]}` },
      { label: 'Trump', value: SUIT_LABEL[roomState.trumpSuit] }
    ]

    return (
      <div className="flex flex-col gap-3 max-w-2xl w-full mx-auto pt-2 pb-6">
        <TableScoreBar entries={scoreEntries} />
        <CardTable
          otherSeats={otherSeats}
          myHand={activeHand}
          myIsActiveTurn={isInteractive}
          centerCards={centerCards}
          disabledCardIds={disabledCardIds}
          highlightedCardIds={highlightedCardIds}
          selectedCardIds={selectedCardIds}
          onCardTap={onCardTap}
          accent="cobalt"
        />
        <p className="text-center text-textMuted text-sm py-2">
          {activeLabel ?? (!isMyTurnNormally
            ? 'Waiting for your turn...'
            : roomState.ledSuit
              ? `Follow suit: ${SUIT_LABEL[roomState.ledSuit]}`
              : 'Lead any card')}
        </p>
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
        turnOrder={roomState.turnOrder ?? []}
        players={players}
        matchWinnerTeam={roomState.matchWinnerTeam}
        burstPlayerIds={roomState.burstPlayerIds ?? []}
        myId={myId}
        isHost={isHost}
        onRematch={handleRematch}
        onHome={() => navigate('/')}
      />
    )
  }

  return null
}
