import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useLang } from '../../store/LangContext'
import { createDeck, shuffleDeck, parseCard } from '../../multiplayer/deck'
import { removeCardFromHand, addCardsToHand, sortHand } from '../../multiplayer/hand'
import { dealAll } from '../../multiplayer/deal'
import { resolveTrick, getLegalPlays } from '../../multiplayer/trick'
import { CardTable } from '../../components/cards/CardTable'
import { PlayingCard } from '../../components/cards/PlayingCard'
import { GameRulesPanel } from '../../components/GameRulesPanel'
import { ResultsScreen } from './ResultsScreen'
import { findAceOfSpadesHolder, breaksSuit, rotateActiveFrom, nextActiveAfterSeat } from './bhabhiLogic'
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

    // Getting rid of your last card wins — immediately, regardless of
    // whether the pile itself has finished resolving. Your card stays in
    // the pile for suit-resolution purposes either way.
    let newWinners = current.winners
    let newTurnOrder = current.turnOrder
    if (newHand.length === 0) {
      newWinners = [...current.winners, actingPlayerId]
      newTurnOrder = current.turnOrder.filter(id => id !== actingPlayerId)
    }

    const brokeSuit = breaksSuit(cardId, current.ledSuit, current.isFirstRound)
    const pileComplete = newPile.length === current.pileParticipants.length

    if (!brokeSuit && !pileComplete) {
      // Pile continues — next participant's turn.
      await clearActions()
      await persist({
        hands: newHands,
        winners: newWinners,
        turnOrder: newTurnOrder,
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

    // Whoever actually leads next (and, for a pickup, receives the pile):
    // normally the highest-card player, UNLESS they also just emptied
    // their hand on this very pile (Special Rule 4) — leadership then
    // skips to the next still-active player after their seat. The same
    // fallback covers the pickup case too: if the "should pick up" player
    // has already won and left, the next active player after them
    // inherits both the pile and the lead. Computed BEFORE the reveal
    // persist so the banner can name the real next leader, not just the
    // raw highest-card player (who may have already won and left).
    const leaderId = newTurnOrder.length <= 1
      ? null
      : newTurnOrder.includes(highCardId)
        ? highCardId
        : nextActiveAfterSeat(current.seatingOrder, newTurnOrder, highCardId)

    // Hold the pile + outcome on screen for a beat before applying it —
    // same pause-then-clear pattern used by every other trick game here.
    await clearActions()
    await persist({
      hands: newHands,
      winners: newWinners,
      turnOrder: newTurnOrder,
      pile: newPile,
      ledSuit: newLedSuit,
      pileResult: { outcome, highCardId, leaderId, cardCount: newPile.length }
    })
    await new Promise(resolve => setTimeout(resolve, REVEAL_PAUSE_MS))

    if (newTurnOrder.length === 1) {
      await persist({
        phase: 'results',
        loserId: newTurnOrder[0],
        pile: [],
        pileResult: null
      })
      return
    }

    // Rare edge case the real rules don't cover: the last two (or more)
    // active players can empty their hands on the very same pile (each
    // was already down to their final card). Nobody's left holding
    // cards, so there's no Bhabhi this game — everyone remaining shares
    // the win, rather than forcing an artificial tie-break we were
    // explicitly asked not to build (the shoot-out, Special Rule 4B).
    if (newTurnOrder.length === 0) {
      await persist({
        phase: 'results',
        loserId: null,
        pile: [],
        pileResult: null
      })
      return
    }

    const finalHands = outcome === 'pickup'
      ? { ...newHands, [leaderId]: addCardsToHand(newHands[leaderId], newPile.map(p => p.card)) }
      : newHands

    const nextParticipants = rotateActiveFrom(current.seatingOrder, newTurnOrder, leaderId)

    await persist({
      hands: finalHands,
      turnOrder: newTurnOrder,
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
        turnOrder: playerIds,
        hands,
        pile: [],
        pileParticipants,
        pileIdx: 0,
        ledSuit: null,
        isFirstRound: true,
        winners: [],
        loserId: null,
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
    const isWinner = myId !== roomState.loserId
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
    const winners = roomState.winners ?? []
    if (winners.includes(myId)) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center py-12 gap-2">
          <p className="text-lg font-bold text-textPrimary">You got away! 🎉</p>
          <p className="text-sm text-textMuted">Watching the rest of the game…</p>
        </div>
      )
    }

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
    const leaderName = pileResult?.leaderId ? (players.find(p => p.id === pileResult.leaderId)?.name ?? 'Player') : null
    // Special Rule 4 (and the equivalent pickup edge case): the highest
    // card's player can have already emptied their hand and left on that
    // very play, so the pile's actual next leader can differ from whoever
    // played the winning card — the banner names both when that happens.
    const highCardAlreadyLeft = pileResult && pileResult.leaderId !== pileResult.highCardId

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
          {pileResult.outcome === 'discard' ? (
            highCardAlreadyLeft
              ? `${highCardName} won and got away! ${leaderName ?? 'The next player'} leads next.`
              : `Discarded — ${leaderName ?? highCardName} leads next!`
          ) : highCardAlreadyLeft ? (
            `${highCardName} already got away — ${leaderName} picks up ${pileResult.cardCount} cards instead!`
          ) : (
            `${highCardName} couldn't follow suit — picks up ${pileResult.cardCount} cards!`
          )}
        </p>
      </div>
    ) : null

    const otherSeats = players
      .filter(p => p.id !== myId)
      .map(p => ({
        player: p,
        cardCount: roomState.hands?.[p.id]?.length ?? 0,
        isActiveTurn: currentTurnHolder === p.id,
        label: winners.includes(p.id) ? 'Won! 🎉' : undefined
      }))

    return (
      <div className="flex flex-col gap-3 max-w-2xl w-full mx-auto pt-2 pb-6">
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
        loserId={roomState.loserId}
        myId={myId}
        isHost={isHost}
        onRematch={handleRematch}
        onHome={() => navigate('/')}
      />
    )
  }

  return null
}
