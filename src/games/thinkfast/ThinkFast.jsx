/**
 * ThinkFast — local turn-based 2–6 player quiz.
 * Uses GameChrome, awardXP for round winner at game_end.
 */
import { useReducer, useEffect, useRef } from 'react'
import { useLang } from '../../store/LangContext'
import { GameChrome } from '../../components/GameChrome'
import { ResumeGate } from '../../components/ResumeGate'
import { useGamePersistence } from '../../hooks/useGamePersistence'
import { clearSavedState } from '../../services/gameStatePersistence'
import { awardXP } from '../../services/xp'
import { getInitialState, rapidFireQuizReducer, ACTIONS, isRoundEnd } from './reducer'
import { calculateWinner, calculatePlayerXP } from './scoring'
import { SetupScreen } from './SetupScreen'
import { CategorySelectScreen } from './CategorySelectScreen'
import { QuestionScreen } from './QuestionScreen'
import { ResultScreen } from './ResultScreen'
import { FadeIn } from '../../components/FadeIn'
import { resolveTitle } from '../../utils/strings'

export default function ThinkFast({ slug, gameTitle }) {
  const { lang } = useLang()
  const [state, dispatch] = useReducer(rapidFireQuizReducer, undefined, getInitialState)
  const xpAwardedRef = useRef(false)

  const { showResumeGate, resume, startNew } = useGamePersistence(slug, (saved) => {
    dispatch({ type: ACTIONS.RESTORE_STATE, payload: saved })
  })

  useEffect(() => {
    if (!isRoundEnd(state)) {
      xpAwardedRef.current = false
      return
    }
    const winnerIndex = calculateWinner(state.players)
    dispatch({ type: ACTIONS.CALCULATE_WINNER, payload: { winnerIndex } })
  }, [state.phase, state.players])

  useEffect(() => {
    if (state.phase !== 'game_end') {
      xpAwardedRef.current = false
      return
    }
    if (xpAwardedRef.current) return
    xpAwardedRef.current = true
    const winnerIndex = state.winnerIndex ?? 0
    const winner = state.players[winnerIndex]
    if (winner) {
      const xp = calculatePlayerXP(winner.correctCount, true)
      if (xp > 0) awardXP(xp).catch(() => {})
    }
    clearSavedState(slug)
  }, [state.phase, state.winnerIndex, state.players, slug])

  const title = resolveTitle(gameTitle, lang)

  if (showResumeGate) {
    return <ResumeGate gameTitle={title} onResume={resume} onNewGame={startNew} />
  }

  const phaseKey = (state.phase === 'question_show' || state.phase === 'answer_selected') ? 'question' : state.phase

  return (
    <GameChrome slug={slug} gameTitle={title} state={state}>
      <FadeIn key={phaseKey}>
        {state.phase === 'setup' && <SetupScreen state={state} dispatch={dispatch} lang={lang} />}
        {state.phase === 'category_select' && (
          <CategorySelectScreen state={state} dispatch={dispatch} />
        )}
        {(state.phase === 'question_show' || state.phase === 'answer_selected') && (
          <QuestionScreen state={state} dispatch={dispatch} />
        )}
        {state.phase === 'round_end' && (
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-zinc-400">Calculating winner...</p>
          </div>
        )}
        {state.phase === 'game_end' && <ResultScreen state={state} dispatch={dispatch} />}
      </FadeIn>
    </GameChrome>
  )
}
