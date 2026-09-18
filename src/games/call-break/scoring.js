/**
 * Call Break — pure round-scoring utilities. No Firebase, no React.
 */

export function computeRoundScore(bid, handsWon) {
  if (handsWon >= bid) return bid + 0.1 * (handsWon - bid)
  return -bid
}

export function computeRoundResults(playerIds, bids, handsWon) {
  return Object.fromEntries(
    playerIds.map(id => [id, computeRoundScore(bids[id], handsWon[id] ?? 0)])
  )
}

export function addToCumulative(cumulativeScores, roundResults) {
  const next = { ...cumulativeScores }
  for (const [playerId, delta] of Object.entries(roundResults)) {
    next[playerId] = (next[playerId] ?? 0) + delta
  }
  return next
}
