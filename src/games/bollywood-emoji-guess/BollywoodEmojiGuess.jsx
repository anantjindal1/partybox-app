/**
 * Bollywood Emoji Guess — main game container. Offline, uses GameChrome, persistence, awardXP.
 */
import { useReducer, useEffect, useRef, useState } from 'react'
import { useLang } from '../../store/LangContext'
import { useGameTheme } from '../../store/GameThemeContext'
import { GameChrome } from '../../components/GameChrome'
import { getSavedState, clearSavedState } from '../../services/gameStatePersistence'
import { checkAndUpdateHighScore, getHighScore } from '../../services/highScores'
import { awardXP } from '../../services/xp'
import { getInitialState, bollywoodEmojiGuessReducer, ACTIONS } from './reducer'
import { calculateSessionXP } from './scoring'
import { SetupScreen } from './SetupScreen'
import { QuestionScreen } from './QuestionScreen'
import { ResultScreen } from './ResultScreen'
import { FadeIn } from '../../components/FadeIn'

/** Called when phase becomes session_end; used by BollywoodEmojiGuess and tests. */
export function runSessionEndXP(state, awardXPFn = awardXP) {
  const correctCount = state.answers.filter(a => a.correct).length
  const xp = calculateSessionXP(state.score, correctCount)
  if (xp > 0) return awardXPFn(xp).catch(() => {})
  return Promise.resolve()
}

export default function BollywoodEmojiGuess({ slug, gameTitle }) {
  const { t, lang } = useLang()
  const savedState = getSavedState(slug)
  const [showResumeGate, setShowResumeGate] = useState(!!savedState)
  const [state, dispatch] = useReducer(bollywoodEmojiGuessReducer, undefined, getInitialState)
  const xpAwardedRef = useRef(false)
  const [isNewRecord, setIsNewRecord] = useState(false)

  useEffect(() => {
    if (state.phase !== 'session_end') {
      xpAwardedRef.current = false
      return
    }
    if (xpAwardedRef.current) return
    xpAwardedRef.current = true
    clearSavedState(slug)
    runSessionEndXP(state)
    const { isNewRecord: newRecord } = checkAndUpdateHighScore(slug, state.score)
    setIsNewRecord(newRecord)
  }, [state.phase, state.answers, slug])

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

  return (
    <GameChrome slug={slug} gameTitle={gameTitle} state={state}>
      <FadeIn key={state.phase === 'answer_selected' ? 'question_show' : state.phase}>
        {state.phase === 'setup' && (
          <SetupScreen state={state} dispatch={dispatch} lang={lang} slug={slug} />
        )}
        {(state.phase === 'question_show' || state.phase === 'answer_selected') && (
          <QuestionScreen state={state} dispatch={dispatch} />
        )}
        {state.phase === 'session_end' && (
          <ResultScreen state={state} dispatch={dispatch} isNewRecord={isNewRecord} personalBest={getHighScore(slug)} />
        )}
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
