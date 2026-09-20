import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useTurnVibration } from '../../hooks/useTurnVibration'
import { useLang } from '../../store/LangContext'
import { createDeck, shuffleDeck, parseCard } from '../../multiplayer/deck'
import { removeCardFromHand, sortHand } from '../../multiplayer/hand'
import { dealCards } from '../../multiplayer/deal'
import { resolveTrick, getLegalPlays } from '../../multiplayer/trick'
import { advanceTurn } from '../../multiplayer/turnManager'
import { buildTurnOrderFromPartner, otherPlayersInSeatOrder } from '../../multiplayer/partnerships'
import { CardTable } from '../../components/cards/CardTable'
import { HandWinnerOverlay } from '../../components/cards/HandWinnerOverlay'
import { LastHandButton } from '../../components/cards/LastHandButton'
import { TableScoreBar } from '../../components/cards/TableScoreBar'
import { GameRulesPanel } from '../../components/GameRulesPanel'
import { PartnerPicker } from '../../components/cards/PartnerPicker'
import { ResultsScreen } from './ResultsScreen'
import { getTeamOf, computeTeamHands, countTensInHand, computeMendikotOutcome, isOutcomeDecided } from './mendikotLogic'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import metadata from './metadata'

const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }
const TEN_IDS = ['10S', '10H', '10D', '10C']

export default function Mendikot({ code }) {
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
  useTurnVibration(phase === 'playing' && roomState.turnOrder?.[roomState.currentIdx] === myId)
  const roomStateRef = useRef(roomState)
  roomStateRef.current = roomState

  const [starting, setStarting] = useState(false)
  const xpAwarded = useRef(false)
  const processingRef = useRef(false)

  function persist(overrides) {
    return setState({ ...roomStateRef.current, ...overrides })
  }

  useEffect(() => {
    if (phase === 'waiting') xpAwarded.current = false
  }, [phase])

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
    const remainingCards = removeCardFromHand(current.hands[actingPlayerId], cardId)
    const newHand = [...current.currentHand, { playerId: actingPlayerId, card: cardId }]
    const newLedSuit = current.ledSuit ?? parseCard(cardId).suit
    const newHands = { ...current.hands, [actingPlayerId]: remainingCards }

    if (newHand.length === current.turnOrder.length) {
      const winnerId = resolveTrick(newHand, newLedSuit, null)
      const winnerTeam = getTeamOf(winnerId, current.turnOrder)
      const tensWon = countTensInHand(newHand.map(p => p.card))
      const newHandsWon = { ...current.handsWon, [winnerId]: (current.handsWon[winnerId] ?? 0) + 1 }
      const newTensCaptured = { ...current.tensCaptured, [winnerTeam]: current.tensCaptured[winnerTeam] + tensWon }

      // Keep all 4 cards visible and reveal the winner for a beat before
      // clearing/advancing — otherwise the hand vanishes the instant the
      // 4th card lands, with no chance to see what happened.
      await clearActions()
      await persist({ hands: newHands, currentHand: newHand, handWinnerId: winnerId, lastHand: { cards: newHand, winnerId } })
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Stop as soon as the result is locked in (see isOutcomeDecided) —
      // checked BEFORE the cards-empty test, not just as a special case of it.
      const teamHands = computeTeamHands(current.turnOrder, newHandsWon)
      if (remainingCards.length === 0 || isOutcomeDecided(teamHands, newTensCaptured)) {
        const { winningTeam, isMendikot } = computeMendikotOutcome(teamHands, newTensCaptured)
        await persist({
          hands: newHands,
          handsWon: newHandsWon,
          tensCaptured: newTensCaptured,
          currentHand: [],
          handWinnerId: null,
          ledSuit: null,
          phase: 'results',
          winningTeam,
          isMendikot,
          teamHands
        })
        return
      }

      await persist({
        hands: newHands,
        handsWon: newHandsWon,
        tensCaptured: newTensCaptured,
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
      round: current.round ?? 1
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
      const deck = shuffleDeck(createDeck())
      const playerIds = buildTurnOrderFromPartner(players.map(p => p.id), room.hostId, roomState.pendingPartnerId)
      const { hands } = dealCards(deck, playerIds, 13)
      await clearActions()
      await persist({
        phase: 'playing',
        pendingPartnerId: null,
        turnOrder: playerIds,
        currentIdx: 0,
        hands,
        handsWon: {},
        tensCaptured: { teamA: 0, teamB: 0 },
        currentHand: [],
        handWinnerId: null,
        lastHand: null,
        ledSuit: null
      })
    } finally {
      setStarting(false)
    }
  }

  function handlePlayCard(cardId) {
    sendAction({ type: 'PLAY', payload: { cardId } })
  }

  async function handleRematch() {
    await clearActions()
    await setState({})
  }

  // ── XP / stats / badge on results ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results' || !myId || xpAwarded.current) return
    xpAwarded.current = true
    const isWinner = getTeamOf(myId, roomState.turnOrder) === roomState.winningTeam
    awardXP(isWinner ? 100 : 20, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('mendikot', { won: isWinner, gamesPlayed: 1 })
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
          accent="citrine"
          phase={phase}
        />
        {players.length === 4 && (
          <PartnerPicker
            players={players}
            hostId={room.hostId}
            myId={myId}
            pendingPartnerId={roomState.pendingPartnerId}
            onSelectPartner={id => persist({ pendingPartnerId: id })}
            accent="citrine"
          />
        )}
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={players.length < metadata.minPlayers || players.length > metadata.maxPlayers || starting}
            className="min-h-[48px] rounded-xl bg-citrine text-onCitrine font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
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
    const myHand = sortHand(roomState.hands?.[myId] ?? [])
    const isMyTurn = roomState.turnOrder?.[roomState.currentIdx] === myId
    // Nothing should be tappable while a completed hand is still being
    // held on screen for review (currentIdx doesn't advance until the
    // hand-reveal pause finishes — see applyPlay).
    const isInteractive = isMyTurn && !roomState.handWinnerId
    const currentTurnName = players.find(p => p.id === roomState.turnOrder?.[roomState.currentIdx])?.name ?? 'player'
    const legalPlays = isInteractive ? getLegalPlays(myHand, roomState.ledSuit) : []
    const disabledCardIds = isInteractive ? myHand.filter(id => !legalPlays.includes(id)) : myHand
    const highlightedCardIds = myHand.filter(id => TEN_IDS.includes(id))
    const centerCards = (roomState.currentHand ?? []).map(({ playerId, card }) => ({
      card,
      playerId,
      playerName: players.find(p => p.id === playerId)?.name
    }))
    const myTeam = getTeamOf(myId, roomState.turnOrder)
    const otherSeats = otherPlayersInSeatOrder(players, roomState.turnOrder, myId)
      .map(p => ({
        player: p,
        cardCount: roomState.hands?.[p.id]?.length ?? 0,
        isActiveTurn: roomState.turnOrder?.[roomState.currentIdx] === p.id,
        label: getTeamOf(p.id, roomState.turnOrder) === myTeam ? 'Partner' : undefined
      }))
    const teamHands = computeTeamHands(roomState.turnOrder, roomState.handsWon ?? {})
    const tensCaptured = roomState.tensCaptured ?? { teamA: 0, teamB: 0 }
    const scoreEntries = [
      { label: 'Team A', value: `${teamHands.teamA} hands, ${tensCaptured.teamA} tens` },
      { label: 'Team B', value: `${teamHands.teamB} hands, ${tensCaptured.teamB} tens` }
    ]

    const handWinnerId = roomState.handWinnerId
    const handWinnerName = handWinnerId ? (players.find(p => p.id === handWinnerId)?.name ?? 'Player') : null
    const centerSlot = handWinnerId ? (
      <HandWinnerOverlay
        centerCards={centerCards}
        handWinnerId={handWinnerId}
        handWinnerName={handWinnerName}
        accentColorClass="text-citrine"
      />
    ) : null

    return (
      <div className="flex flex-col gap-3 max-w-2xl w-full mx-auto pt-2 pb-6">
        <LastHandButton lastHand={roomState.lastHand} players={players} accent="citrine" />
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
          accent="citrine"
        />
        <p className="text-center text-textMuted text-sm py-2">
          {!isMyTurn
            ? `Waiting for ${currentTurnName} to play...`
            : roomState.ledSuit
              ? `Follow suit: ${SUIT_LABEL[roomState.ledSuit]}`
              : 'Lead any card'}
        </p>
      </div>
    )
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        players={players}
        turnOrder={roomState.turnOrder}
        winningTeam={roomState.winningTeam}
        isMendikot={roomState.isMendikot}
        teamHands={roomState.teamHands}
        tensCaptured={roomState.tensCaptured}
        myId={myId}
        isHost={isHost}
        onRematch={handleRematch}
        onHome={() => navigate('/')}
      />
    )
  }

  return null
}
