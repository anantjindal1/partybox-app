/**
 * Per-game high score tracking via localStorage.
 * Key: partybox_hs_<slug>
 * Shape: { score: number, date: string }
 */

function storageKey(slug) {
  return `partybox_hs_${slug}`
}

/** Returns the stored high score number, or null if none exists. */
export function getHighScore(slug) {
  try {
    const raw = localStorage.getItem(storageKey(slug))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed.score === 'number' ? parsed.score : null
  } catch {
    return null
  }
}

/** Stores a new high score for the given slug. */
export function setHighScore(slug, score) {
  try {
    localStorage.setItem(
      storageKey(slug),
      JSON.stringify({ score, date: new Date().toISOString() })
    )
  } catch (_) {}
}

/**
 * Checks if `score` beats the stored record. If so, updates the record.
 * Returns { isNewRecord: boolean, previousBest: number | null }.
 */
export function checkAndUpdateHighScore(slug, score) {
  const previousBest = getHighScore(slug)
  const isNewRecord = previousBest === null || score > previousBest
  if (isNewRecord) setHighScore(slug, score)
  return { isNewRecord, previousBest }
}
