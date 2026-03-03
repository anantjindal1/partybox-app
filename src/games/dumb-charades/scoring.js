/**
 * XP awards: 10 per point earned + 5 bonus for winning team.
 */
export function calcXP(teamScore, isWinner) {
  return teamScore * 10 + (isWinner ? 5 : 0)
}

/**
 * Return all teams with the highest score (handles ties).
 */
export function findWinners(teams) {
  const max = Math.max(...teams.map(t => t.score))
  return teams.filter(t => t.score === max)
}
