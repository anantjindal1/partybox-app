/**
 * Raja Mantri Chor Sipahi — pure role-assignment and scoring utilities.
 * All functions are stateless and unit-testable with no side effects.
 */

export const ROLE_POINTS = {
  raja: 1000,
  sipahi: 500,
  mantri_correct: 800,
  mantri_wrong: 0,
  chor_correct: 0,
  chor_wrong: 800,
}

/**
 * Randomly assigns one Raja, one Mantri, one Chor, and Sipahi to everyone else.
 * Requires at least 4 players; returns null otherwise (defensive — callers gate
 * the Start action on minPlayers before this is ever invoked).
 *
 * @param {string[]} playerIds
 * @param {() => number} rng - injectable random source in [0, 1), defaults to Math.random
 * @returns {Record<string, 'raja'|'mantri'|'chor'|'sipahi'> | null}
 */
export function assignRoles(playerIds, rng = Math.random) {
  if (!Array.isArray(playerIds) || playerIds.length < 4) return null

  const shuffled = [...playerIds]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const roles = {}
  shuffled.forEach((id, i) => {
    if (i === 0) roles[id] = 'raja'
    else if (i === 1) roles[id] = 'mantri'
    else if (i === 2) roles[id] = 'chor'
    else roles[id] = 'sipahi'
  })
  return roles
}

/**
 * Scores one round given the dealt roles and who the Mantri accused.
 * A null/undefined guess (Mantri timed out) counts as a wrong guess.
 *
 * @param {Record<string, string>} roles
 * @param {string|null} mantriGuessPlayerId
 * @returns {{ scores: Record<string, number>, correct: boolean, rajaId: string, mantriId: string, chorId: string }}
 */
export function computeRoundScores(roles, mantriGuessPlayerId) {
  const entries = Object.entries(roles || {})
  const rajaId = entries.find(([, r]) => r === 'raja')?.[0]
  const mantriId = entries.find(([, r]) => r === 'mantri')?.[0]
  const chorId = entries.find(([, r]) => r === 'chor')?.[0]
  const correct = mantriGuessPlayerId != null && mantriGuessPlayerId === chorId

  const scores = {}
  for (const [id, role] of entries) {
    if (role === 'raja') scores[id] = ROLE_POINTS.raja
    else if (role === 'sipahi') scores[id] = ROLE_POINTS.sipahi
    else if (role === 'mantri') scores[id] = correct ? ROLE_POINTS.mantri_correct : ROLE_POINTS.mantri_wrong
    else if (role === 'chor') scores[id] = correct ? ROLE_POINTS.chor_correct : ROLE_POINTS.chor_wrong
  }

  return { scores, correct, rajaId, mantriId, chorId }
}
