/**
 * Bollywood Emoji Guess scoring.
 * Base 10, speed bonus <5s +5, <8s +3, <12s +1, streak 3 consecutive correct = +5.
 * XP: +2 per correct, +5 if session score > 80.
 */

function getSpeedBonus(responseTimeMs) {
  if (responseTimeMs < 5000) return 5
  if (responseTimeMs < 8000) return 3
  if (responseTimeMs < 12000) return 1
  return 0
}

/** Streak: 3 consecutive correct = +5 (streakBefore 2 means this is 3rd in a row) */
function getStreakBonus(streakBeforeThisAnswer) {
  if (streakBeforeThisAnswer < 2) return 0
  return (streakBeforeThisAnswer - 2) % 3 === 0 ? 5 : 0
}

/**
 * Score for one correct answer.
 * @param {number} responseTimeMs
 * @param {number} streakBeforeThisAnswer - 0-indexed; 2 = third correct in a row
 */
export function calculateQuestionScore(responseTimeMs, streakBeforeThisAnswer) {
  const base = 10
  const speed = getSpeedBonus(responseTimeMs)
  const streak = getStreakBonus(streakBeforeThisAnswer)
  return base + speed + streak
}

/**
 * Session XP: +2 per correct, +5 if session score > 80.
 * @param {number} totalScore - sum of all question scores
 * @param {number} correctCount
 */
export function calculateSessionXP(totalScore, correctCount) {
  let xp = correctCount * 2
  if (totalScore > 80) xp += 5
  return xp
}
