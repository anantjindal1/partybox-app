/**
 * Bhed (Jasoos) — pure role-assignment utility.
 * One random player is the Bhed (outsider); everyone else is implicitly
 * a villager who shares the secret word.
 */

/**
 * @param {string[]} playerIds
 * @param {() => number} rng - injectable random source in [0, 1), defaults to Math.random
 * @returns {string | null} the Bhed's player id, or null if fewer than 4 players
 */
export function assignBhed(playerIds, rng = Math.random) {
  if (!Array.isArray(playerIds) || playerIds.length < 4) return null

  const shuffled = [...playerIds]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled[0]
}
