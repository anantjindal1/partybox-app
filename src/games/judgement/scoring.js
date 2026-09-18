/**
 * Judgement — pure round-scoring utilities. No Firebase, no React.
 * Exact-match only: hitting your bid precisely scores +stake, missing
 * it by any amount (over OR under) costs -stake. Unlike Call Break,
 * there is no partial credit for overtricks.
 */

export function computeRoundScore(bid, handsWon) {
  const stake = Math.max(bid, 1) * 10
  return handsWon === bid ? stake : -stake
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
