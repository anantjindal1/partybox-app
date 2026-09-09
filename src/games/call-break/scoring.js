/**
 * Call Break — pure round-scoring utilities. No Firebase, no React.
 */

export function computeRoundScore(bid, tricksWon) {
  if (tricksWon >= bid) return bid + 0.1 * (tricksWon - bid)
  return -bid
}

export function computeRoundResults(playerIds, bids, tricksWon) {
  return Object.fromEntries(
    playerIds.map(id => [id, computeRoundScore(bids[id], tricksWon[id] ?? 0)])
  )
}

export function addToCumulative(cumulativeScores, roundResults) {
  const next = { ...cumulativeScores }
  for (const [playerId, delta] of Object.entries(roundResults)) {
    next[playerId] = (next[playerId] ?? 0) + delta
  }
  return next
}
