/**
 * Spot the Jugaad scoring: base + speed bonus + streak bonus.
 * XP: +2 per correct, +5 if session score > 80.
 */

function getSpeedBonus(responseTimeMs) {
  if (responseTimeMs < 3000) return 5
  if (responseTimeMs < 6000) return 3
  if (responseTimeMs < 9000) return 1
  return 0
}

function getStreakBonus(streakBeforeThisAnswer) {
  if (streakBeforeThisAnswer < 2) return 0
  return (streakBeforeThisAnswer - 2) % 3 === 0 ? 5 : 0
}

/**
 * Score for one correct answer.
 */
export function calculatePuzzleScore(responseTimeMs, streakBeforeThisAnswer) {
  const base = 10
  const speed = getSpeedBonus(responseTimeMs)
  const streak = getStreakBonus(streakBeforeThisAnswer)
  return base + speed + streak
}

/**
 * Session XP: +2 per correct, +5 if totalScore > 80.
 */
export function calculateSessionXP(totalScore, correctCount) {
  let xp = correctCount * 2
  if (totalScore > 80) xp += 5
  return xp
}
