/**
 * A to Z Dhamaka scoring.
 * Unique valid = 10, Duplicate valid = 5, Invalid = 0.
 * Bonuses: +5 all 4 valid, +5 all 4 unique.
 * XP: +1 per valid word, +3 round winner.
 */

const POINTS_UNIQUE = 10
const POINTS_DUPLICATE = 5
const POINTS_INVALID = 0
const BONUS_ALL_VALID = 5
const BONUS_ALL_UNIQUE = 5

/**
 * Build per-player score for the round from answers, validation, and duplicate map.
 * duplicateMap: Record<"category:normalizedWord", true> for answers that appear >1 time in that category.
 * validMap: Record<playerId, Record<category, boolean>> — whether each answer is valid (in dictionary, starts with letter).
 *
 * @param {{ id: string, name: string, answers: Record<string, string> }[]} players
 * @param {Record<string, boolean>} duplicateMap - "category:word" (lowercase) -> true if duplicate
 * @param {Record<string, Record<string, boolean>>} validMap - playerId -> category -> valid
 * @param {string[]} categories - the 4 categories for this round
 */
export function calculateScores(players, duplicateMap, validMap, categories) {
  if (!players || !categories || !validMap) {
    return players ? players.map(p => ({ ...p, score: p.score || 0 })) : []
  }
  const dup = duplicateMap || {}

  return players.map(p => {
    let roundScore = 0
    let validCount = 0
    let uniqueCount = 0
    for (const cat of categories) {
      const word = (p.answers && p.answers[cat]) ? String(p.answers[cat]).trim() : ''
      const valid = validMap[p.id] && validMap[p.id][cat]
      if (!valid) {
        roundScore += POINTS_INVALID
        continue
      }
      validCount++
      const key = `${cat}:${word.toLowerCase()}`
      const isDup = dup[key]
      if (isDup) {
        roundScore += POINTS_DUPLICATE
      } else {
        roundScore += POINTS_UNIQUE
        uniqueCount++
      }
    }
    if (validCount === 4) roundScore += BONUS_ALL_VALID
    if (uniqueCount === 4) roundScore += BONUS_ALL_UNIQUE
    return {
      ...p,
      score: (p.score || 0) + roundScore,
      lastRoundValidCount: validCount,
      lastRoundUniqueCount: uniqueCount
    }
  })
}

/**
 * XP: +1 per valid word, +3 for round winner.
 * @param {number} validWordCount
 * @param {boolean} isRoundWinner
 */
export function calculatePlayerXP(validWordCount, isRoundWinner) {
  return (validWordCount || 0) + (isRoundWinner ? 3 : 0)
}

/**
 * Index of highest score in players array (round winner).
 * @param {{ score: number }[]} players
 */
export function getRoundWinnerIndex(players) {
  if (!players || players.length === 0) return -1
  let best = 0
  for (let i = 1; i < players.length; i++) {
    if (players[i].score > players[best].score) best = i
  }
  return best
}

/**
 * Build duplicate map: "category:normalizedWord" -> true if that word appears
 * more than once in the same category across players (case-insensitive).
 * @param {{ id: string, answers: Record<string, string> }[]} players
 * @param {string[]} categories
 * @returns {Record<string, boolean>}
 */
export function buildDuplicateMap(players, categories) {
  const out = {}
  if (!players || !categories) return out
  for (const cat of categories) {
    const counts = {}
    for (const p of players) {
      const w = (p.answers && p.answers[cat]) ? String(p.answers[cat]).trim().toLowerCase() : ''
      if (!w) continue
      counts[w] = (counts[w] || 0) + 1
    }
    for (const [word, count] of Object.entries(counts)) {
      if (count > 1) out[`${cat}:${word}`] = true
    }
  }
  return out
}
