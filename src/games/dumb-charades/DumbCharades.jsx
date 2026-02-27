import { useReducer, useCallback, useState, useEffect } from 'react'
import { useLang } from '../../store/LangContext'
import { useGameTheme } from '../../store/GameThemeContext'
import { GameChrome } from '../../components/GameChrome'
import { Button } from '../../components/Button'
import { getSavedState, clearSavedState } from '../../services/gameStatePersistence'
import { gameReducer, getInitialState, ACTIONS, prepareWordQueue } from './reducer'
import { useDCStrings } from './strings'
import { SetupScreen } from './SetupScreen'
import { CategorySelect } from './CategorySelect'
import { SettingsScreen } from './SettingsScreen'
import { RoundScreen } from './RoundScreen'
import { RoundEndScreen, GameEndScreen } from './ResultScreen'
import { FadeIn } from '../../components/FadeIn'

export default function DumbCharades({ slug, gameTitle }) {
  const { lang, t: tApp } = useLang()
  const t = useDCStrings(lang)
  const savedState = getSavedState(slug)
  const [showResumeGate, setShowResumeGate] = useState(!!savedState)
  const [state, dispatch] = useReducer(gameReducer, undefined, getInitialState)

  useEffect(() => {
    if (state.phase === 'game_end') clearSavedState(slug)
  }, [state.phase, slug])

  const handleStartRound = useCallback(() => {
    const wordQueue = prepareWordQueue(state.settings)
    dispatch({ type: ACTIONS.START_ROUND, payload: { wordQueue, ts: Date.now() } })
  }, [state.settings])

  const props = { state, dispatch, t }

  if (showResumeGate && savedState) {
    return (
      <ResumeGate
        gameTitle={typeof gameTitle === 'object' ? gameTitle?.en || gameTitle?.hi : gameTitle}
        t={tApp}
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

  return (
    <GameChrome slug={slug} gameTitle={title} state={state}>
      <FadeIn key={state.phase}>
        {state.phase === 'playing' && <RoundScreen {...props} />}
        {state.phase === 'team_setup' && <SetupScreen {...props} />}
        {state.phase === 'category_select' && <CategorySelect {...props} />}
        {state.phase === 'settings_select' && <SettingsScreen {...props} />}
        {state.phase === 'round_start' && (
          <RoundStartScreen state={state} t={t} onStart={handleStartRound} />
        )}
        {state.phase === 'round_end' && <RoundEndScreen {...props} />}
        {state.phase === 'game_end' && <GameEndScreen {...props} />}
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

function RoundStartScreen({ state, t, onStart }) {
  const { theme } = useGameTheme()
  const { teams, currentTeamIndex, roundNumber, settings } = state
  const team = teams[currentTeamIndex]
  const totalTurns = settings.roundsPerTeam * teams.length

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col items-center justify-center px-6 space-y-6 text-center`}>
      <p className="text-6xl">🎭</p>
      <div className={`${theme.accentBg} rounded-2xl px-8 py-4`}>
        <p className="text-2xl font-black text-zinc-900">{team?.name}</p>
      </div>
      <p className={`text-3xl font-bold ${theme.text}`}>{t('yourTurn')}</p>
      <p className={`${theme.textMuted} text-lg`}>
        {t('round')} {roundNumber} {t('of')} {totalTurns}
        &nbsp;·&nbsp;{settings.timerSeconds}{t('seconds')}
        &nbsp;·&nbsp;{t(settings.difficulty)}
      </p>

      <div className="w-full pt-4">
        <Button onClick={onStart}>{t('tapToStart')}</Button>
      </div>
    </div>
  )
}
