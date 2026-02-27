/**
 * Desi Memory Master scoring: base score, bonuses, XP.
 * Base: 100 - (timeInSeconds + mistakes * 2)
 * Bonus: finish under 30s → +20, zero mistakes → +30
 * XP: +5 on completion, +10 if new personal best
 */

const BASE_SCORE = 100
const MISTAKE_PENALTY = 2
const TIME_BONUS_THRESHOLD_SEC = 30
const TIME_BONUS = 20
const ZERO_MISTAKES_BONUS = 30
const XP_COMPLETION = 5
const XP_PERSONAL_BEST = 10

/**
 * @param {number} timeInSeconds
 * @param {number} mistakes
 * @returns {{ score: number, timeBonus: boolean, zeroMistakesBonus: boolean }}
 */
export function calculateFinalScore(timeInSeconds, mistakes) {
  const base = Math.max(0, BASE_SCORE - (timeInSeconds + mistakes * MISTAKE_PENALTY))
  const timeBonus = timeInSeconds < TIME_BONUS_THRESHOLD_SEC
  const zeroMistakesBonus = mistakes === 0
  const score = base + (timeBonus ? TIME_BONUS : 0) + (zeroMistakesBonus ? ZERO_MISTAKES_BONUS : 0)
  return { score: Math.max(0, score), timeBonus, zeroMistakesBonus }
}

/**
 * XP: +5 on completion, +10 if new personal best.
 * @param {boolean} isPersonalBest
 * @returns {number}
 */
export function calculateXP(isPersonalBest) {
  return XP_COMPLETION + (isPersonalBest ? XP_PERSONAL_BEST : 0)
}
