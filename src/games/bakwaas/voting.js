/**
 * Bakwaas — pure vote-tallying and answer-list utilities for the online
 * mode. tallyVotes/resolveWinners mirror Sabse Zyada Kaun's voting.js
 * exactly (duplicated, not imported — every game owns its own copy).
 */

export const MAX_ANSWER_LENGTH = 80

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

/**
 * Builds the shuffled, anonymized answer list shown during voting. Each
 * player's ANSWER action doc is keyed by their own playerId (Firestore's
 * one-doc-per-player action contract), so playerId already uniquely
 * identifies "that player's answer" for this round — no separate answer-id
 * space is needed. Called ONCE, host-side, then persisted so every client
 * sees the identical order (same reasoning as Bhed's pickGuessOptions()).
 * @param {{type:string, playerId:string, payload:{text:string}}[]} answerActions
 * @param {() => number} rng
 * @returns {{authorId:string, text:string}[]}
 */
export function buildAnswerList(answerActions, rng = Math.random) {
  const answers = (answerActions || [])
    .filter((a) => a.type === 'ANSWER' && a.payload?.text?.trim())
    .map((a) => ({ authorId: a.playerId, text: a.payload.text.trim() }))
  const shuffled = [...answers]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
