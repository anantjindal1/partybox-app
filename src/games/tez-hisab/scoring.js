/**
 * Tez Hisab scoring: base + speed bonus + streak bonus.
 * XP: +2 per correct, +5 if 12+ correct in session.
 */

/** Speed bonus: <3s = +5, <5s = +3, <7s = +1 */
function getSpeedBonus(responseTimeMs) {
  if (responseTimeMs < 3000) return 5
  if (responseTimeMs < 5000) return 3
  if (responseTimeMs < 7000) return 1
  return 0
}

/** Streak: every 3 consecutive correct = +5 (so 3rd, 6th, 9th... correct) */
function getStreakBonus(streakBeforeThisAnswer) {
  if (streakBeforeThisAnswer < 2) return 0
  return (streakBeforeThisAnswer - 2) % 3 === 0 ? 5 : 0
}

/**
 * Score for one correct answer.
 * @param {number} responseTimeMs - time from question show to answer
 * @param {number} streakBeforeThisAnswer - consecutive correct count before this (0-indexed: 2 = third in a row)
 */
export function calculateQuestionScore(responseTimeMs, streakBeforeThisAnswer) {
  const base = 10
  const speed = getSpeedBonus(responseTimeMs)
  const streak = getStreakBonus(streakBeforeThisAnswer)
  return base + speed + streak
}

/**
 * Session XP: +2 per correct, +5 bonus if 12+ correct.
 * @param {number} correctCount
 */
export function calculateSessionXP(correctCount) {
  let xp = correctCount * 2
  if (correctCount >= 12) xp += 5
  return xp
}
