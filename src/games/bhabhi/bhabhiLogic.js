/**
 * Bhabhi — pure outcome logic. No Firebase, no React.
 *
 * Real-world rules (not the standard "highest card of the led suit wins
 * the hand" shape most other card games here use): every player must
 * follow the led suit if they can. If everyone does, the whole pile is
 * simply discarded and the highest card of the led suit leads next. If
 * a player CAN'T follow suit, play stops immediately and whoever played
 * the highest card of the led suit must pick up the entire pile — adding
 * it to their own hand — and leads next. The first player to empty
 * their hand wins and the game ends.
 */
import { parseCard } from '../../multiplayer/deck'

export function findAceOfSpadesHolder(hands, playerIds) {
  return playerIds.find(id => (hands[id] ?? []).includes('AS')) ?? playerIds[0]
}

/**
 * True only when a played card breaks the led suit AND it's not the
 * first pile of the game — Special Rule 1: the very first pile always
 * runs to full length and always discards, breaks or not, since on the
 * first go-around nobody yet knows who holds what.
 */
export function breaksSuit(cardId, ledSuit, isFirstRound) {
  if (isFirstRound || ledSuit == null) return false
  return parseCard(cardId).suit !== ledSuit
}

/**
 * The currently-active players, reordered to start at `startId`,
 * preserving their original relative seat order. Used to build each new
 * pile's turn sequence once a leader is known.
 */
export function rotateActiveFrom(seatingOrder, activeIds, startId) {
  const order = seatingOrder.filter(id => activeIds.includes(id))
  const idx = order.indexOf(startId)
  if (idx === -1) return order
  return [...order.slice(idx), ...order.slice(0, idx)]
}
