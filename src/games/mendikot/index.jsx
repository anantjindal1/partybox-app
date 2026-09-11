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
import { ResultsScreen } from './ResultsScreen'
import { getTeamOf, computeTeamTricks, countTensInTrick, computeMendikotOutcome } from './mendikotLogic'
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
    const newHand = removeCardFromHand(current.hands[actingPlayerId], cardId)
    const newTrick = [...current.currentTrick, { playerId: actingPlayerId, card: cardId }]
    const newLedSuit = current.ledSuit ?? parseCard(cardId).suit
    const newHands = { ...current.hands, [actingPlayerId]: newHand }

    if (newTrick.length === current.turnOrder.length) {
      const winnerId = resolveTrick(newTrick, newLedSuit, null)
      const winnerTeam = getTeamOf(winnerId, current.turnOrder)
      const tensWon = countTensInTrick(newTrick.map(p => p.card))
      const newTricksWon = { ...current.tricksWon, [winnerId]: (current.tricksWon[winnerId] ?? 0) + 1 }
      const newTensCaptured = { ...current.tensCaptured, [winnerTeam]: current.tensCaptured[winnerTeam] + tensWon }

      // All 13 tricks always play out — every hand empties at exactly
      // the same time, on the 13th trick, never before.
      if (newHand.length === 0) {
        const teamTricks = computeTeamTricks(current.turnOrder, newTricksWon)
        const { winningTeam, isMendikot } = computeMendikotOutcome(teamTricks, newTensCaptured)
        await clearActions()
        await persist({
          hands: newHands,
          tricksWon: newTricksWon,
          tensCaptured: newTensCaptured,
          currentTrick: [],
          ledSuit: null,
          phase: 'results',
          winningTeam,
          isMendikot,
          teamTricks
        })
        return
      }

      await clearActions()
      await persist({
        hands: newHands,
        tricksWon: newTricksWon,
        tensCaptured: newTensCaptured,
        currentTrick: [],
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
      await clearActions()
      await persist({
        phase: 'playing',
        turnOrder: playerIds,
        currentIdx: 0,
        hands,
        tricksWon: {},
        tensCaptured: { teamA: 0, teamB: 0 },
        currentTrick: [],
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
    const legalPlays = isMyTurn ? getLegalPlays(myHand, roomState.ledSuit) : []
    const disabledCardIds = isMyTurn ? myHand.filter(id => !legalPlays.includes(id)) : myHand
    const highlightedCardIds = myHand.filter(id => TEN_IDS.includes(id))
    const centerCards = (roomState.currentTrick ?? []).map(({ playerId, card }) => ({
      card,
      playerName: players.find(p => p.id === playerId)?.name
    }))
    const myTeam = getTeamOf(myId, roomState.turnOrder)
    const otherSeats = players
      .filter(p => p.id !== myId)
      .map(p => ({
        player: p,
        cardCount: roomState.hands?.[p.id]?.length ?? 0,
        isActiveTurn: roomState.turnOrder?.[roomState.currentIdx] === p.id,
        label: getTeamOf(p.id, roomState.turnOrder) === myTeam ? 'Partner' : undefined
      }))
    const teamTricks = computeTeamTricks(roomState.turnOrder, roomState.tricksWon ?? {})
    const tensCaptured = roomState.tensCaptured ?? { teamA: 0, teamB: 0 }
    const scoreEntries = [
      { label: 'Team A', value: `${teamTricks.teamA} tricks, ${tensCaptured.teamA} tens` },
      { label: 'Team B', value: `${teamTricks.teamB} tricks, ${tensCaptured.teamB} tens` }
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
          accent="citrine"
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

  if (phase === 'results') {
    return (
      <ResultsScreen
        players={players}
        turnOrder={roomState.turnOrder}
        winningTeam={roomState.winningTeam}
        isMendikot={roomState.isMendikot}
        teamTricks={roomState.teamTricks}
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
