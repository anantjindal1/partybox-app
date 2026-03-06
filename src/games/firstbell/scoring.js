/**
 * Rapid Fire Battle — pure scoring utilities.
 * All functions are stateless and unit-testable with no side effects.
 */

/** Base score for a correct / incorrect answer. */
export function computeBaseScore(isCorrect) {
  return isCorrect ? 10 : 0
}

/**
 * Speed bonus awarded on top of base score.
 * Only given for correct answers; tiers based on response time:
 *   ≤5s → +5,  ≤10s → +3,  ≤15s → +1,  otherwise → 0
 */
export function computeSpeedBonus(isCorrect, deltaSeconds) {
  if (!isCorrect) return 0
  if (deltaSeconds <= 5) return 5
  if (deltaSeconds <= 10) return 3
  if (deltaSeconds <= 15) return 1
  return 0
}

/** Total round score (0–15). */
export function computeRoundScore(isCorrect, deltaSeconds) {
  return computeBaseScore(isCorrect) + computeSpeedBonus(isCorrect, deltaSeconds)
}

/**
 * Sort player IDs by cumulative score (desc), then avg response time (asc) as tie-breaker.
 *
 * @param {string[]} playerIds
 * @param {Record<string, number>} scores  - cumulative totals keyed by playerId
 * @param {Record<string, number>} responseTimes - avg response seconds keyed by playerId
 * @returns {string[]} sorted player IDs, best first
 */
export function resolveTieBreak(playerIds, scores, responseTimes) {
  return [...playerIds].sort((a, b) => {
    const scoreDiff = (scores[b] ?? 0) - (scores[a] ?? 0)
    if (scoreDiff !== 0) return scoreDiff
    return (responseTimes[a] ?? Infinity) - (responseTimes[b] ?? Infinity)
  })
}
