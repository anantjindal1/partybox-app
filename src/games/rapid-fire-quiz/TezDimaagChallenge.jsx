/**
 * Tez Dimaag Challenge — local turn-based 2–6 player quiz.
 * Uses GameChrome, awardXP for round winner at game_end.
 */
import { useReducer, useEffect, useRef, useState } from 'react'
import { useLang } from '../../store/LangContext'
import { useGameTheme } from '../../store/GameThemeContext'
import { GameChrome } from '../../components/GameChrome'
import { getSavedState, clearSavedState } from '../../services/gameStatePersistence'
import { awardXP } from '../../services/xp'
import { getInitialState, rapidFireQuizReducer, ACTIONS, isRoundEnd } from './reducer'
import { calculateWinner, calculatePlayerXP } from './scoring'
import { SetupScreen } from './SetupScreen'
import { CategorySelectScreen } from './CategorySelectScreen'
import { QuestionScreen } from './QuestionScreen'
import { ResultScreen } from './ResultScreen'
import { FadeIn } from '../../components/FadeIn'

export default function TezDimaagChallenge({ slug, gameTitle }) {
  const { t, lang } = useLang()
  const savedState = getSavedState(slug)
  const [showResumeGate, setShowResumeGate] = useState(!!savedState)
  const [state, dispatch] = useReducer(rapidFireQuizReducer, undefined, getInitialState)
  const xpAwardedRef = useRef(false)

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

  if (showResumeGate && savedState) {
    const titleStr = typeof gameTitle === 'object' ? (gameTitle.en || gameTitle.hi) : gameTitle
    return (
      <ResumeGate
        gameTitle={titleStr}
        t={t}
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

function ResumeGate({ gameTitle, t, onResume, onNewGame }) {
  const { theme } = useGameTheme()
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col items-center justify-center px-6 gap-6`}>
      <p className="text-5xl">⏸</p>
      <h2 className="text-xl font-bold">{gameTitle}</h2>
      <p className={theme.textMuted}>{t('gamesInProgress')}</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={onResume}
          className={`px-6 py-3 rounded-xl font-semibold ${theme.accentBg} ${theme.accentBgHover} text-zinc-900`}
        >
          {t('resumeGame')}
        </button>
        <button
          onClick={onNewGame}
          className={`px-6 py-3 rounded-xl border ${theme.border} ${theme.card} ${theme.cardHover} font-semibold`}
        >
          {t('newGame')}
        </button>
      </div>
    </div>
  )
}
