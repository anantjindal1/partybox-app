/**
 * A to Z Dhamaka — local pass-device 2–6 player categories game.
 * Fully offline, GameChrome, optional persistence. Assisted mode: tap suggestions.
 */
import { useReducer, useEffect, useRef, useState } from 'react'
import { useGameTheme } from '../../store/GameThemeContext'
import { GameChrome } from '../../components/GameChrome'
import { getSavedState, clearSavedState } from '../../services/gameStatePersistence'
import { awardXP } from '../../services/xp'
import { getInitialState, categoriesReducer, ACTIONS } from './reducer'
import { hasWord } from './dictionary'
import { buildDuplicateMap, calculatePlayerXP, getRoundWinnerIndex } from './scoring'
import { SetupScreen } from './SetupScreen'
import { RoundScreen } from './RoundScreen'
import { RevealScreen } from './RevealScreen'
import { ResultScreen } from './ResultScreen'
import { FadeIn } from '../../components/FadeIn'

export default function AtoZDhamaka({ slug, gameTitle }) {
  const savedState = getSavedState(slug)
  const [showResumeGate, setShowResumeGate] = useState(!!savedState)
  const [state, dispatch] = useReducer(categoriesReducer, undefined, getInitialState)
  const xpAwardedRef = useRef(false)

  // When we enter reveal, compute validMap and duplicateMap then apply scores
  useEffect(() => {
    if (state.phase !== 'reveal' || state.validMap) return
    const letter = state.letter || 'A'
    const categories = state.categories || []
    const players = state.players || []
    const validMap = {}
    players.forEach(p => {
      validMap[p.id] = {}
      categories.forEach(cat => {
        const word = (p.answers && p.answers[cat]) ? String(p.answers[cat]).trim() : ''
        validMap[p.id][cat] = !!word && hasWord(letter, cat, word, true)
      })
    })
    const duplicateMap = buildDuplicateMap(players, categories)
    dispatch({ type: ACTIONS.APPLY_REVEAL, payload: { validMap, duplicateMap } })
  }, [state.phase, state.letter, state.categories, state.players, state.validMap])

  // Award XP on round_end (after user sees result)
  useEffect(() => {
    if (state.phase !== 'round_end') {
      xpAwardedRef.current = false
      return
    }
    if (xpAwardedRef.current) return
    xpAwardedRef.current = true
    const winnerIndex = getRoundWinnerIndex(state.players || [])
    const players = state.players || []
    players.forEach((p, i) => {
      const validCount = p.lastRoundValidCount ?? 0
      const isWinner = i === winnerIndex
      const xp = calculatePlayerXP(validCount, isWinner)
      if (xp > 0) awardXP(xp).catch(() => {})
    })
  }, [state.phase, state.players])

  if (showResumeGate && savedState) {
    const titleStr = typeof gameTitle === 'object' ? (gameTitle.en || gameTitle.hi) : gameTitle
    return (
      <ResumeGate
        gameTitle={titleStr}
        onResume={() => {
          dispatch({ type: ACTIONS.RESTORE_STATE, payload: savedState })
          setShowResumeGate(false)
        }}
        onNewGame={() => {
          clearSavedState(slug)
          setShowResumeGate(false)
        }}
      />
    )
  }

  const title = typeof gameTitle === 'object' ? gameTitle?.en || gameTitle?.hi : gameTitle

  // Fallback if phase is unexpected (e.g. after restore)
  const phase = state.phase || 'setup'
  const showSetup = phase === 'setup'
  const showRound = phase === 'round_active'
  const showReveal = phase === 'reveal'
  const showResult = phase === 'round_end'

  return (
    <GameChrome slug={slug} gameTitle={title} state={state}>
      <FadeIn key={phase}>
        {showSetup && <SetupScreen state={state} dispatch={dispatch} />}
        {showRound && <RoundScreen state={state} dispatch={dispatch} />}
        {showReveal && <RevealScreen state={state} dispatch={dispatch} />}
        {showResult && <ResultScreen state={state} dispatch={dispatch} />}
        {!showSetup && !showRound && !showReveal && !showResult && (
          <div className="min-h-screen flex items-center justify-center text-zinc-400">
            <p>Loading…</p>
          </div>
        )}
      </FadeIn>
    </GameChrome>
  )
}

function ResumeGate({ gameTitle, onResume, onNewGame }) {
  const { theme } = useGameTheme()
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col items-center justify-center px-6 gap-6`}>
      <p className="text-5xl">⏸</p>
      <h2 className="text-xl font-bold">{gameTitle}</h2>
      <p className={theme.textMuted}>Game in progress</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={onResume}
          className={`px-6 py-3 rounded-xl font-semibold ${theme.accentBg} ${theme.accentBgHover} text-zinc-900`}
        >
          Resume
        </button>
        <button
          onClick={onNewGame}
          className={`px-6 py-3 rounded-xl border ${theme.border} ${theme.card} ${theme.cardHover} font-semibold`}
        >
          New game
        </button>
      </div>
    </div>
  )
}
