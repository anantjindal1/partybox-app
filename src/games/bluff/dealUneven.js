/**
 * Bluff deals the WHOLE deck out, even when it doesn't divide evenly
 * across players — the shared dealCards() deliberately refuses this
 * (see src/multiplayer/deal.js), so Bluff owns its own uneven-split
 * logic on top of the shared shuffle/deck primitives.
 */
export function dealUneven(deck, playerIds) {
  const hands = {}
  for (const id of playerIds) hands[id] = []

  // Round-robin one card at a time so any remainder spreads across the
  // first few seats (at most one extra card each) rather than dumping
  // it all on one player.
  let seat = 0
  for (const card of deck) {
    hands[playerIds[seat]].push(card)
    seat = (seat + 1) % playerIds.length
  }

  return { hands }
}
