/**
 * Desi Memory Master — main game container. Offline, uses GameChrome, persistence, and XP.
 */
import { useReducer, useEffect, useRef, useState } from 'react'
import { useLang } from '../../store/LangContext'
import { useGameTheme } from '../../store/GameThemeContext'
import { GameChrome } from '../../components/GameChrome'
import { ResumeGate } from '../../components/ResumeGate'
import { useGamePersistence } from '../../hooks/useGamePersistence'
import { clearSavedState } from '../../services/gameStatePersistence'
import { awardXP } from '../../services/xp'
import { getInitialState, desiMemoryMasterReducer, ACTIONS, isGameComplete } from './reducer'
import { generateBoard } from './boardUtils'
import { calculateXP } from './scoring'
import { updateBests } from './persistence'
import { SetupScreen } from './SetupScreen'
import { Board } from './Board'
import { ResultScreen } from './ResultScreen'
import { FadeIn } from '../../components/FadeIn'
import { resolveTitle } from '../../utils/strings'

export default function DesiMemoryMaster({ slug, gameTitle }) {
  const { lang } = useLang()
  const [state, dispatch] = useReducer(desiMemoryMasterReducer, undefined, getInitialState)
  const matchCheckTimeoutRef = useRef(null)
  const timerRef = useRef(null)
  const completedRef = useRef(false)

  const { showResumeGate, resume, startNew } = useGamePersistence(slug, (saved) => {
    dispatch({ type: ACTIONS.RESTORE_STATE, payload: saved })
  })

  // When entering board_generate, generate board and dispatch GENERATE_BOARD (reducer stays pure)
  useEffect(() => {
    if (state.phase !== 'board_generate') return
    const startTime = Date.now()
    const board = generateBoard(state.difficulty, state.theme)
    dispatch({ type: ACTIONS.GENERATE_BOARD, payload: { board, startTime } })
  }, [state.phase, state.difficulty, state.theme])

  // When 2 cards flipped, run CHECK_MATCH
  useEffect(() => {
    if (state.phase !== 'playing') return
    const flipped = state.flippedIndices || []
    if (flipped.length !== 2) return
    dispatch({ type: ACTIONS.CHECK_MATCH })
  }, [state.phase, state.flippedIndices])

  useEffect(() => {
    if (state.phase !== 'match_check') return
    matchCheckTimeoutRef.current = setTimeout(() => {
      dispatch({ type: ACTIONS.RESET_FLIPPED })
    }, 800)
    return () => {
      if (matchCheckTimeoutRef.current) clearTimeout(matchCheckTimeoutRef.current)
    }
  }, [state.phase])

  // When all matched, complete game, update persistence, award XP (once per game)
  useEffect(() => {
    const phase = state.phase
    if (phase === 'setup' || phase === 'board_generate') {
      completedRef.current = false
      return
    }
    if (phase !== 'playing' && phase !== 'match_check') return
    if (!isGameComplete(state)) return
    if (completedRef.current) return
    completedRef.current = true
    const startTime = state.startTime || Date.now()
    const elapsedMs = Date.now() - startTime
    const elapsedSec = elapsedMs / 1000
    const mistakes = state.mistakes ?? 0
    const { bestTime, leastMistakes } = updateBests(state.difficulty, elapsedSec, mistakes)
    const isPersonalBest = (state.bestTime == null || elapsedSec <= state.bestTime) &&
      (state.leastMistakes == null || mistakes <= state.leastMistakes)
    dispatch({
      type: ACTIONS.COMPLETE_GAME,
      payload: { elapsedTime: elapsedMs, bestTime, leastMistakes }
    })
    const xp = calculateXP(isPersonalBest)
    awardXP(xp).catch(() => {})
    clearSavedState(slug)
  }, [state.phase, state.board, state.matchedIndices, state.startTime, state.mistakes, state.difficulty, slug])

  // Live timer when playing
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (state.phase !== 'playing' && state.phase !== 'match_check') return
    timerRef.current = setInterval(() => setNow(Date.now()), 200)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state.phase])
  const elapsedMs = (state.phase === 'playing' || state.phase === 'match_check') && state.startTime
    ? now - state.startTime
    : (state.elapsedTime ?? 0)

  const title = resolveTitle(gameTitle, lang)

  if (showResumeGate) {
    return <ResumeGate gameTitle={title} onResume={resume} onNewGame={startNew} />
  }

  return (
    <GameChrome slug={slug} gameTitle={title} state={state}>
      <FadeIn key={state.phase === 'match_check' ? 'playing' : state.phase}>
        {state.phase === 'setup' && (
          <SetupScreen state={state} dispatch={dispatch} lang={lang} />
        )}
        {(state.phase === 'playing' || state.phase === 'board_generate' || state.phase === 'match_check') && (
          <GameScreen
            state={state}
            dispatch={dispatch}
            elapsedMs={state.phase === 'game_complete' ? (state.elapsedTime ?? 0) : elapsedMs}
          />
        )}
        {state.phase === 'game_complete' && (
          <ResultScreen
            state={{ ...state, elapsedTime: state.elapsedTime ?? 0 }}
            dispatch={dispatch}
            onPlayAgain={() => dispatch({ type: ACTIONS.RESET })}
            lang={lang}
          />
        )}
      </FadeIn>
    </GameChrome>
  )
}

function GameScreen({ state, dispatch, elapsedMs }) {
  const { theme } = useGameTheme()
  const board = state.board || []
  const loading = state.phase === 'board_generate' || board.length === 0

  function handleCardClick(index) {
    if (state.phase !== 'playing') return
    if ((state.flippedIndices || []).length >= 2) return
    dispatch({ type: ACTIONS.FLIP_CARD, payload: { index } })
  }

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${theme.bg} ${theme.text}`}>
        <p className={theme.textMuted}>Loading board...</p>
      </div>
    )
  }

  const timeSec = Math.floor(elapsedMs / 1000)
  const mistakes = state.mistakes ?? 0

  return (
    <div className={`flex-1 flex flex-col px-4 pb-8 ${theme.bg} ${theme.text}`}>
      <div className="flex justify-between items-center py-3 mb-4">
        <span className={`text-lg font-semibold ${theme.accent}`}>⏱ {timeSec}s</span>
        <span className={theme.textMuted}>Mistakes: {mistakes}</span>
      </div>
      <div className="flex-1 min-h-0">
        <Board
          board={board}
          flippedIndices={state.flippedIndices || []}
          matchedIndices={state.matchedIndices || []}
          onCardClick={handleCardClick}
          disabled={state.phase === 'match_check'}
        />
      </div>
    </div>
  )
}
