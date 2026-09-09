/**
 * Pure turn-management utilities — no Firebase, no React, fully unit-testable.
 * Player entries may be plain ID strings or objects with an `id` field.
 */

export function createTurnState(players) {
  const playerIds = players.map(p => (typeof p === 'string' ? p : p.id))
  return { playerIds, currentIdx: 0, round: 1 }
}

export function getCurrentPlayer(turnState) {
  if (!turnState.playerIds.length) return null
  return { id: turnState.playerIds[turnState.currentIdx] }
}

export function advanceTurn(turnState) {
  const { playerIds, currentIdx, round } = turnState
  if (!playerIds.length) return turnState
  const nextIdx = (currentIdx + 1) % playerIds.length
  const newRound = nextIdx === 0 ? round + 1 : round
  return { playerIds, currentIdx: nextIdx, round: newRound }
}

export function removePlayer(turnState, playerId) {
  const playerIds = turnState.playerIds.filter(id => id !== playerId)
  if (!playerIds.length) return { playerIds: [], currentIdx: 0, round: turnState.round }
  const currentIdx = turnState.currentIdx >= playerIds.length ? 0 : turnState.currentIdx
  return { playerIds, currentIdx, round: turnState.round }
}

export function isRoundComplete(turnState) {
  return turnState.currentIdx === 0
}

// Jumps the lead directly to an arbitrary player — trick-taking games need
// the next trick led by whoever WON the last trick, not by advancing one
// seat at a time. Each call represents a new trick starting, so `round`
// always increments here (unlike advanceTurn, which only increments when
// the seat index wraps back to 0 — that no longer coincides with "a trick
// just finished" once the lead can jump around). Callers must track trick
// completion themselves (cards played this trick === player count) rather
// than relying on isRoundComplete once this function is in use.
export function setCurrentPlayer(turnState, playerId) {
  const { playerIds, round } = turnState
  const idx = playerIds.indexOf(playerId)
  if (idx === -1) return turnState
  return { playerIds, currentIdx: idx, round: round + 1 }
}
