import { useTheme } from '../store/ThemeContext'

export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`w-11 h-11 flex items-center justify-center rounded-xl bg-surfaceElevated hover:bg-surfaceMuted text-textPrimary border border-border transition-colors ${className}`.trim()}
      aria-label="Toggle light/dark theme"
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M20.5 14.5A8 8 0 019.5 3.5a8.5 8.5 0 1011 11z" />
        </svg>
      )}
    </button>
  )
}
