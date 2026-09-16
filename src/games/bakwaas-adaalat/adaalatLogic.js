/**
 * Bakwaas Adaalat — pure logic, no Firebase, no React.
 */

/**
 * Picks the next round's two lawyers, preferring players who haven't
 * argued yet this cycle (fair rotation) — resets the cycle the moment
 * fewer than 2 eligible players remain, rather than forcing an uneven
 * final round with only one fresh face.
 * @returns {{ lawyerIds: string[], nextArguedIds: string[] }}
 */
export function pickLawyers(playerIds, arguedIds = [], rng = Math.random) {
  const notYetArgued = playerIds.filter(id => !arguedIds.includes(id))
  const cycleResets = notYetArgued.length < 2
  const pool = cycleResets ? playerIds : notYetArgued
  const shuffled = [...pool].sort(() => rng() - 0.5)
  const lawyerIds = shuffled.slice(0, 2)
  const nextArguedIds = cycleResets ? [...lawyerIds] : [...arguedIds, ...lawyerIds]
  return { lawyerIds, nextArguedIds }
}

/** Groups VOTE actions by who they were cast for. */
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

/** Lawyer id(s) with the highest vote count — ties split the win. */
export function resolveWinners(tally, lawyerIds) {
  const counts = lawyerIds.map(id => tally[id] ?? 0)
  const max = Math.max(...counts)
  if (max <= 0) return []
  return lawyerIds.filter(id => (tally[id] ?? 0) === max)
}
