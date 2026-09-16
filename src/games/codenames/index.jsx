import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineRoom } from '../../hooks/useOnlineRoom'
import { WORD_BANKS } from './words'
import { pickWords, buildBoard, remainingCounts, checkWordsWin, maxGuesses } from './codenamesLogic'
import { LobbyScreen } from './LobbyScreen'
import { BoardScreen } from './BoardScreen'
import { ResultsScreen } from './ResultsScreen'
import { awardXP } from '../../services/xp'
import { writeGameStats } from '../../services/stats'
import { awardBadge } from '../../services/profile'
import metadata from './metadata'

const EMPTY_TEAMS = { red: [], blue: [] }
const EMPTY_SPYMASTERS = { red: null, blue: null }

export default function Codenames({ code }) {
  const navigate = useNavigate()
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

  // ── Host: resolve the first pending REVEAL/PASS action ──────────────────
  useEffect(() => {
    if (!isHost || phase !== 'playing' || !roomState.currentClue) return
    const action = actions.find(a => a.type === 'REVEAL' || a.type === 'PASS')
    if (!action || processingRef.current) return
    processingRef.current = true
    ;(async () => {
      try {
        await resolveAction(action)
      } finally {
        processingRef.current = false
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, isHost, phase, roomState.currentClue])

  async function resolveAction(action) {
    const current = roomStateRef.current
    await clearActions()
    if (action.type === 'PASS') {
      const nextTeam = current.activeTeam === 'red' ? 'blue' : 'red'
      await persist({ activeTeam: nextTeam, currentClue: null, guessesUsed: 0 })
      return
    }
    const cardId = action.payload?.cardId
    const tapped = current.board.find(c => c.id === cardId)
    if (!tapped || tapped.revealed) return
    const board = current.board.map(c => (c.id === cardId ? { ...c, revealed: true } : c))

    if (tapped.color === 'assassin') {
      const winner = current.activeTeam === 'red' ? 'blue' : 'red'
      await persist({ board, phase: 'results', winner, loseReason: 'assassin' })
      return
    }
    const winnerByWords = checkWordsWin(board)
    if (winnerByWords) {
      await persist({ board, phase: 'results', winner: winnerByWords, loseReason: 'words' })
      return
    }
    if (tapped.color !== current.activeTeam) {
      const nextTeam = current.activeTeam === 'red' ? 'blue' : 'red'
      await persist({ board, activeTeam: nextTeam, currentClue: null, guessesUsed: 0 })
      return
    }
    const guessesUsed = (current.guessesUsed ?? 0) + 1
    if (guessesUsed >= maxGuesses(current.currentClue.number)) {
      const nextTeam = current.activeTeam === 'red' ? 'blue' : 'red'
      await persist({ board, activeTeam: nextTeam, currentClue: null, guessesUsed: 0 })
    } else {
      await persist({ board, guessesUsed })
    }
  }

  // ── Lobby handlers ────────────────────────────────────────────────────────
  function handleJoinTeam(team) {
    const current = roomStateRef.current
    const teams = current.teams ?? EMPTY_TEAMS
    const spymasterIds = current.spymasterIds ?? EMPTY_SPYMASTERS
    const otherTeam = team === 'red' ? 'blue' : 'red'
    const newTeams = {
      [team]: teams[team].includes(myId) ? teams[team] : [...teams[team], myId],
      [otherTeam]: teams[otherTeam].filter(id => id !== myId),
    }
    const newSpymasterIds = { ...spymasterIds }
    if (newSpymasterIds[otherTeam] === myId) newSpymasterIds[otherTeam] = null
    persist({ teams: newTeams, spymasterIds: newSpymasterIds })
  }

  function handleBecomeSpymaster(team) {
    const current = roomStateRef.current
    const spymasterIds = current.spymasterIds ?? EMPTY_SPYMASTERS
    persist({ spymasterIds: { ...spymasterIds, [team]: myId } })
  }

  function handleSetLang(lang) {
    persist({ lang })
  }

  async function handleStartGame() {
    setStarting(true)
    try {
      const current = roomStateRef.current
      const lang = current.lang ?? 'en'
      const startingTeam = Math.random() < 0.5 ? 'red' : 'blue'
      const words = pickWords(WORD_BANKS[lang], 25)
      const board = buildBoard(words, startingTeam)
      processingRef.current = false
      await clearActions()
      await persist({
        phase: 'playing',
        board,
        activeTeam: startingTeam,
        currentClue: null,
        guessesUsed: 0,
        winner: null,
        loseReason: null,
      })
    } finally {
      setStarting(false)
    }
  }

  // ── Playing handlers ──────────────────────────────────────────────────────
  function handleSubmitClue(word, number) {
    persist({ currentClue: { word, number }, guessesUsed: 0 })
  }

  function handleTapCard(cardId) {
    sendAction({ type: 'REVEAL', payload: { cardId } })
  }

  function handlePass() {
    sendAction({ type: 'PASS', payload: {} })
  }

  async function handleRematch() {
    await clearActions()
    await setState({})
  }

  // ── XP / stats / badge on results ────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results' || !myId || xpAwarded.current) return
    xpAwarded.current = true
    const teams = roomState.teams ?? EMPTY_TEAMS
    const myTeam = teams.red.includes(myId) ? 'red' : teams.blue.includes(myId) ? 'blue' : null
    const isWinner = !!myTeam && myTeam === roomState.winner
    awardXP(isWinner ? 100 : 20, room?.roomType)
    if (room?.roomType === 'ranked') {
      writeGameStats('codenames', { won: isWinner, gamesPlayed: 1 })
    }
    if (isWinner) awardBadge(metadata.onlineBadge.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── Render ────────────────────────────────────────────────────────────────
  if (!room || !myId) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <p className="text-textMuted animate-pulse">Connecting…</p>
      </div>
    )
  }

  if (phase === 'waiting') {
    return (
      <LobbyScreen
        isHost={isHost}
        minPlayers={metadata.minPlayers}
        players={players}
        myId={myId}
        teams={roomState.teams ?? EMPTY_TEAMS}
        spymasterIds={roomState.spymasterIds ?? EMPTY_SPYMASTERS}
        lang={roomState.lang ?? 'en'}
        onJoinTeam={handleJoinTeam}
        onBecomeSpymaster={handleBecomeSpymaster}
        onSetLang={handleSetLang}
        onStart={handleStartGame}
        starting={starting}
      />
    )
  }

  if (phase === 'playing') {
    const teams = roomState.teams ?? EMPTY_TEAMS
    const spymasterIds = roomState.spymasterIds ?? EMPTY_SPYMASTERS
    const myTeam = teams.red.includes(myId) ? 'red' : teams.blue.includes(myId) ? 'blue' : null
    const isSpymaster = !!myTeam && spymasterIds[myTeam] === myId
    const activeTeam = roomState.activeTeam
    const currentClue = roomState.currentClue
    return (
      <BoardScreen
        board={roomState.board ?? []}
        isSpymaster={isSpymaster}
        myTeam={myTeam}
        activeTeam={activeTeam}
        currentClue={currentClue}
        guessesUsed={roomState.guessesUsed ?? 0}
        maxGuessesAllowed={currentClue ? maxGuesses(currentClue.number) : 0}
        remaining={remainingCounts(roomState.board ?? [])}
        canGiveClue={isSpymaster && myTeam === activeTeam && !currentClue}
        canGuess={myTeam === activeTeam && !isSpymaster && !!currentClue}
        onSubmitClue={handleSubmitClue}
        onTapCard={handleTapCard}
        onPass={handlePass}
      />
    )
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        players={players}
        teams={roomState.teams ?? EMPTY_TEAMS}
        winner={roomState.winner}
        loseReason={roomState.loseReason}
        myId={myId}
        isHost={isHost}
        onRematch={handleRematch}
        onHome={() => navigate('/')}
      />
    )
  }

  return null
}
