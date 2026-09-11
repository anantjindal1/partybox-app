/**
 * Court Piece — pure match-scoring utilities. No Firebase, no React.
 * Team-derivation helpers live in the shared multiplayer/partnerships.js
 * (Mendikot needs the exact same ones) — re-exported here so nothing
 * else in this game has to change its import path.
 */
export { getTeamA, getTeamB, getTeamOf, computeTeamTricks } from '../../multiplayer/partnerships'

export const MATCH_TARGET = 7
export const SHUTOUT_EXTENSION_TARGET = 13

export function computeHandOutcome(teamTricks) {
  const winningTeam = teamTricks.teamA > teamTricks.teamB ? 'teamA' : 'teamB'
  const isKot = teamTricks[winningTeam] === 13
  return { winningTeam, isKot, pointsAwarded: isKot ? 2 : 1 }
}

/**
 * First to MATCH_TARGET wins — UNLESS they reach it while the other
 * team has won zero hands so far (a shutout in progress). In that case
 * the match keeps going until either the leader reaches
 * SHUTOUT_EXTENSION_TARGET (a full sweep), or the trailing team wins
 * their first hand (which ends the match in the ORIGINAL leader's
 * favor — it just confirms they're no longer being shut out, it does
 * not make the trailing team the winner).
 */
export function checkMatchWinner(matchScores, handsWon, target = MATCH_TARGET, extendedTarget = SHUTOUT_EXTENSION_TARGET) {
  const leader = matchScores.teamA >= target ? 'teamA' : matchScores.teamB >= target ? 'teamB' : null
  if (!leader) return null
  const trailer = leader === 'teamA' ? 'teamB' : 'teamA'
  if (handsWon[trailer] > 0) return leader
  if (matchScores[leader] >= extendedTarget) return leader
  return null
}
