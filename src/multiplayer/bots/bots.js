/**
 * AI players — pure helpers, no Firebase, no React. A bot is an ordinary
 * entry in room.players (so every game's seating, turnOrder and partner
 * logic works unchanged) whose id carries the BOT_PREFIX; the host's
 * device makes its moves (see useBotTurns).
 */

export const BOT_PREFIX = 'bot_'
export const DIFFICULTIES = ['easy', 'medium', 'hard']
export const DEFAULT_DIFFICULTY = 'medium'

const BOT_NAMES = ['Ravi', 'Priya', 'Arjun', 'Neha', 'Kabir', 'Meera', 'Vikram', 'Anjali', 'Rohan', 'Pooja', 'Sameer', 'Kavya']

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
