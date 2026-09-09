/**
 * Pure trick-resolution — no Firebase, no React.
 * Implemented as two-pass FILTERING, not a global max-by-rank: an off-suit,
 * non-trump card must never enter either comparison, however high its
 * rank — it sits out the trick entirely regardless.
 */
import { parseCard, rankIndex } from './deck'

function highestRank(plays, aceHigh) {
  return plays.reduce((best, play) => {
    const rank = parseCard(play.card).rank
    const value = aceHigh && rank === 'A' ? 999 : rankIndex(rank)
    const bestValue = aceHigh && parseCard(best.card).rank === 'A' ? 999 : rankIndex(parseCard(best.card).rank)
    return value > bestValue ? play : best
  }).playerId
}

export function resolveTrick(playedCards, ledSuit, trumpSuit = null, { aceHigh = true } = {}) {
  if (trumpSuit != null) {
    const trumpPlays = playedCards.filter(p => parseCard(p.card).suit === trumpSuit)
    if (trumpPlays.length > 0) return highestRank(trumpPlays, aceHigh)
  }

  const ledPlays = playedCards.filter(p => parseCard(p.card).suit === ledSuit)
  return highestRank(ledPlays, aceHigh)
}

/**
 * Which cards from `hand` are legal to play against the current trick's
 * led suit: must follow suit if any card of that suit is held, otherwise
 * any card is a legal free dump. `ledSuit === null` means this player is
 * leading the trick, so everything is legal. Generic across every
 * follow-suit trick game, not specific to any one of them.
 */
export function getLegalPlays(hand, ledSuit) {
  if (ledSuit == null) return [...hand]
  const followSuit = hand.filter(id => parseCard(id).suit === ledSuit)
  return followSuit.length > 0 ? followSuit : [...hand]
}
