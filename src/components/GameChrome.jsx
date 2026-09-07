import { useNavigate } from 'react-router-dom'
import { LangToggle } from './LangToggle'
import { ThemeToggle } from './ThemeToggle'
import { useLang } from '../store/LangContext'
import { saveGameState } from '../services/gameStatePersistence'

/**
 * Shared chrome for offline games: Home button (saves state), language toggle, theme toggle.
 */
export function GameChrome({ slug, gameTitle, state, children }) {
  const navigate = useNavigate()
  const { t } = useLang()

  function handleHome() {
    if (slug && state) {
      saveGameState(slug, state, gameTitle)
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-bg text-textPrimary flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border shadow-soft bg-surface/80 backdrop-blur-sm">
        <button
          onClick={handleHome}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surfaceElevated hover:bg-surfaceMuted text-textPrimary text-sm font-semibold border border-border transition-colors min-h-[44px]"
          aria-label={t('returnHome')}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l9-8 9 8" />
            <path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
          </svg>
          {t('returnHome')}
        </button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LangToggle />
        </div>
      </header>
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  )
}
