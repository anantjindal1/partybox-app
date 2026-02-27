import { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'partybox_game_theme'

export const GAME_THEMES = {
  'zinc-amber': {
    id: 'zinc-amber',
    name: 'Amber',
    nameHi: 'अंबर',
    bg: 'bg-zinc-950',
    card: 'bg-zinc-800 border-zinc-700',
    cardHover: 'hover:bg-zinc-700',
    accent: 'text-amber-400',
    accentBg: 'bg-amber-500',
    accentBgHover: 'hover:bg-amber-400',
    border: 'border-zinc-700',
    text: 'text-zinc-100',
    textMuted: 'text-zinc-500',
    input: 'bg-zinc-800 border-zinc-600 focus:ring-amber-500/50'
  },
  'slate-rose': {
    id: 'slate-rose',
    name: 'Rose',
    nameHi: 'गुलाबी',
    bg: 'bg-slate-950',
    card: 'bg-slate-800 border-slate-700',
    cardHover: 'hover:bg-slate-700',
    accent: 'text-rose-400',
    accentBg: 'bg-rose-500',
    accentBgHover: 'hover:bg-rose-400',
    border: 'border-slate-700',
    text: 'text-slate-100',
    textMuted: 'text-slate-500',
    input: 'bg-slate-800 border-slate-600 focus:ring-rose-500/50'
  },
  'stone-emerald': {
    id: 'stone-emerald',
    name: 'Emerald',
    nameHi: 'हरा',
    bg: 'bg-stone-950',
    card: 'bg-stone-800 border-stone-700',
    cardHover: 'hover:bg-stone-700',
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500',
    accentBgHover: 'hover:bg-emerald-400',
    border: 'border-stone-700',
    text: 'text-stone-100',
    textMuted: 'text-stone-500',
    input: 'bg-stone-800 border-stone-600 focus:ring-emerald-500/50'
  }
}

const GameThemeContext = createContext()

export function GameThemeProvider({ children }) {
  const [themeId, setThemeIdState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'zinc-amber'
    } catch {
      return 'zinc-amber'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, themeId)
    } catch (_) {}
  }, [themeId])

  const theme = GAME_THEMES[themeId] || GAME_THEMES['zinc-amber']

  const setThemeId = (id) => {
    if (GAME_THEMES[id]) setThemeIdState(id)
  }

  return (
    <GameThemeContext.Provider value={{ theme, themeId, setThemeId, themes: GAME_THEMES }}>
      {children}
    </GameThemeContext.Provider>
  )
}

export const useGameTheme = () => useContext(GameThemeContext)
