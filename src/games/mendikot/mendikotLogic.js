/**
 * Mendikot — pure outcome logic. No Firebase, no React.
 * Team-derivation helpers are shared with Court Piece — see
 * multiplayer/partnerships.js — re-exported here for a single import
 * path within this game's own files.
 */
// computeTeamTricks lives in the shared multiplayer/partnerships module
// (also used by Court Piece/Teri) and keeps its original name there —
// aliased to the new per-hand terminology here so Mendikot's own code and
// callers read consistently. Rename the shared export itself once every
// consumer has moved to the new terminology.
export { getTeamA, getTeamB, getTeamOf, computeTeamTricks as computeTeamHands } from '../../multiplayer/partnerships'

const TEN_IDS = ['10S', '10H', '10D', '10C']

export function countTensInHand(handCardIds) {
  return handCardIds.filter(id => TEN_IDS.includes(id)).length
}

/**
 * A team that captures all four 10s wins outright (a "Mendikot"). Else
 * whoever captured more 10s wins. A 2-2 split is broken by hand count,
 * which can never itself be a tie (13 hands is odd).
 */
export function computeMendikotOutcome(teamHands, tensCaptured) {
  if (tensCaptured.teamA === 4) return { winningTeam: 'teamA', isMendikot: true }
  if (tensCaptured.teamB === 4) return { winningTeam: 'teamB', isMendikot: true }
  if (tensCaptured.teamA !== tensCaptured.teamB) {
    return { winningTeam: tensCaptured.teamA > tensCaptured.teamB ? 'teamA' : 'teamB', isMendikot: false }
  }
  return { winningTeam: teamHands.teamA > teamHands.teamB ? 'teamA' : 'teamB', isMendikot: false }
}
