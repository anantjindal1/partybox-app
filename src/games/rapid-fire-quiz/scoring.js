/**
 * Tez Dimaag Challenge scoring.
 * Base 10, speed <3s +5, <5s +3, <8s +1, streak 3 consecutive = +5.
 * Tie breaker: correctCount → avg response time → fastest single answer.
 * XP: +2 per correct, +3 round winner.
 */

function getSpeedBonus(responseTimeMs) {
  if (responseTimeMs < 3000) return 5
  if (responseTimeMs < 5000) return 3
  if (responseTimeMs < 8000) return 1
  return 0
}

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
 * Average response time (only correct answers), or Infinity if none.
 * @param {number[]} responseTimes - ms for each correct answer
 */
function avgResponseTime(responseTimes) {
  if (!responseTimes || responseTimes.length === 0) return Infinity
  return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
}

/**
 * Min response time (fastest single correct answer), or Infinity if none.
 * @param {number[]} responseTimes
 */
function minResponseTime(responseTimes) {
  if (!responseTimes || responseTimes.length === 0) return Infinity
  return Math.min(...responseTimes)
}

/**
 * Tie breaker: 1) higher correctCount 2) lower avg response time 3) fastest single answer.
 * Returns index of winner in players array.
 * @param {{ id: string, name: string, score: number, correctCount: number, responseTimes: number[] }[]} players
 */
export function calculateWinner(players) {
  if (!players || players.length === 0) return -1
  let best = 0
  for (let i = 1; i < players.length; i++) {
    const a = players[best]
    const b = players[i]
    if (b.correctCount > a.correctCount) best = i
    else if (b.correctCount === a.correctCount) {
      const avgA = avgResponseTime(a.responseTimes)
      const avgB = avgResponseTime(b.responseTimes)
      if (avgB < avgA) best = i
      else if (avgB === avgA) {
        const minA = minResponseTime(a.responseTimes)
        const minB = minResponseTime(b.responseTimes)
        if (minB < minA) best = i
      }
    }
  }
  return best
}

/**
 * XP for a player: +2 per correct, +3 if round winner.
 * @param {number} correctCount
 * @param {boolean} isWinner
 */
export function calculatePlayerXP(correctCount, isWinner) {
  return correctCount * 2 + (isWinner ? 3 : 0)
}
