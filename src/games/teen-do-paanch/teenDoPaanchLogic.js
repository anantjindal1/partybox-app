import { cardId, parseCard, SUITS } from '../../multiplayer/deck'

export const TARGET_PATTERNS = [[3, 2, 5], [5, 3, 2], [2, 5, 3]]

/**
 * Every hand, all three players are simultaneously assigned a fixed
 * trick target (3, 2, or 5 — summing to the hand's 10 tricks). Targets
 * rotate hand-to-hand through a fixed 3-cycle so every seat eventually
 * holds each target; the match itself keeps going past 3 hands, the
 * cycle just repeats.
 */
export function computeTargets(turnOrder, handNumber) {
  const pattern = TARGET_PATTERNS[handNumber % TARGET_PATTERNS.length]
  return { [turnOrder[0]]: pattern[0], [turnOrder[1]]: pattern[1], [turnOrder[2]]: pattern[2] }
}

export function getCallerId(targets) {
  return Object.keys(targets).find(id => targets[id] === 5)
}

/**
 * Surplus/deficit scoring, not exact-match: a target of 2 who wins 5
 * tricks scores +3; a target of 5 who wins 3 scores -2.
 */
export function computeHandScores(targets, tricksWon) {
  const scores = {}
  for (const id of Object.keys(targets)) {
    scores[id] = (tricksWon[id] ?? 0) - targets[id]
  }
  return scores
}

/**
 * All three players' cumulative scores move every hand, so more than
 * one can cross the match target in the same hand — genuine
 * co-winners, never re-resolved further.
 */
export function checkMatchWinners(matchScores, target = 10) {
  const winners = Object.entries(matchScores)
    .filter(([, score]) => score >= target)
    .map(([id]) => id)
  return winners.length ? winners : null
}

/**
 * Gates the "Reveal Trump" button: only a player who is NOT leading
 * the trick and holds no card of the led suit may ask for the reveal.
 */
export function canRequestReveal(hand, ledSuit) {
  if (ledSuit == null) return false
  return !hand.some(id => parseCard(id).suit === ledSuit)
}

/**
 * A deliberately explicit 30-card deck (10 dealt per player x 3
 * players — matching the 3+2+5=10 trick targets). 30 isn't divisible
 * by 4, so no uniform whole-rank removal across all 4 suits lands on
 * exactly 30: every suit keeps A,8,9,10,J,Q,K (28), and Spades +
 * Hearts additionally keep their 7 (+2) = 30.
 */
export function createReducedDeck() {
  const KEEP = ['8', '9', '10', 'J', 'Q', 'K', 'A']
  const deck = []
  for (const suit of SUITS) {
    for (const rank of KEEP) deck.push(cardId(rank, suit))
    if (suit === 'spades' || suit === 'hearts') deck.push(cardId('7', suit))
  }
  return deck
}
