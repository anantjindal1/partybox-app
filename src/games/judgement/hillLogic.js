/**
 * Judgement — pure hill-shape and bidding-order utilities. No Firebase,
 * no React.
 */

/**
 * The "hill" of hand sizes for a full game: 1,2,...,maxHandSize,...,2,1.
 * The peak appears exactly once (2*maxHandSize-1 rounds total) — a naive
 * implementation can easily double-count it, which would silently add an
 * extra round and re-deal the peak hand size twice in a row.
 */
export function computeHandSizeSequence(maxHandSize) {
  const up = Array.from({ length: maxHandSize }, (_, i) => i + 1)
  const down = Array.from({ length: maxHandSize - 1 }, (_, i) => maxHandSize - 1 - i)
  return [...up, ...down]
}

/** Rotates an array to start at startIdx, wrapping around. */
export function rotate(arr, startIdx) {
  return [...arr.slice(startIdx), ...arr.slice(0, startIdx)]
}

/**
 * The hook rule: the number the LAST bidder (the last id in bidOrder) is
 * not allowed to choose, since it would make every bid sum to exactly
 * the hand size. Returns null if no such number is actually in the legal
 * 0..handSizeThisRound range (nothing to forbid in that case).
 * @param {number} handSizeThisRound
 * @param {Record<string, number>} bidsSoFar - bids from everyone except the last bidder
 */
export function getForbiddenBid(handSizeThisRound, bidsSoFar) {
  const sum = Object.values(bidsSoFar).reduce((a, b) => a + b, 0)
  const forbidden = handSizeThisRound - sum
  return forbidden >= 0 && forbidden <= handSizeThisRound ? forbidden : null
}

/**
 * Whoever bid the highest number gets to choose trump. Ties go to
 * whichever of them appears earliest in bidOrder (a precomputed seat
 * rotation, NOT the order actions happened to arrive in over the
 * network — see index.jsx for why that distinction matters).
 * @param {string[]} bidOrder
 * @param {Record<string, number>} bids
 */
export function determineTrumpChooser(bidOrder, bids) {
  let bestId = null
  let bestBid = -Infinity
  for (const id of bidOrder) {
    if (bids[id] > bestBid) {
      bestBid = bids[id]
      bestId = id
    }
  }
  return bestId
}
