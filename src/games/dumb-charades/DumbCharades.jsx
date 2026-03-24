import { useReducer, useEffect, useRef } from 'react'
import { useLang } from '../../store/LangContext'
import { GameChrome } from '../../components/GameChrome'
import { FadeIn } from '../../components/FadeIn'
import { useGamePersistence } from '../../hooks/useGamePersistence'
import { ResumeGate } from '../../components/ResumeGate'
import { saveGameState, clearSavedState } from '../../services/gameStatePersistence'
import { resolveTitle } from '../../utils/strings'
import { gameReducer, getInitialState, ACTIONS } from './reducer'
import { trackEvent as trackAnalyticsEvent } from '../../services/analytics_events'
import { SetupScreen } from './SetupScreen'
import { CategorySelect } from './CategorySelect'
import { SettingsScreen } from './SettingsScreen'
import { HandoffScreen } from './HandoffScreen'
import { RoundScreen } from './RoundScreen'
import { TurnResultScreen, GameEndScreen } from './ResultScreen'

// Phases where an in-progress game is worth saving for resume-on-refresh
const SAVE_PHASES = ['acting', 'turn_result', 'handoff']

export default function DumbCharades({ slug, gameTitle }) {
  const { lang } = useLang()
  const [state, dispatch] = useReducer(gameReducer, undefined, getInitialState)

  const { showResumeGate, resume, startNew } = useGamePersistence(slug, (saved) => {
    dispatch({ type: ACTIONS.RESTORE_STATE, payload: saved })
  })

  // ── Analytics tracking ──────────────────────────────────────────────────────
  const analyticsRef = useRef({ started: false, completed: false })
  const currentPhaseRef = useRef(state.phase)
  useEffect(() => { currentPhaseRef.current = state.phase }, [state.phase])

  // game_start: first time the acting phase is reached
  useEffect(() => {
    if (state.phase === 'acting' && !analyticsRef.current.started) {
      analyticsRef.current.started = true
      trackAnalyticsEvent('game_start', 'dumb-charades')
    }
  }, [state.phase])

  // game_complete: game_end reached
  useEffect(() => {
    if (state.phase === 'game_end' && !analyticsRef.current.completed) {
      analyticsRef.current.completed = true
      trackAnalyticsEvent('game_complete', 'dumb-charades')
    }
  }, [state.phase])

  // rematch: phase returns to team_setup after a completed game
  useEffect(() => {
    if (state.phase === 'team_setup' && analyticsRef.current.completed) {
      trackAnalyticsEvent('rematch', 'dumb-charades')
      analyticsRef.current = { started: false, completed: false }
    }
  }, [state.phase])

  // game_abandon: component unmounts while game was started but not completed
  useEffect(() => {
    return () => {
      if (analyticsRef.current.started && !analyticsRef.current.completed) {
        trackAnalyticsEvent('game_abandon', 'dumb-charades', { phase: currentPhaseRef.current })
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist state during active game phases so refresh shows ResumeGate
  useEffect(() => {
    if (SAVE_PHASES.includes(state.phase)) {
      saveGameState(slug, state)
    }
  }, [state, slug])

  // Clear saved state when game ends
  useEffect(() => {
    if (state.phase === 'game_end') clearSavedState(slug)
  }, [state.phase, slug])

  if (showResumeGate) {
    return (
      <ResumeGate
        gameTitle={resolveTitle(gameTitle, lang)}
        onResume={resume}
        onNewGame={startNew}
      />
    )
  }

  // During acting phase, hide GameChrome chrome (full-screen immersive)
  if (state.phase === 'acting') {
    return (
      <FadeIn key="acting">
        <RoundScreen state={state} dispatch={dispatch} />
      </FadeIn>
    )
  }

  return (
    <GameChrome slug={slug} gameTitle={resolveTitle(gameTitle, lang)} state={state}>
      <FadeIn key={state.phase}>
        {state.phase === 'team_setup'      && <SetupScreen      state={state} dispatch={dispatch} />}
        {state.phase === 'category_select' && <CategorySelect   state={state} dispatch={dispatch} />}
        {state.phase === 'settings_select' && <SettingsScreen   state={state} dispatch={dispatch} />}
        {state.phase === 'handoff'         && <HandoffScreen    state={state} dispatch={dispatch} />}
        {state.phase === 'turn_result'     && <TurnResultScreen state={state} dispatch={dispatch} />}
        {state.phase === 'game_end'        && <GameEndScreen    state={state} dispatch={dispatch} />}
      </FadeIn>
    </GameChrome>
  )
}
