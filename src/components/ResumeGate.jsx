import { useLang } from '../store/LangContext'
import { Button } from './Button'

/**
 * Shared pause-gate shown when a saved game is detected on load.
 */
export function ResumeGate({ gameTitle, onResume, onNewGame }) {
  const { t } = useLang()

  return (
    <div className="min-h-screen bg-bg text-textPrimary flex flex-col items-center justify-center px-6 gap-6">
      <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" className="text-gold">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
      <h2 className="text-xl font-bold font-display">{gameTitle}</h2>
      <p className="text-textMuted">{t('gamesInProgress')}</p>
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
