/**
 * Court Piece — pure game-scoring utilities. No Firebase, no React.
 * Team-derivation helpers live in the shared multiplayer/partnerships.js
 * (Mendikot needs the exact same ones) — re-exported here so nothing
 * else in this game has to change its import path. computeTeamTricks
 * keeps its name in the shared module (also used by Mendikot/Teri) —
 * aliased here to the new per-hand terminology so this game's own code
 * reads consistently.
 */
export { getTeamA, getTeamB, getTeamOf, computeTeamTricks as computeTeamHands } from '../../multiplayer/partnerships'

export const GAME_TARGET = 7
export const SHUTOUT_EXTENSION_TARGET = 13

export function computeRoundOutcome(teamHands) {
  const winningTeam = teamHands.teamA > teamHands.teamB ? 'teamA' : 'teamB'
  const isKot = teamHands[winningTeam] === 13
  return { winningTeam, isKot, pointsAwarded: isKot ? 2 : 1 }
}

/**
 * First to GAME_TARGET wins — UNLESS they reach it while the other
 * team has won zero rounds so far (a shutout in progress). In that case
 * the game keeps going until either the leader reaches
 * SHUTOUT_EXTENSION_TARGET (a full sweep), or the trailing team wins
 * their first round (which ends the game in the ORIGINAL leader's
 * favor — it just confirms they're no longer being shut out, it does
 * not make the trailing team the winner).
 */
export function checkGameWinner(gameScores, roundsWon, target = GAME_TARGET, extendedTarget = SHUTOUT_EXTENSION_TARGET) {
  const leader = gameScores.teamA >= target ? 'teamA' : gameScores.teamB >= target ? 'teamB' : null
  if (!leader) return null
  const trailer = leader === 'teamA' ? 'teamB' : 'teamA'
  if (roundsWon[trailer] > 0) return leader
  if (gameScores[leader] >= extendedTarget) return leader
  return null
}
