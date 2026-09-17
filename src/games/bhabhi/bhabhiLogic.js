/**
 * Bhabhi — pure outcome logic. No Firebase, no React.
 *
 * Real-world rules (not the standard "highest card of the led suit wins
 * the trick" shape most other card games here use): every player must
 * follow the led suit if they can. If everyone does, the whole pile is
 * simply discarded and the highest card of the led suit leads next. If
 * a player CAN'T follow suit, play stops immediately and whoever played
 * the highest card of the led suit must pick up the entire pile — adding
 * it to their own hand — and leads next. The last player still holding
 * cards loses (the "Bhabhi"); everyone else wins.
 */
import { parseCard } from '../../multiplayer/deck'

export function findAceOfSpadesHolder(hands, playerIds) {
  return playerIds.find(id => (hands[id] ?? []).includes('AS')) ?? playerIds[0]
}

/**
 * True only when a played card breaks the led suit AND it's not the
 * first pile of the match — Special Rule 1: the very first pile always
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

/**
 * The next still-active player after a given seat, walking the FIXED
 * seating order (not the shrinking active list) — works even when
 * `departedId` has just this instant been removed from `activeIds`.
 * Needed for Special Rule 4: a pile's highest-card winner can also be
 * the player who just emptied their hand on that very card, in which
 * case leadership skips to the next active player after them.
 */
export function nextActiveAfterSeat(seatingOrder, activeIds, departedId) {
  const idx = seatingOrder.indexOf(departedId)
  if (idx === -1) return activeIds[0] ?? null
  for (let step = 1; step <= seatingOrder.length; step++) {
    const candidate = seatingOrder[(idx + step) % seatingOrder.length]
    if (activeIds.includes(candidate)) return candidate
  }
  return null
}
