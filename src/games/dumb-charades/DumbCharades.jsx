import { useReducer, useCallback, useEffect, lazy, Suspense } from 'react'
import { useLang } from '../../store/LangContext'
import { GameChrome } from '../../components/GameChrome'
import { ResumeGate } from '../../components/ResumeGate'
import { Button } from '../../components/Button'
import { useGamePersistence } from '../../hooks/useGamePersistence'
import { useDevMode } from '../../hooks/useDevMode'
import { clearSavedState } from '../../services/gameStatePersistence'
import { gameReducer, getInitialState, ACTIONS, prepareWordQueue } from './reducer'
import { useDCStrings } from './strings'
import { SetupScreen } from './SetupScreen'
import { CategorySelect } from './CategorySelect'
import { SettingsScreen } from './SettingsScreen'
import { ActorPrepScreen } from './ActorPrepScreen'
import { RoundScreen } from './RoundScreen'
import { TurnResultScreen, GameEndScreen } from './ResultScreen'
import { FadeIn } from '../../components/FadeIn'
import { resolveTitle } from '../../utils/strings'
import { DC } from './theme'

const DumbCharadesOnline = lazy(() => import('./DumbCharadesOnline'))

export default function DumbCharades({ slug, gameTitle, code }) {
  // Online multiplayer path
  if (code) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <p className="text-white/40 animate-pulse">Loading...</p>
        </div>
      }>
        <DumbCharadesOnline code={code} />
      </Suspense>
    )
  }

  return <DumbCharadesOffline slug={slug} gameTitle={gameTitle} />
}

function DumbCharadesOffline({ slug, gameTitle }) {
  const { lang, t: tApp } = useLang()
  const t = useDCStrings(lang)
  const [state, dispatch] = useReducer(gameReducer, undefined, getInitialState)
  const { devMode } = useDevMode()

  const { showResumeGate, resume, startNew } = useGamePersistence(slug, (saved) => {
    dispatch({ type: ACTIONS.RESTORE_STATE, payload: saved })
  })

  useEffect(() => {
    if (state.phase === 'game_end') clearSavedState(slug)
  }, [state.phase, slug])

  const handleActorReady = useCallback(() => {
    const wordQueue = prepareWordQueue(state.settings)
    dispatch({ type: ACTIONS.ACTOR_READY, payload: { wordQueue } })
  }, [state.settings])

  const props = { state, dispatch, t }

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
    <GameChrome slug={slug} gameTitle={resolveTitle(gameTitle, lang)} state={state}>
      <FadeIn key={state.phase}>
        {state.phase === 'team_setup'      && <SetupScreen {...props} />}
        {state.phase === 'category_select' && <CategorySelect {...props} />}
        {state.phase === 'settings_select' && <SettingsScreen {...props} />}
        {state.phase === 'round_start'     && (
          <RoundStartScreen state={state} t={t} onStart={handleActorReady} />
        )}
        {state.phase === 'actor_prep'      && <ActorPrepScreen {...props} devMode={devMode} />}
        {state.phase === 'playing'         && <RoundScreen {...props} devMode={devMode} />}
        {state.phase === 'turn_result'     && <TurnResultScreen {...props} />}
        {state.phase === 'game_end'        && <GameEndScreen {...props} />}
      </FadeIn>
    </GameChrome>
  )
}

function RoundStartScreen({ state, t, onStart }) {
  const { teams, currentTeamIndex, settings } = state
  const team = teams[currentTeamIndex]

  return (
    <div className={`min-h-screen ${DC.bg} ${DC.text} flex flex-col items-center justify-center px-6 space-y-6 text-center`}>
      <p className="text-6xl">🎭</p>
      <div className={`${DC.card} border ${DC.accentBorder} rounded-2xl px-8 py-4`}>
        <p className="text-2xl font-black text-white">{team?.name}</p>
      </div>
      <p className="text-3xl font-bold text-white">{t('yourTurn')}</p>
      <p className={`${DC.textMuted} text-lg`}>
        {t('winPointsTarget')} {settings.winPoints} {t('winsAt')}
        &nbsp;·&nbsp;{settings.timerSeconds}{t('seconds')}
        &nbsp;·&nbsp;{t(settings.difficulty)}
      </p>
      <div className="w-full pt-4">
        <Button onClick={onStart}>{t('tapToStart')}</Button>
      </div>
    </div>
  )
}
