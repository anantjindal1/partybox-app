import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useTurnVibration } from '../../hooks/useTurnVibration'
import { useLang } from '../../store/LangContext'
import { createDeck, shuffleDeck, parseCard } from '../../multiplayer/deck'
import { removeCardFromHand, addCardsToHand, sortHand } from '../../multiplayer/hand'
import { dealAll } from '../../multiplayer/deal'
import { resolveTrick, getLegalPlays } from '../../multiplayer/trick'
import { otherPlayersInSeatOrder } from '../../multiplayer/partnerships'
import { CardTable } from '../../components/cards/CardTable'
import { PlayingCard } from '../../components/cards/PlayingCard'
import { LastHandButton } from '../../components/cards/LastHandButton'
import { GameRulesPanel } from '../../components/GameRulesPanel'
import { ResultsScreen } from './ResultsScreen'
import { findAceOfSpadesHolder, breaksSuit, rotateActiveFrom } from './bhabhiLogic'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import metadata from './metadata'

const SUIT_LABEL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }
const REVEAL_PAUSE_MS = 1800

export default function Bhabhi({ code }) {
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
  useTurnVibration(phase === 'playing' && !roomState.pileResult && roomState.pileParticipants?.[roomState.pileIdx ?? 0] === myId)
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
    const current = roomState.pileParticipants?.[roomState.pileIdx]
    const action = actions.find(a => a.playerId === current && a.type === 'PLAY')
    if (!action) return
    processingRef.current = true
    ;(async () => {
      try {
        await applyPlay(action.payload.cardId)
      } finally {
        processingRef.current = false
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.pileIdx])

  async function applyPlay(cardId) {
    const current = roomStateRef.current
    const actingPlayerId = current.pileParticipants[current.pileIdx]
    const newHand = removeCardFromHand(current.hands[actingPlayerId], cardId)
    const newHands = { ...current.hands, [actingPlayerId]: newHand }
    const newPile = [...current.pile, { playerId: actingPlayerId, card: cardId }]
    const newLedSuit = current.ledSuit ?? parseCard(cardId).suit

    // First player to get rid of every card wins, and the game ends on
    // the spot — whatever the pile was about to resolve to no longer matters.
    if (newHand.length === 0) {
      await clearActions()
      await persist({
        hands: newHands,
        pile: [],
        pileResult: null,
        phase: 'results',
        winners: [actingPlayerId]
      })
      return
    }

    const brokeSuit = breaksSuit(cardId, current.ledSuit, current.isFirstRound)
    const pileComplete = newPile.length === current.pileParticipants.length

    if (!brokeSuit && !pileComplete) {
      // Pile continues — next participant's turn.
      await clearActions()
      await persist({
        hands: newHands,
        pile: newPile,
        ledSuit: newLedSuit,
        pileIdx: current.pileIdx + 1
      })
      return
    }

    const outcome = brokeSuit ? 'pickup' : 'discard'
    // The highest card of the led suit — resolveTrick already ignores
    // anything off-suit, so this same call is correct whether the pile
    // ran to full length or was cut short by a broken suit.
    const highCardId = resolveTrick(newPile, newLedSuit, null)

    // Hold the pile + outcome on screen for a beat before applying it —
    // same pause-then-clear pattern used by every other trick game here.
    await clearActions()
    const highCardName = players.find(p => p.id === highCardId)?.name ?? 'Player'
    await persist({
      hands: newHands,
      pile: newPile,
      ledSuit: newLedSuit,
      pileResult: { outcome, highCardId, cardCount: newPile.length },
      lastHand: {
        cards: newPile,
        winnerId: highCardId,
        message: outcome === 'discard'
          ? `Discarded — ${highCardName} led next`
          : `${highCardName} picked up ${newPile.length} cards`
      }
    })
    await new Promise(resolve => setTimeout(resolve, REVEAL_PAUSE_MS))

    const finalHands = outcome === 'pickup'
      ? { ...newHands, [highCardId]: addCardsToHand(newHands[highCardId], newPile.map(p => p.card)) }
      : newHands

    const nextParticipants = rotateActiveFrom(current.seatingOrder, current.seatingOrder, highCardId)

    await persist({
      hands: finalHands,
      pile: [],
      pileParticipants: nextParticipants,
      pileIdx: 0,
      ledSuit: null,
      isFirstRound: false,
      pileResult: null
    })
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleStartGame() {
    setStarting(true)
    try {
      const deck = shuffleDeck(createDeck())
      const playerIds = players.map(p => p.id)
      const { hands } = dealAll(deck, playerIds)
      const aceHolderId = findAceOfSpadesHolder(hands, playerIds)
      const pileParticipants = rotateActiveFrom(playerIds, playerIds, aceHolderId)
      await clearActions()
      await persist({
        phase: 'playing',
        seatingOrder: playerIds,
        hands,
        pile: [],
        pileParticipants,
        pileIdx: 0,
        ledSuit: null,
        isFirstRound: true,
        winners: [],
        lastHand: null,
        pileResult: null
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
    const isWinner = (roomState.winners ?? []).includes(myId)
    awardXP(isWinner ? 100 : 20, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('bhabhi', { won: isWinner, gamesPlayed: 1 })
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
          accent="slate"
          phase={phase}
        />
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={players.length < metadata.minPlayers || starting}
            className="min-h-[48px] rounded-xl bg-slate text-onSlate font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
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
    const pileParticipants = roomState.pileParticipants ?? []
    const currentTurnHolder = pileParticipants[roomState.pileIdx ?? 0]
    const isMyTurn = currentTurnHolder === myId
    const pileResult = roomState.pileResult
    const isInteractive = isMyTurn && !pileResult
    const mustPlayAceOfSpades = roomState.isFirstRound && (roomState.pile ?? []).length === 0
    const legalPlays = isInteractive
      ? (mustPlayAceOfSpades ? ['AS'] : getLegalPlays(myHand, roomState.ledSuit))
      : []
    const disabledCardIds = isInteractive ? myHand.filter(id => !legalPlays.includes(id)) : myHand
    const currentTurnName = players.find(p => p.id === currentTurnHolder)?.name ?? 'player'
    const highCardName = pileResult ? (players.find(p => p.id === pileResult.highCardId)?.name ?? 'Player') : null
    const centerCards = (roomState.pile ?? []).map(({ playerId, card }) => ({
      card,
      playerId,
      playerName: players.find(p => p.id === playerId)?.name
    }))
    const centerSlot = pileResult ? (
      <div className="flex flex-col items-center gap-1.5 animate-hand-settle">
        <div className="flex gap-1.5 flex-wrap justify-center">
          {centerCards.map(entry => {
            const { rank, suit } = parseCard(entry.card)
            const isHighCard = entry.playerId === pileResult.highCardId
            return (
              <div key={entry.card} className="flex flex-col items-center gap-1">
                <PlayingCard
                  face="up"
                  rank={rank}
                  suit={suit}
                  size="sm"
                  className={isHighCard ? 'shadow-[0_0_0_3px_var(--color-accent-gold)]' : ''}
                />
                {entry.playerName && <span className="text-[10px] text-textMuted">{entry.playerName}</span>}
              </div>
            )
          })}
        </div>
        <p className="text-xs font-bold text-slate text-center">
          {pileResult.outcome === 'discard'
            ? `Discarded — ${highCardName} leads next!`
            : `${highCardName} couldn't follow suit — picks up ${pileResult.cardCount} cards!`}
        </p>
      </div>
    ) : null

    const otherSeats = otherPlayersInSeatOrder(players, roomState.seatingOrder, myId)
      .map(p => ({
        player: p,
        cardCount: roomState.hands?.[p.id]?.length ?? 0,
        isActiveTurn: currentTurnHolder === p.id
      }))

    return (
      <div className="flex flex-col gap-3 max-w-2xl w-full mx-auto pt-2 pb-6">
        <LastHandButton lastHand={roomState.lastHand} players={players} accent="slate" />
        <CardTable
          otherSeats={otherSeats}
          myHand={myHand}
          myIsActiveTurn={isMyTurn}
          centerCards={centerCards}
          centerSlot={centerSlot}
          disabledCardIds={disabledCardIds}
          onCardTap={handlePlayCard}
          accent="slate"
        />
        <p className="text-center text-textMuted text-sm py-2">
          {mustPlayAceOfSpades && isMyTurn
            ? 'You open with the Ace of Spades'
            : !isMyTurn
              ? `Waiting for ${currentTurnName} to play...`
              : roomState.ledSuit
                ? `Follow suit: ${SUIT_LABEL[roomState.ledSuit]} (or play anything if you can't — but whoever's ahead in ${SUIT_LABEL[roomState.ledSuit]} picks up the pile!)`
                : 'Lead any card'}
        </p>
      </div>
    )
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        players={players}
        winners={roomState.winners ?? []}
        myId={myId}
        isHost={isHost}
        onRematch={handleRematch}
        onHome={() => navigate('/')}
      />
    )
  }

  return null
}
