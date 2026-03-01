import { useReducer } from 'react'
import { useLang } from '../../store/LangContext'
import { GameChrome } from '../../components/GameChrome'
import { ResumeGate } from '../../components/ResumeGate'
import { useGamePersistence } from '../../hooks/useGamePersistence'
import { useSessionXP } from '../../hooks/useSessionXP'
import { getHighScore } from '../../services/highScores'
import { awardXP } from '../../services/xp'
import { getInitialState, bollywoodEmojiGuessReducer, ACTIONS } from './reducer'
import { calculateSessionXP } from './scoring'
import { SetupScreen } from './SetupScreen'
import { QuestionScreen } from './QuestionScreen'
import { ResultScreen } from './ResultScreen'
import { FadeIn } from '../../components/FadeIn'
import { resolveTitle } from '../../utils/strings'

/** Called when phase becomes session_end; used by BollywoodEmojiGuess and tests. */
export function runSessionEndXP(state, awardXPFn = awardXP) {
  const correctCount = state.answers.filter(a => a.correct).length
  const xp = calculateSessionXP(state.score, correctCount)
  if (xp > 0) return awardXPFn(xp).catch(() => {})
  return Promise.resolve()
}

export default function BollywoodEmojiGuess({ slug, gameTitle }) {
  const { lang } = useLang()
  const [state, dispatch] = useReducer(bollywoodEmojiGuessReducer, undefined, getInitialState)

  const { showResumeGate, resume, startNew } = useGamePersistence(slug, (saved) => {
    dispatch({ type: ACTIONS.RESTORE_STATE, payload: saved })
  })

  const { isNewRecord } = useSessionXP({
    phase: state.phase,
    endPhase: 'session_end',
    score: state.score,
    slug,
    computeXP: () => {
      const correctCount = state.answers.filter(a => a.correct).length
      return calculateSessionXP(state.score, correctCount)
    }
  })

  if (showResumeGate) {
    return (
      <ResumeGate
        gameTitle={resolveTitle(gameTitle, lang)}
        onResume={resume}
        onNewGame={startNew}
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
