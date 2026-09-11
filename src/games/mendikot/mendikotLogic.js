/**
 * Mendikot — pure outcome logic. No Firebase, no React.
 * Team-derivation helpers are shared with Court Piece — see
 * multiplayer/partnerships.js — re-exported here for a single import
 * path within this game's own files.
 */
export { getTeamA, getTeamB, getTeamOf, computeTeamTricks } from '../../multiplayer/partnerships'

const TEN_IDS = ['10S', '10H', '10D', '10C']

export function countTensInTrick(trickCardIds) {
  return trickCardIds.filter(id => TEN_IDS.includes(id)).length
}

/**
 * A team that captures all four 10s wins outright (a "Mendikot"). Else
 * whoever captured more 10s wins. A 2-2 split is broken by trick count,
 * which can never itself be a tie (13 tricks is odd).
 */
export function computeMendikotOutcome(teamTricks, tensCaptured) {
  if (tensCaptured.teamA === 4) return { winningTeam: 'teamA', isMendikot: true }
  if (tensCaptured.teamB === 4) return { winningTeam: 'teamB', isMendikot: true }
  if (tensCaptured.teamA !== tensCaptured.teamB) {
    return { winningTeam: tensCaptured.teamA > tensCaptured.teamB ? 'teamA' : 'teamB', isMendikot: false }
  }
  return { winningTeam: teamTricks.teamA > teamTricks.teamB ? 'teamA' : 'teamB', isMendikot: false }
}
