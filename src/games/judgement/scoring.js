/**
 * Judgement — pure round-scoring utilities. No Firebase, no React.
 * Exact-match only: hitting your bid precisely scores +stake, missing
 * it by any amount (over OR under) costs -stake. Unlike Call Break,
 * there is no partial credit for overtricks.
 */

export function computeRoundScore(bid, tricksWon) {
  const stake = Math.max(bid, 1) * 10
  return tricksWon === bid ? stake : -stake
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
