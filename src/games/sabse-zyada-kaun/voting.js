/**
 * Sabse Zyada Kaun — pure vote-tallying utilities for the online mode.
 * No vote-by-target helper exists elsewhere in the codebase; every other
 * game's "vote" is a flat yes/no count, not grouped by candidate.
 */

/**
 * Groups VOTE actions by who they were cast for.
 * @param {{type:string, payload:{targetPlayerId:string}}[]} actions
 * @returns {Record<string, number>}
 */
export function tallyVotes(actions) {
  const tally = {}
  for (const action of actions || []) {
    if (action.type !== 'VOTE') continue
    const target = action.payload?.targetPlayerId
    if (!target) continue
    tally[target] = (tally[target] ?? 0) + 1
  }
  return tally
}

/**
 * Player id(s) with the highest vote count. Returns multiple ids on a tie
 * (co-winners), and an empty array if nobody voted at all.
 * @param {Record<string, number>} tally
 */
export function resolveWinners(tally) {
  const entries = Object.entries(tally || {})
  if (entries.length === 0) return []
  const max = Math.max(...entries.map(([, count]) => count))
  if (max <= 0) return []
  return entries.filter(([, count]) => count === max).map(([id]) => id)
}
