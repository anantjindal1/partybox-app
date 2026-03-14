import { useReducer, useEffect } from 'react'
import { useLang } from '../../store/LangContext'
import { GameChrome } from '../../components/GameChrome'
import { FadeIn } from '../../components/FadeIn'
import { useGamePersistence } from '../../hooks/useGamePersistence'
import { ResumeGate } from '../../components/ResumeGate'
import { clearSavedState } from '../../services/gameStatePersistence'
import { resolveTitle } from '../../utils/strings'
import { gameReducer, getInitialState, ACTIONS } from './reducer'
import { SetupScreen } from './SetupScreen'
import { CategorySelect } from './CategorySelect'
import { SettingsScreen } from './SettingsScreen'
import { HandoffScreen } from './HandoffScreen'
import { RoundScreen } from './RoundScreen'
import { TurnResultScreen, GameEndScreen } from './ResultScreen'

export default function DumbCharades({ slug, gameTitle }) {
  const { lang } = useLang()
  const [state, dispatch] = useReducer(gameReducer, undefined, getInitialState)

  const { showResumeGate, resume, startNew } = useGamePersistence(slug, (saved) => {
    dispatch({ type: ACTIONS.RESTORE_STATE, payload: saved })
  })

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
