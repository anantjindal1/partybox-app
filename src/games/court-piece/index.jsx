import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useLang } from '../../store/LangContext'
import { createDeck, shuffleDeck, parseCard } from '../../multiplayer/deck'
import { removeCardFromHand, addCardsToHand, sortHand } from '../../multiplayer/hand'
import { dealCards } from '../../multiplayer/deal'
import { resolveTrick, getLegalPlays } from '../../multiplayer/trick'
import { advanceTurn } from '../../multiplayer/turnManager'
import { buildTurnOrderFromPartner } from '../../multiplayer/partnerships'
import { CardTable } from '../../components/cards/CardTable'
import { TableScoreBar } from '../../components/cards/TableScoreBar'
import { PartnerPicker } from '../../components/cards/PartnerPicker'
import { GameRulesPanel } from '../../components/GameRulesPanel'
import { TrumpCallScreen } from './TrumpCallScreen'
import { HandRevealScreen } from './HandRevealScreen'
import { ResultsScreen } from './ResultsScreen'
import {
  getTeamOf,
  computeTeamTricks,
  computeHandOutcome,
  checkMatchWinner
} from './courtPieceLogic'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import metadata from './metadata'

const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }

export default function CourtPiece({ code }) {
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
      const { hands: secondDeal } = dealCards(current.remainingDeck, current.turnOrder, 8)
      const mergedHands = Object.fromEntries(
        current.turnOrder.map(id => [id, addCardsToHand(current.hands[id], secondDeal[id])])
      )
      const callerIdx = current.turnOrder.indexOf(current.callerId)
      await clearActions()
      await persist({
        phase: 'playing',
        trumpSuit: action.payload.suit,
        hands: mergedHands,
        remainingDeck: null,
        currentIdx: callerIdx,
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
        // Hand complete — all 13 tricks played.
        const teamTricks = computeTeamTricks(current.turnOrder, newTricksWon)
        const { winningTeam, isKot, pointsAwarded } = computeHandOutcome(teamTricks)
        const matchScores = {
          ...current.matchScores,
          [winningTeam]: current.matchScores[winningTeam] + pointsAwarded
        }
        const handsWon = {
          ...current.handsWon,
          [winningTeam]: current.handsWon[winningTeam] + 1
        }
        const matchWinner = checkMatchWinner(matchScores, handsWon)
        await clearActions()
        await persist({
          hands: newHands,
          tricksWon: newTricksWon,
          currentTrick: [],
          ledSuit: null,
          matchScores,
          handsWon,
          nextCallerId: winnerId,
          lastHandResult: {
            handNumber: current.handNumber,
            trumpSuit: current.trumpSuit,
            callerId: current.callerId,
            teamTricks,
            winningTeam,
            isKot,
            pointsAwarded,
            matchScoresAfter: matchScores,
            handsWonAfter: handsWon,
            matchWinner
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

    // Trick not complete — plain seat-advance. advanceTurn's own `round`
    // field is deliberately discarded, not persisted: Court Piece already
    // owns a separate, semantically different `handNumber`.
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
      const playerIds = buildTurnOrderFromPartner(players.map(p => p.id), room.hostId, roomState.pendingPartnerId)
      const deck = shuffleDeck(createDeck())
      const { hands, remaining } = dealCards(deck, playerIds, 5)
      const zeroed = Object.fromEntries(playerIds.map(id => [id, 0]))
      await clearActions()
      await persist({
        phase: 'calling_trump',
        pendingPartnerId: null,
        turnOrder: playerIds,
        handNumber: 1,
        callerId: playerIds[0],
        trumpSuit: null,
        hands,
        remainingDeck: remaining,
        tricksWon: zeroed,
        currentTrick: [],
        ledSuit: null,
        currentIdx: null,
        nextCallerId: null,
        matchScores: { teamA: 0, teamB: 0 },
        handsWon: { teamA: 0, teamB: 0 },
        lastHandResult: null
      })
    } finally {
      setStarting(false)
    }
  }

  function handleCallTrump(suit) {
    if (callSubmitted) return
    setCallSubmitted(true)
    sendAction({ type: 'CALL_TRUMP', payload: { suit } })
  }

  function handlePlayCard(cardId) {
    sendAction({ type: 'PLAY', payload: { cardId } })
  }

  async function handleNextHand() {
    if (advancing) return
    setAdvancing(true)
    try {
      const current = roomStateRef.current
      if (current.lastHandResult?.matchWinner) {
        await persist({ phase: 'results' })
        return
      }
      const deck = shuffleDeck(createDeck())
      const { hands, remaining } = dealCards(deck, current.turnOrder, 5)
      const zeroed = Object.fromEntries(current.turnOrder.map(id => [id, 0]))
      await clearActions()
      await persist({
        phase: 'calling_trump',
        handNumber: current.handNumber + 1,
        callerId: current.nextCallerId,
        trumpSuit: null,
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
    const matchWinner = roomState.lastHandResult?.matchWinner
    const isWinner = getTeamOf(myId, roomState.turnOrder) === matchWinner
    awardXP(isWinner ? 100 : 20, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('court-piece', { won: isWinner, gamesPlayed: 1 })
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
        <GameRulesPanel
          title={metadata.title[lang]}
          rules={metadata.rules[lang]}
          tutorialSlides={metadata.tutorial[lang]}
          accent="jade"
          phase={phase}
        />
        {roomFull && (
          <p className="text-center text-error text-sm">
            Room full (4/4) — ask the host to remove a player to start.
          </p>
        )}
        {players.length === 4 && (
          <PartnerPicker
            players={players}
            hostId={room.hostId}
            myId={myId}
            pendingPartnerId={roomState.pendingPartnerId}
            onSelectPartner={id => persist({ pendingPartnerId: id })}
            accent="jade"
          />
        )}
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={players.length !== 4 || starting}
            className="min-h-[48px] rounded-xl bg-jade text-onJade font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {starting ? 'Dealing...' : players.length < 4 ? `Waiting for players (${players.length}/4)` : 'Start Game →'}
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
    const highlightedCardIds = myHand.filter(id => parseCard(id).suit === roomState.trumpSuit)
    const centerCards = (roomState.currentTrick ?? []).map(({ playerId, card }) => ({
      card,
      playerName: players.find(p => p.id === playerId)?.name
    }))
    const myTeam = getTeamOf(myId, roomState.turnOrder ?? [myId])
    const otherSeats = players
      .filter(p => p.id !== myId)
      .map(p => ({
        player: p,
        cardCount: roomState.hands?.[p.id]?.length ?? 0,
        isActiveTurn: roomState.turnOrder?.[roomState.currentIdx] === p.id,
        label: getTeamOf(p.id, roomState.turnOrder) === myTeam ? 'Partner' : undefined
      }))

    const handsWon = roomState.handsWon ?? { teamA: 0, teamB: 0 }
    const matchScores = roomState.matchScores ?? { teamA: 0, teamB: 0 }
    const scoreEntries = [
      { label: 'Hand', value: roomState.handNumber ?? 1 },
      { label: 'Team A', value: `${handsWon.teamA} hands (${matchScores.teamA}pts)` },
      { label: 'Team B', value: `${handsWon.teamB} hands (${matchScores.teamB}pts)` },
      { label: 'Trump', value: SUIT_LABEL[roomState.trumpSuit] }
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
          accent="jade"
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

  if (phase === 'hand_reveal') {
    return (
      <HandRevealScreen
        lastHandResult={roomState.lastHandResult}
        players={players}
        turnOrder={roomState.turnOrder ?? []}
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
        matchWinner={roomState.lastHandResult?.matchWinner}
        matchScores={roomState.matchScores ?? { teamA: 0, teamB: 0 }}
        handsWon={roomState.handsWon ?? { teamA: 0, teamB: 0 }}
        myId={myId}
        isHost={isHost}
        onRematch={handleRematch}
        onHome={() => navigate('/')}
      />
    )
  }

  return null
}
