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
import { recordWordsSeen } from '../../services/dcSeenWords'
import { SetupScreen } from './SetupScreen'
import { CategorySelect } from './CategorySelect'
import { SettingsScreen } from './SettingsScreen'
import { HandoffScreen } from './HandoffScreen'
import { RoundScreen } from './RoundScreen'
import { TurnResultScreen, GameEndScreen } from './ResultScreen'
import { WORD_PACKS } from './wordpacks'
import {
  recordGameStart,
  recordWordShown,
  recordWordResult,
  recordTurnEnd,
} from '../../services/dcStats'

// Returns the specific category a word belongs to, or first selected category as fallback
function findWordCategory(word, selectedCategories) {
  for (const cat of selectedCategories) {
    const pack = WORD_PACKS[cat]
    if (pack?.words?.some(w => w.word === word)) return cat
  }
  return selectedCategories[0] ?? 'custom'
}

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

  // Track every word this device is actually shown, regardless of outcome,
  // so a fresh word pool (a new game, or "Play Again") can exclude words
  // already seen today — see SettingsScreen.jsx's CONFIRM_SETTINGS dispatch
  // and services/dcSeenWords.js. Recorded incrementally per word (not just
  // once at game_end) so a mid-game exit still counts toward the exclusion.
  const lastRecordedWordRef = useRef('')
  useEffect(() => {
    if (state.phase === 'acting' && state.currentWord && state.currentWord !== lastRecordedWordRef.current) {
      lastRecordedWordRef.current = state.currentWord
      recordWordsSeen([state.currentWord])
    }
  }, [state.currentWord, state.phase])

  // ── DC word-usage tracking ─────────────────────────────────────────────────

  // Ref bundle — avoids stale-closure issues across multiple effects
  const dcGameStartedRef = useRef(false)
  const dcPrevWordRef    = useRef('')
  const dcPrevHistoryLen = useRef(0)
  const dcPrevPhaseRef   = useRef(null)

  // 1. Game start — fires once per game when word queue is first built (CONFIRM_SETTINGS)
  //    NEXT_TURN also goes to 'handoff', so we gate on dcGameStartedRef.
  //    Reset the gate when phase returns to team_setup (PLAY_AGAIN).
  useEffect(() => {
    if (state.phase === 'team_setup') {
      dcGameStartedRef.current = false
    }
    if (state.phase === 'handoff') {
      dcPrevWordRef.current = '' // reset so first word of each turn is always recorded
      if (state.wordQueue.length > 0 && !dcGameStartedRef.current) {
        dcGameStartedRef.current = true
        recordGameStart(state.categories, state.difficulty)
      }
    }
  }, [state.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Word shown — fires when currentWord changes while in acting phase
  useEffect(() => {
    if (state.phase === 'acting' && state.currentWord && state.currentWord !== dcPrevWordRef.current) {
      dcPrevWordRef.current = state.currentWord
      const cat = findWordCategory(state.currentWord, state.categories)
      recordWordShown(state.currentWord, cat, state.difficulty)
    }
  }, [state.currentWord, state.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Word result — fires when a new entry appears in turnHistory
  //    Covers correct, skip, and timeout (all go through turnHistory)
  useEffect(() => {
    const curr = state.turnHistory.length
    if (curr > dcPrevHistoryLen.current && curr > 0) {
      const entry = state.turnHistory[curr - 1]
      const cat   = findWordCategory(entry.word, state.categories)
      recordWordResult(entry.word, cat, state.difficulty, entry.result)
    }
    dcPrevHistoryLen.current = curr
  }, [state.turnHistory]) // eslint-disable-line react-hooks/exhaustive-deps

  // 4. Turn end — fires when acting phase transitions to turn_result or game_end
  useEffect(() => {
    const prev = dcPrevPhaseRef.current
    const curr = state.phase
    if ((curr === 'turn_result' || curr === 'game_end') && prev === 'acting') {
      recordTurnEnd(state.turnHistory.length)
    }
    dcPrevPhaseRef.current = curr
  }, [state.phase]) // eslint-disable-line react-hooks/exhaustive-deps

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
