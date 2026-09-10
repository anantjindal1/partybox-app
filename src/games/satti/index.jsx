import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { useLang } from '../../store/LangContext'
import { createDeck, shuffleDeck } from '../../multiplayer/deck'
import { removeCardFromHand, sortHand } from '../../multiplayer/hand'
import { dealAll } from '../../multiplayer/deal'
import { createEmptyBoard, getLegalPlays, applyPlayToBoard, computeStalemateWinners } from './sattiLogic'
import { CardTable } from '../../components/cards/CardTable'
import { GameRulesPanel } from '../../components/GameRulesPanel'
import { SattiBoard } from './SattiBoard'
import { ResultsScreen } from './ResultsScreen'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import metadata from './metadata'

export default function Satti({ code }) {
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

  // ── Host: process the current turn-holder's play or pass ─────────────────
  useEffect(() => {
    if (!isHost || phase !== 'playing' || processingRef.current) return
    const current = roomState.turnOrder?.[roomState.currentIdx]
    const action = actions.find(a => a.playerId === current && (a.type === 'PLAY' || a.type === 'PASS'))
    if (!action) return
    processingRef.current = true
    ;(async () => {
      if (action.type === 'PLAY') await applyPlay(action.payload.cardId)
      else await applyPass()
      processingRef.current = false
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.currentIdx])

  async function applyPlay(cardId) {
    const current = roomStateRef.current
    const actingPlayerId = current.turnOrder[current.currentIdx]
    const newHand = removeCardFromHand(current.hands[actingPlayerId], cardId)
    const newBoard = applyPlayToBoard(current.board, cardId)

    // Sudden death: check BEFORE advancing the turn. The instant a hand
    // empties, the game ends right here.
    if (newHand.length === 0) {
      await clearActions()
      await persist({
        hands: { ...current.hands, [actingPlayerId]: newHand },
        board: newBoard,
        consecutivePasses: 0,
        phase: 'results',
        winnerIds: [actingPlayerId]
      })
      return
    }

    const nextIdx = (current.currentIdx + 1) % current.turnOrder.length
    await clearActions()
    await persist({
      hands: { ...current.hands, [actingPlayerId]: newHand },
      board: newBoard,
      consecutivePasses: 0,
      currentIdx: nextIdx
    })
  }

  async function applyPass() {
    const current = roomStateRef.current
    const newConsecutivePasses = current.consecutivePasses + 1

    // A full pass-around (every player in a row, no play in between)
    // ends the game immediately — fewest cards left wins.
    if (newConsecutivePasses === current.turnOrder.length) {
      const winnerIds = computeStalemateWinners(current.hands, current.turnOrder)
      await clearActions()
      await persist({
        consecutivePasses: newConsecutivePasses,
        phase: 'results',
        winnerIds
      })
      return
    }

    const nextIdx = (current.currentIdx + 1) % current.turnOrder.length
    await clearActions()
    await persist({
      consecutivePasses: newConsecutivePasses,
      currentIdx: nextIdx
    })
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleStartGame() {
    setStarting(true)
    try {
      const deck = shuffleDeck(createDeck())
      const playerIds = players.map(p => p.id)
      const { hands } = dealAll(deck, playerIds)
      await clearActions()
      await persist({
        phase: 'playing',
        turnOrder: playerIds,
        currentIdx: 0,
        hands,
        board: createEmptyBoard(),
        consecutivePasses: 0,
        winnerIds: []
      })
    } finally {
      setStarting(false)
    }
  }

  function handlePlayCard(cardId) {
    sendAction({ type: 'PLAY', payload: { cardId } })
  }

  function handlePass() {
    sendAction({ type: 'PASS', payload: {} })
  }

  async function handleRematch() {
    await clearActions()
    await setState({})
  }

  // ── XP / stats / badge on results ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results' || !myId || xpAwarded.current) return
    xpAwarded.current = true
    const isWinner = (roomState.winnerIds ?? []).includes(myId)
    awardXP(isWinner ? 100 : 20, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('satti', { won: isWinner, gamesPlayed: 1 })
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
          accent="amethyst"
          phase={phase}
        />
        {isHost ? (
          <button
            onClick={handleStartGame}
            disabled={players.length < metadata.minPlayers || starting}
            className="min-h-[48px] rounded-xl bg-amethyst text-onAmethyst font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
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
    const board = roomState.board ?? createEmptyBoard()
    const myHand = sortHand(roomState.hands?.[myId] ?? [], { aceHigh: false })
    const isMyTurn = roomState.turnOrder?.[roomState.currentIdx] === myId
    const legalPlays = isMyTurn ? getLegalPlays(myHand, board) : []
    const disabledCardIds = isMyTurn ? myHand.filter(id => !legalPlays.includes(id)) : myHand
    const mustPass = isMyTurn && legalPlays.length === 0
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
          centerSlot={<SattiBoard board={board} />}
          disabledCardIds={disabledCardIds}
          onCardTap={handlePlayCard}
          accent="amethyst"
        />
        {mustPass ? (
          <button
            onClick={handlePass}
            className="min-h-[44px] rounded-xl bg-amethyst text-onAmethyst font-bold"
          >
            No legal move — Pass →
          </button>
        ) : (
          <p className="text-center text-textMuted text-sm py-2">
            {!isMyTurn ? 'Waiting for your turn...' : 'Tap a card to play it'}
          </p>
        )}
      </div>
    )
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        players={players}
        winnerIds={roomState.winnerIds ?? []}
        hands={roomState.hands ?? {}}
        myId={myId}
        isHost={isHost}
        onRematch={handleRematch}
        onHome={() => navigate('/')}
      />
    )
  }

  return null
}
