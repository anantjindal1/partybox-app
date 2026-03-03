import { useLang } from '../store/LangContext'
import { useGameTheme } from '../store/GameThemeContext'
import { Button } from './Button'

/**
 * Shared pause-gate shown when a saved game is detected on load.
 * Replaces the identical local ResumeGate component that was copy-pasted into every game file.
 * Uses shared Button and design tokens to match the shell.
 */
export function ResumeGate({ gameTitle, onResume, onNewGame }) {
  const { t } = useLang()
  const { theme } = useGameTheme()

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col items-center justify-center px-6 gap-6`}>
      <p className="text-5xl">⏸</p>
      <h2 className="text-xl font-bold">{gameTitle}</h2>
      <p className={theme.textMuted}>{t('gamesInProgress')}</p>
      <div className="flex flex-wrap gap-3 justify-center max-w-sm w-full">
        <Button onClick={onResume} variant="primary" className="!w-auto px-6 !py-3 !text-base">
          {t('resumeGame')}
        </Button>
        <Button onClick={onNewGame} variant="ghost" className="!w-auto px-6 !py-3 !text-base">
          {t('newGame')}
        </Button>
      </div>
    </div>
  )
}
