/**
 * Board generation for Desi Memory Master. Pure, deterministic given difficulty and theme.
 * Easy → 8 pairs (4x4), Medium → 10 pairs (5x4), Hard → 12 pairs (6x4).
 */
import { getThemeByName } from './themes'

const PAIRS_BY_DIFFICULTY = { easy: 8, medium: 10, hard: 12 }

/** Fisher-Yates shuffle. Mutates array. */
export function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Generate a board: take N items from theme, duplicate, shuffle, assign unique IDs.
 * @param {string} difficulty - 'easy' | 'medium' | 'hard'
 * @param {string} themeName - theme name from getThemeByName
 * @returns {{ id: string, value: string }[]}
 */
export function generateBoard(difficulty, themeName) {
  const pairCount = PAIRS_BY_DIFFICULTY[difficulty] ?? 8
  const theme = getThemeByName(themeName)
  if (!theme || theme.items.length < pairCount) return []

  const items = theme.items.slice(0, pairCount)
  const doubled = [...items, ...items]
  const shuffled = shuffleArray([...doubled])
  return shuffled.map((value, index) => ({
    id: `card-${themeName}-${index}-${value}`,
    value
  }))
}

export function getPairCount(difficulty) {
  return PAIRS_BY_DIFFICULTY[difficulty] ?? 8
}
