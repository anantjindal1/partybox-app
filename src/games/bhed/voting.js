/**
 * Bhed (Jasoos) — pure vote-tallying utilities, same shape as
 * sabse-zyada-kaun/voting.js (copied per this codebase's one-file-per-game
 * convention — no cross-game imports exist elsewhere).
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
 * (treated by the caller as "no clear consensus" — the Bhed evades), and
 * an empty array if nobody voted at all.
 * @param {Record<string, number>} tally
 */
export function resolveWinners(tally) {
  const entries = Object.entries(tally || {})
  if (entries.length === 0) return []
  const max = Math.max(...entries.map(([, count]) => count))
  if (max <= 0) return []
  return entries.filter(([, count]) => count === max).map(([id]) => id)
}
