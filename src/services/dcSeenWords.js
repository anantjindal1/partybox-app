/**
 * Tracks which Dumb Charades words/movies this device has already been
 * shown TODAY, so a fresh word pool (a new game, or "Play Again") can
 * exclude them — otherwise the same movie can resurface in the very
 * next game, which is exactly the repeat players notice and complain
 * about. Resets automatically at midnight (the stored date just stops
 * matching `todayStr()`, no cleanup job needed).
 *
 * Plain localStorage, same pattern as gameStatePersistence.js — this is
 * a small array of strings, well within localStorage's size limits, no
 * need for the heavier IndexedDB path used by profile.js.
 */
const STORAGE_KEY = 'partybox_dc_seen_words'

function todayStr() {
  return new Date().toISOString().substring(0, 10)
}

function readEntry() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Words already shown today, or [] if none yet (or the stored entry is from a previous day). */
export function getSeenWordsToday() {
  const entry = readEntry()
  if (!entry || entry.date !== todayStr()) return []
  return entry.words ?? []
}

/** Merges `words` into today's seen list. Safe to call repeatedly/incrementally. */
export function recordWordsSeen(words) {
  if (!words?.length) return
  const today = todayStr()
  const existing = getSeenWordsToday()
  const merged = [...new Set([...existing, ...words])]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, words: merged }))
  } catch (_) {
    // Storage full/unavailable — non-critical, just means repeats aren't tracked this time.
  }
}
