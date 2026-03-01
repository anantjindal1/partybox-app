import { useReducer } from 'react'
import { useLang } from '../../store/LangContext'
import { GameChrome } from '../../components/GameChrome'
import { ResumeGate } from '../../components/ResumeGate'
import { useGamePersistence } from '../../hooks/useGamePersistence'
import { useSessionXP } from '../../hooks/useSessionXP'
import { getHighScore } from '../../services/highScores'
import { getInitialState, tezHisabReducer, ACTIONS } from './reducer'
import { calculateSessionXP } from './scoring'
import { awardXP } from '../../services/xp'
import { SetupScreen } from './SetupScreen'
import { QuestionScreen } from './QuestionScreen'
import { ResultScreen } from './ResultScreen'
import { FadeIn } from '../../components/FadeIn'
import { resolveTitle } from '../../utils/strings'

/** Called when phase becomes session_end; used by TezHisab and by tests (TC-46). */
export function runSessionEndXP(state, awardXPFn = awardXP) {
  const correctCount = state.answers.filter(a => a.correct).length
  const xp = calculateSessionXP(correctCount)
  if (xp > 0) return awardXPFn(xp).catch(() => {})
  return Promise.resolve()
}

export default function TezHisab({ slug, gameTitle }) {
  const { t } = useLang()
  const [state, dispatch] = useReducer(tezHisabReducer, undefined, getInitialState)

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
      return calculateSessionXP(correctCount)
    }
  })

  if (showResumeGate) {
    return (
      <ResumeGate
        gameTitle={resolveTitle(gameTitle, 'en')}
        onResume={resume}
        onNewGame={startNew}
      />
    )
  }

  return (
    <GameChrome slug={slug} gameTitle={gameTitle} state={state}>
      <FadeIn key={state.phase === 'answer_selected' ? 'question_show' : state.phase}>
        {state.phase === 'setup' && <SetupScreen state={state} dispatch={dispatch} slug={slug} />}
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
