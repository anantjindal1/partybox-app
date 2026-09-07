import { useTheme } from './ThemeContext'

/**
 * Compatibility shim: the old 3-skin dark-only picker (zinc-amber / slate-rose /
 * stone-emerald) is gone in favor of the Ivory & Jewel light/dark system, but
 * several not-yet-migrated game screens still call useGameTheme() for their
 * classes. This keeps them on the new tokens without a per-file rewrite.
 */
const TOKEN_THEME = {
  bg: 'bg-bg',
  card: 'bg-surfaceElevated border-border',
  cardHover: 'hover:bg-surfaceMuted',
  accent: 'text-gold',
  accentBg: 'bg-gold',
  accentBgHover: 'hover:opacity-90',
  border: 'border-border',
  text: 'text-textPrimary',
  textMuted: 'text-textMuted',
  input: 'bg-surfaceElevated border-border focus:ring-gold/50'
}

export function useGameTheme() {
  const { theme, toggleTheme } = useTheme()
  return {
    theme: TOKEN_THEME,
    themeId: theme,
    setThemeId: toggleTheme,
    themes: { [theme]: TOKEN_THEME }
  }
}
