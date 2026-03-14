/**
 * ThinkFast localStorage stats.
 * Keys:
 *   partybox_tf_hs_{category}      → best total score (number)
 *   partybox_tf_fastest_{category} → fastest correct response in ms (number)
 *   partybox_tf_played             → total games played (number)
 */

const hsKey      = cat => `partybox_tf_hs_${cat}`
const fastestKey = cat => `partybox_tf_fastest_${cat}`
const PLAYED_KEY = 'partybox_tf_played'

function num(v) {
  const n = Number(v)
  return isFinite(n) ? n : 0
}

export function getStats(category) {
  const highScore  = num(localStorage.getItem(hsKey(category)))
  const raw        = localStorage.getItem(fastestKey(category))
  const fastestMs  = raw !== null ? num(raw) : null
  const gamesPlayed = num(localStorage.getItem(PLAYED_KEY))
  return { highScore, fastestMs, gamesPlayed }
}

/**
 * Record a completed game.
 * @param {string} category
 * @param {number} totalScore
 * @param {{ correct: boolean, responseMs: number, pointsEarned: number }[]} questionHistory
 * @returns {{ newHighScore: boolean, newFastest: boolean }}
 */
export function recordGame(category, totalScore, questionHistory) {
  const prev = getStats(category)

  // High score
  const newHighScore = totalScore > prev.highScore
  if (newHighScore) localStorage.setItem(hsKey(category), String(totalScore))

  // Fastest correct answer this game
  const correctTimes = questionHistory.filter(q => q.correct).map(q => q.responseMs)
  const fastestThisGame = correctTimes.length > 0 ? Math.min(...correctTimes) : null

  let newFastest = false
  if (fastestThisGame !== null) {
    if (prev.fastestMs === null || fastestThisGame < prev.fastestMs) {
      newFastest = true
      localStorage.setItem(fastestKey(category), String(fastestThisGame))
    }
  }

  // Games played
  const played = num(localStorage.getItem(PLAYED_KEY))
  localStorage.setItem(PLAYED_KEY, String(played + 1))

  return { newHighScore, newFastest }
}
