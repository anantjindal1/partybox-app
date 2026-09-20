import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useTurnVibration } from '../../hooks/useTurnVibration'
import { useLang } from '../../store/LangContext'
import { createDeck, shuffleDeck, parseCard } from '../../multiplayer/deck'
import { removeCardFromHand, addCardsToHand, sortHand } from '../../multiplayer/hand'
import { dealCards } from '../../multiplayer/deal'
import { resolveTrick, getLegalPlays } from '../../multiplayer/trick'
import { advanceTurn } from '../../multiplayer/turnManager'
import { buildTurnOrderFromPartner, otherPlayersInSeatOrder } from '../../multiplayer/partnerships'
import { CardTable } from '../../components/cards/CardTable'
import { TableScoreBar } from '../../components/cards/TableScoreBar'
import { SUIT_TEXT_CLASS } from '../../components/cards/suitIcons'
import { HandWinnerOverlay } from '../../components/cards/HandWinnerOverlay'
import { LastHandButton } from '../../components/cards/LastHandButton'
import { PartnerPicker } from '../../components/cards/PartnerPicker'
import { GameRulesPanel } from '../../components/GameRulesPanel'
import { TrumpCallScreen } from './TrumpCallScreen'
import { RoundRevealScreen } from './RoundRevealScreen'
import { ResultsScreen } from './ResultsScreen'
import {
  getTeamOf,
  computeTeamHands,
  computeRoundOutcome,
  checkGameWinner
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
  const [showLastRound, setShowLastRound] = useState(false)

  const xpAwarded = useRef(false)
  const trumpGuard = useRef(false)
  const processingRef = useRef(false)

  function persist(overrides) {
    return setState({ ...roomStateRef.current, ...overrides })
  }

  // Small "review the last round" affordance — RoundRevealScreen is already a
  // clean, reusable presentational component; isHost={false} suppresses its
  // "Next Round" button with no changes needed to it.
  function renderLastRoundButton() {
    if (!roomState.lastRoundResult) return null
    return (
      <>
        <button
          onClick={() => setShowLastRound(true)}
          className="self-center text-sm font-bold text-jade border-[1.5px] border-jade bg-jade/10 rounded-xl px-4 py-2"
        >
          📜 View Last Round
        </button>
        {showLastRound && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4 py-8 overflow-y-auto">
            <div className="bg-surface rounded-2xl max-w-lg w-full">
              <div className="flex justify-end p-2">
                <button
                  onClick={() => setShowLastRound(false)}
                  className="text-textMuted hover:text-textPrimary text-sm font-semibold px-3 py-1"
                >
                  ✕ Close
                </button>
              </div>
              <RoundRevealScreen
                lastRoundResult={roomState.lastRoundResult}
                players={players}
                turnOrder={roomState.turnOrder ?? []}
                isHost={false}
                onNextRound={() => {}}
                advancing={false}
              />
            </div>
          </div>
        )}
      </>
    )
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
        currentHand: [],
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
    const remainingCards = removeCardFromHand(current.hands[actingPlayerId], cardId)
    const newHands = { ...current.hands, [actingPlayerId]: remainingCards }
    const newHand = [...current.currentHand, { playerId: actingPlayerId, card: cardId }]
    const newLedSuit = current.ledSuit ?? parseCard(cardId).suit

    if (newHand.length === current.turnOrder.length) {
      const winnerId = resolveTrick(newHand, newLedSuit, current.trumpSuit)
      const newHandsWon = { ...current.handsWon, [winnerId]: (current.handsWon[winnerId] ?? 0) + 1 }

      // Keep all 4 cards visible and reveal the winner for a beat before
      // clearing/advancing — otherwise the hand vanishes the instant the
      // 4th card lands, with no chance to see what happened.
      await clearActions()
      await persist({ hands: newHands, currentHand: newHand, handWinnerId: winnerId, lastHand: { cards: newHand, winnerId } })
      await new Promise(resolve => setTimeout(resolve, 1500))

      if (remainingCards.length === 0) {
        // Round complete — all 13 hands played.
        const teamHands = computeTeamHands(current.turnOrder, newHandsWon)
        const { winningTeam, isKot, pointsAwarded } = computeRoundOutcome(teamHands)
        const gameScores = {
          ...current.gameScores,
          [winningTeam]: current.gameScores[winningTeam] + pointsAwarded
        }
        const roundsWon = {
          ...current.roundsWon,
          [winningTeam]: current.roundsWon[winningTeam] + 1
        }
        const gameWinner = checkGameWinner(gameScores, roundsWon)
        await persist({
          hands: newHands,
          handsWon: newHandsWon,
          currentHand: [],
          handWinnerId: null,
          ledSuit: null,
          gameScores,
          roundsWon,
          nextCallerId: winnerId,
          lastRoundResult: {
            roundNumber: current.roundNumber,
            trumpSuit: current.trumpSuit,
            callerId: current.callerId,
            teamHands,
            winningTeam,
            isKot,
            pointsAwarded,
            gameScoresAfter: gameScores,
            roundsWonAfter: roundsWon,
            gameWinner
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

    // Hand not complete — plain seat-advance. advanceTurn's own `round`
    // field is deliberately discarded, not persisted: Court Piece already
    // owns a separate, semantically different `roundNumber`.
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
      const playerIds = buildTurnOrderFromPartner(players.map(p => p.id), room.hostId, roomState.pendingPartnerId)
      const deck = shuffleDeck(createDeck())
      const { hands, remaining } = dealCards(deck, playerIds, 5)
      const zeroed = Object.fromEntries(playerIds.map(id => [id, 0]))
      await clearActions()
      await persist({
        phase: 'calling_trump',
        pendingPartnerId: null,
        turnOrder: playerIds,
        roundNumber: 1,
        callerId: playerIds[0],
        trumpSuit: null,
        hands,
        remainingDeck: remaining,
        handsWon: zeroed,
        currentHand: [],
        handWinnerId: null,
        lastHand: null,
        ledSuit: null,
        currentIdx: null,
        nextCallerId: null,
        gameScores: { teamA: 0, teamB: 0 },
        roundsWon: { teamA: 0, teamB: 0 },
        lastRoundResult: null
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

  async function handleNextRound() {
    if (advancing) return
    setAdvancing(true)
    try {
      const current = roomStateRef.current
      if (current.lastRoundResult?.gameWinner) {
        await persist({ phase: 'results' })
        return
      }
      const deck = shuffleDeck(createDeck())
      const { hands, remaining } = dealCards(deck, current.turnOrder, 5)
      const zeroed = Object.fromEntries(current.turnOrder.map(id => [id, 0]))
      await clearActions()
      await persist({
        phase: 'calling_trump',
        roundNumber: current.roundNumber + 1,
        callerId: current.nextCallerId,
        trumpSuit: null,
        hands,
        remainingDeck: remaining,
        handsWon: zeroed,
        currentHand: [],
        handWinnerId: null,
        lastHand: null,
        ledSuit: null,
        currentIdx: null
        // lastRoundResult is deliberately kept — it's what "View Last Round"
        // shows during the new round. It only changes once this new round
        // itself completes and overwrites it.
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
    const gameWinner = roomState.lastRoundResult?.gameWinner
    const isWinner = getTeamOf(myId, roomState.turnOrder) === gameWinner
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
      <>
        {renderLastRoundButton()}
        <TrumpCallScreen
          isCaller={isCaller}
          callerName={callerName}
          myHand={myHand}
          onCall={handleCallTrump}
        />
      </>
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
    const highlightedCardIds = myHand.filter(id => parseCard(id).suit === roomState.trumpSuit)
    const centerCards = (roomState.currentHand ?? []).map(({ playerId, card }) => ({
      card,
      playerName: players.find(p => p.id === playerId)?.name
    }))
    const myTeam = getTeamOf(myId, roomState.turnOrder ?? [myId])
    const otherSeats = otherPlayersInSeatOrder(players, roomState.turnOrder, myId)
      .map(p => ({
        player: p,
        cardCount: roomState.hands?.[p.id]?.length ?? 0,
        isActiveTurn: roomState.turnOrder?.[roomState.currentIdx] === p.id,
        label: getTeamOf(p.id, roomState.turnOrder) === myTeam ? 'Partner' : undefined
      }))

    const roundsWon = roomState.roundsWon ?? { teamA: 0, teamB: 0 }
    const gameScores = roomState.gameScores ?? { teamA: 0, teamB: 0 }
    const scoreEntries = [
      { label: 'Round', value: roomState.roundNumber ?? 1 },
      { label: 'Team A', value: `${gameScores.teamA}pts (${roundsWon.teamA} rounds)` },
      { label: 'Team B', value: `${gameScores.teamB}pts (${roundsWon.teamB} rounds)` },
      { label: 'Trump', value: SUIT_LABEL[roomState.trumpSuit], valueClassName: SUIT_TEXT_CLASS[roomState.trumpSuit] }
    ]
    const handsThisRound = computeTeamHands(roomState.turnOrder ?? [], roomState.handsWon ?? {})

    const handWinnerId = roomState.handWinnerId
    const handWinnerName = handWinnerId ? (players.find(p => p.id === handWinnerId)?.name ?? 'Player') : null
    const centerSlot = handWinnerId ? (
      <HandWinnerOverlay
        centerCards={centerCards}
        handWinnerId={handWinnerId}
        handWinnerName={handWinnerName}
        accentColorClass="text-jade"
        unitLabel="hand"
      />
    ) : null

    return (
      <div className="flex flex-col gap-3 max-w-2xl w-full mx-auto pt-2 pb-6">
        <div className="flex flex-wrap justify-center gap-2">
          {renderLastRoundButton()}
          <LastHandButton lastHand={roomState.lastHand} players={players} accent="jade" />
        </div>
        <TableScoreBar entries={scoreEntries} />
        <p className="text-center text-textMuted text-xs">
          Hands won this round — Team A: {handsThisRound.teamA}, Team B: {handsThisRound.teamB}
        </p>
        <CardTable
          otherSeats={otherSeats}
          myHand={myHand}
          myIsActiveTurn={isMyTurn}
          centerCards={centerCards}
          centerSlot={centerSlot}
          disabledCardIds={disabledCardIds}
          highlightedCardIds={highlightedCardIds}
          onCardTap={handlePlayCard}
          accent="jade"
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

  if (phase === 'round_reveal') {
    const openSeats = room?.openSeats ?? []
    const isSpectator = (room?.spectators ?? []).some(p => p.id === myId)
    return (
      <RoundRevealScreen
        lastRoundResult={roomState.lastRoundResult}
        players={players}
        turnOrder={roomState.turnOrder ?? []}
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
            // gameScores/roundsWon are keyed by team, not player id, so
            // they need no remap — turnOrder positions still decide team
            // membership. nextCallerId is the one live id-pointer: it's
            // who calls trump for the NEXT round, set to the just-finished
            // round's hand-13 winner.
            const statePatch = {
              turnOrder: roomState.turnOrder.map(id => id === seatPlayerId ? myId : id)
            }
            if (roomState.nextCallerId === seatPlayerId) statePatch.nextCallerId = myId
            claimSeat(seatPlayerId, statePatch)
          }
        }}
      />
    )
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        turnOrder={roomState.turnOrder ?? []}
        players={players}
        gameWinner={roomState.lastRoundResult?.gameWinner}
        gameScores={roomState.gameScores ?? { teamA: 0, teamB: 0 }}
        roundsWon={roomState.roundsWon ?? { teamA: 0, teamB: 0 }}
        myId={myId}
        isHost={isHost}
        onRematch={handleRematch}
        onHome={() => navigate('/')}
      />
    )
  }

  return null
}
