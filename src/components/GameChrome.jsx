import { useNavigate } from 'react-router-dom'
import { LangToggle } from './LangToggle'
import { useLang } from '../store/LangContext'
import { useGameTheme } from '../store/GameThemeContext'
import { saveGameState } from '../services/gameStatePersistence'

/**
 * Shared chrome for offline games: Home button (saves state), language toggle, theme selector.
 * Renders children inside a themed wrapper.
 */
export function GameChrome({ slug, gameTitle, state, children }) {
  const navigate = useNavigate()
  const { t } = useLang()
  const { theme } = useGameTheme()

  function handleHome() {
    if (slug && state) {
      saveGameState(slug, state, gameTitle)
    }
    navigate('/')
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex flex-col`}>
      {/* Top bar: Home (saves state), theme switcher, language toggle */}
      <header className={`flex items-center justify-between px-4 py-3 ${theme.border} border-b`}>
        <button
          onClick={handleHome}
          className={`px-4 py-2 rounded-xl ${theme.card} ${theme.cardHover} ${theme.text} text-sm font-semibold border ${theme.border}`}
          aria-label={t('returnHome')}
        >
          🏠 {t('returnHome')}
        </button>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LangToggle />
        </div>
      </header>
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  )
}

function ThemeSwitcher() {
  const { themeId, setThemeId, themes } = useGameTheme()
  const { lang } = useLang()

  return (
    <select
      value={themeId}
      onChange={(e) => setThemeId(e.target.value)}
      className={`px-3 py-2 rounded-xl text-sm font-medium border ${themes[themeId]?.input || 'bg-zinc-800 border-zinc-600'} ${themes[themeId]?.text || 'text-zinc-100'}`}
      aria-label="Game theme"
    >
      {Object.values(themes).map((t) => (
        <option key={t.id} value={t.id}>
          {lang === 'hi' ? t.nameHi : t.name}
        </option>
      ))}
    </select>
  )
}
