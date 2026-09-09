/**
 * Pure hand-management helpers — no Firebase, no React.
 */
import { parseCard, rankIndex, SUITS } from './deck'

export function removeCardFromHand(hand, id) {
  const idx = hand.indexOf(id)
  if (idx === -1) return hand
  return [...hand.slice(0, idx), ...hand.slice(idx + 1)]
}

export function addCardsToHand(hand, ids) {
  return [...hand, ...ids]
}

export function sortHand(hand, { aceHigh = true } = {}) {
  const suitOrder = SUITS
  return [...hand].sort((a, b) => {
    const ca = parseCard(a)
    const cb = parseCard(b)
    const suitDiff = suitOrder.indexOf(ca.suit) - suitOrder.indexOf(cb.suit)
    if (suitDiff !== 0) return suitDiff
    const ra = aceHigh && ca.rank === 'A' ? 999 : rankIndex(ca.rank)
    const rb = aceHigh && cb.rank === 'A' ? 999 : rankIndex(cb.rank)
    return ra - rb
  })
}
