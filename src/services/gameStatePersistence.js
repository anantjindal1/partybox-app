/**
 * Persist in-progress game state to localStorage so users can pause and resume.
 * Key: partybox_game_state — value: { [slug]: { state, gameTitle, savedAt } }
 */

const STORAGE_KEY = 'partybox_game_state'

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (_) {}
}

export function getSavedState(slug) {
  const data = readAll()
  const entry = data[slug]
  return entry?.state ?? null
}

export function saveGameState(slug, state, gameTitle = '') {
  const data = readAll()
  data[slug] = { state, gameTitle, savedAt: Date.now() }
  writeAll(data)
}

export function getInProgressGames() {
  const data = readAll()
  return Object.entries(data).map(([slug, { gameTitle, savedAt }]) => ({
    slug,
    gameTitle: gameTitle || slug,
    savedAt
  }))
}

export function clearSavedState(slug) {
  const data = readAll()
  delete data[slug]
  writeAll(data)
}
