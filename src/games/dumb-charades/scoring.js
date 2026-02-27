/**
 * Calculate the score for a completed round.
 * max_words:     1 point per correct word
 * fastest_guess: points weighted by speed (faster = more points per word)
 */
export function calcRoundScore(correct, timings, mode) {
  if (mode === 'fastest_guess') {
    const correctTimings = timings.filter(t => t.result === 'correct')
    if (correctTimings.length === 0) return 0
    const totalMs = correctTimings.reduce((sum, t) => sum + (t.timeTaken ?? 0), 0)
    // Base 10 points per correct word, scaled by speed (faster = bigger bonus)
    const avgMs = totalMs / correctTimings.length
    const speedBonus = Math.max(0, Math.round(500 - avgMs / 20))
    return correct * 10 + speedBonus
  }
  return correct
}

/**
 * XP awards: 1 per correct word + 5 bonus for winning team.
 */
export function calcXP(correct, isWinner) {
  return correct + (isWinner ? 5 : 0)
}

/**
 * Return all teams with the highest score (handles ties).
 */
export function findWinners(teams) {
  const max = Math.max(...teams.map(t => t.score))
  return teams.filter(t => t.score === max)
}

/**
 * Compute badges earned after a completed game.
 */
export function computeBadges(teams) {
  const badges = {}
  teams.forEach(t => { badges[t.id] = [] })

  const winners = findWinners(teams)
  winners.forEach(t => { badges[t.id].push('unstoppableBadge') })

  // MVP Actor: most correct words in any single round
  let mvpTeam = null, mvpCount = 0
  teams.forEach(t => {
    t.roundHistory.forEach(r => {
      if (r.correct > mvpCount) { mvpCount = r.correct; mvpTeam = t.id }
    })
  })
  if (mvpTeam) badges[mvpTeam].push('mvpBadge')

  // Fastest Round: highest score in a single round
  let fastTeam = null, fastScore = -1
  teams.forEach(t => {
    t.roundHistory.forEach(r => {
      if (r.score > fastScore) { fastScore = r.score; fastTeam = t.id }
    })
  })
  if (fastTeam) badges[fastTeam].push('fastRoundBadge')

  return badges
}
