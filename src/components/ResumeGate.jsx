import { useLang } from '../store/LangContext'
import { useGameTheme } from '../store/GameThemeContext'

/**
 * Shared pause-gate shown when a saved game is detected on load.
 * Replaces the identical local ResumeGate component that was copy-pasted into every game file.
 */
export function ResumeGate({ gameTitle, onResume, onNewGame }) {
  const { t } = useLang()
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
