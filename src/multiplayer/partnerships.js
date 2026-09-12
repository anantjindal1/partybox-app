/**
 * Fixed 2v2 partnership helpers — no Firebase, no React. Seats 0+2 form
 * one team, seats 1+3 the other, since join order is the only seating
 * signal this app has. Shared by any 4-player fixed-partnership game
 * (Court Piece, Mendikot, and any future one) rather than duplicated
 * per game — promoted here after Court Piece and Mendikot both needed
 * the exact same team-derivation logic.
 */

export function getTeamA(turnOrder) {
  return [turnOrder[0], turnOrder[2]]
}

export function getTeamB(turnOrder) {
  return [turnOrder[1], turnOrder[3]]
}

export function getTeamOf(playerId, turnOrder) {
  return getTeamA(turnOrder).includes(playerId) ? 'teamA' : 'teamB'
}

export function computeTeamTricks(turnOrder, tricksWon) {
  const sum = ids => ids.reduce((total, id) => total + (tricksWon[id] ?? 0), 0)
  return { teamA: sum(getTeamA(turnOrder)), teamB: sum(getTeamB(turnOrder)) }
}

/**
 * Builds a turnOrder that puts the host and their chosen partner at
 * indices 0/2 (teamA) and the remaining two players at 1/3 (teamB) —
 * lets a host pick their own partner instead of leaving it to plain
 * join order. Falls back to the unmodified playerIds whenever nothing
 * valid was picked, so a host who never opens the picker gets today's
 * exact behavior.
 */
export function buildTurnOrderFromPartner(playerIds, hostId, partnerId) {
  if (
    !partnerId ||
    playerIds.length !== 4 ||
    hostId === partnerId ||
    !playerIds.includes(hostId) ||
    !playerIds.includes(partnerId)
  ) {
    return playerIds
  }
  const others = playerIds.filter(id => id !== hostId && id !== partnerId)
  return [hostId, others[0], partnerId, others[1]]
}
