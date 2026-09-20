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

const TOTAL_HANDS = 13

/**
 * True once playing on can't change who wins: a team took all four 10s,
 * or all four 10s are captured with a 3-1 split, or they split 2-2 and
 * one team already holds a majority of the 13 hands. A team sitting on
 * three 10s with the fourth still out is NOT decided — the 4-0 Mendikot
 * is still possible.
 */
export function isOutcomeDecided(teamHands, tensCaptured) {
  if (tensCaptured.teamA === 4 || tensCaptured.teamB === 4) return true
  if (tensCaptured.teamA + tensCaptured.teamB < 4) return false
  if (tensCaptured.teamA !== tensCaptured.teamB) return true
  const majority = Math.floor(TOTAL_HANDS / 2) + 1
  return teamHands.teamA >= majority || teamHands.teamB >= majority
}
