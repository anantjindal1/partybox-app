/**
 * A to Z Dhamaka — local pass-device 2–6 player categories game.
 * Fully offline, GameChrome, optional persistence. Assisted mode: tap suggestions.
 */
import { useReducer, useEffect, useRef } from 'react'
import { useLang } from '../../store/LangContext'
import { GameChrome } from '../../components/GameChrome'
import { ResumeGate } from '../../components/ResumeGate'
import { useGamePersistence } from '../../hooks/useGamePersistence'
import { awardXP } from '../../services/xp'
import { getInitialState, categoriesReducer, ACTIONS } from './reducer'
import { hasWord } from './dictionary'
import { buildDuplicateMap, calculatePlayerXP, getRoundWinnerIndex } from './scoring'
import { SetupScreen } from './SetupScreen'
import { RoundScreen } from './RoundScreen'
import { RevealScreen } from './RevealScreen'
import { ResultScreen } from './ResultScreen'
import { FadeIn } from '../../components/FadeIn'
import { resolveTitle } from '../../utils/strings'

export default function AtoZDhamaka({ slug, gameTitle }) {
  const { lang } = useLang()
  const [state, dispatch] = useReducer(categoriesReducer, undefined, getInitialState)
  const xpAwardedRef = useRef(false)

  const { showResumeGate, resume, startNew } = useGamePersistence(slug, (saved) => {
    dispatch({ type: ACTIONS.RESTORE_STATE, payload: saved })
  })

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

  const title = resolveTitle(gameTitle, lang)

  if (showResumeGate) {
    return <ResumeGate gameTitle={title} onResume={resume} onNewGame={startNew} />
  }

  const phase = state.phase || 'setup'

  return (
    <GameChrome slug={slug} gameTitle={title} state={state}>
      <FadeIn key={phase}>
        {phase === 'setup'       && <SetupScreen state={state} dispatch={dispatch} />}
        {phase === 'round_active' && <RoundScreen state={state} dispatch={dispatch} />}
        {phase === 'reveal'      && <RevealScreen state={state} dispatch={dispatch} />}
        {phase === 'round_end'   && <ResultScreen state={state} dispatch={dispatch} />}
        {!['setup', 'round_active', 'reveal', 'round_end'].includes(phase) && (
          <div className="min-h-screen flex items-center justify-center text-zinc-400">
            <p>Loading…</p>
          </div>
        )}
      </FadeIn>
    </GameChrome>
  )
}
