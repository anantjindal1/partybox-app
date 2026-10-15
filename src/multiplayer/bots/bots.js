/**
 * AI players — pure helpers, no Firebase, no React. A bot is an ordinary
 * entry in room.players (so every game's seating, turnOrder and partner
 * logic works unchanged) whose id carries the BOT_PREFIX; the host's
 * device makes its moves (see useBotTurns).
 */

export const BOT_PREFIX = 'bot_'
export const DIFFICULTIES = ['easy', 'medium', 'hard']
export const DEFAULT_DIFFICULTY = 'medium'

// Distinct first letters, so no two AI players share a monogram.
const BOT_NAMES = ['Ravi', 'Priya', 'Arjun', 'Neha', 'Kabir', 'Meera', 'Vikram', 'Isha', 'Dev', 'Tara', 'Sameer', 'Gauri']

// One jewel colour per bot name (same order as BOT_NAMES), so each AI
// player's monogram differs. Fixed light-theme accent values rather than
// theme vars: they sit on light lobbies and dark felt tables alike, and
// white text needs a dark fill in both.
const BOT_COLORS = ['#a6314f', '#1f7a4d', '#1f5c82', '#8a4c28', '#6b3f73', '#146a58', '#a6402f', '#4a3f8c', '#217328', '#7a1f2b', '#2d3776', '#9c2a72']

export function botColor(name = '') {
  const i = BOT_NAMES.indexOf(name)
  if (i >= 0) return BOT_COLORS[i]
  const hash = [...name].reduce((h, c) => h + c.charCodeAt(0), 0)
  return BOT_COLORS[hash % BOT_COLORS.length]
}

export function isBotId(id) {
  return typeof id === 'string' && id.startsWith(BOT_PREFIX)
}

export function makeBot(existingPlayers, rng = Math.random) {
  const taken = new Set(existingPlayers.map(p => p.name))
  const free = BOT_NAMES.filter(n => !taken.has(n))
  const name = free.length ? free[Math.floor(rng() * free.length)] : `AI ${existingPlayers.length + 1}`
  const id = `${BOT_PREFIX}${Math.floor(rng() * 1e9).toString(36)}`
  return { id, name, avatar: '🤖', isBot: true }
}

// Thinking time before a bot acts — long enough to read as a person.
export function humanDelay(rng = Math.random) {
  return 900 + Math.floor(rng() * 1300)
}

export function pickRandom(items, rng = Math.random) {
  return items[Math.floor(rng() * items.length)]
}

// Medium bots occasionally play a random legal move instead of the best one.
export const MISTAKE_RATE = { easy: 1, medium: 0.15, hard: 0 }
