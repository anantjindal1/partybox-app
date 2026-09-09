/**
 * Pure card dealing — no Firebase, no React.
 * cardsPerPlayer is required and never silently adjusted: each game
 * builds its own deck (full 52, or a reduced one, e.g. Teen Do Paanch's
 * ~30-card deck) and knows exactly how many cards it wants dealt. This
 * function refuses to guess at a remainder policy.
 */
export function dealCards(deck, playerIds, cardsPerPlayer) {
  const needed = cardsPerPlayer * playerIds.length
  if (needed > deck.length) {
    throw new Error(
      `dealCards: need ${needed} cards for ${playerIds.length} players x ${cardsPerPlayer} each, but deck only has ${deck.length}`
    )
  }

  const hands = {}
  let cursor = 0
  for (const playerId of playerIds) {
    hands[playerId] = deck.slice(cursor, cursor + cardsPerPlayer)
    cursor += cardsPerPlayer
  }

  return { hands, remaining: deck.slice(cursor) }
}

/**
 * Deals the WHOLE deck out, even when it doesn't divide evenly across
 * players — dealCards() above deliberately refuses this. Round-robin one
 * card at a time so any remainder spreads across the first few seats (at
 * most one extra card each) rather than dumping it all on one player.
 * Fully generic — used by any game that wants every card dealt out with
 * no leftover, regardless of player count.
 */
export function dealUneven(deck, playerIds) {
  const hands = {}
  for (const id of playerIds) hands[id] = []

  let seat = 0
  for (const card of deck) {
    hands[playerIds[seat]].push(card)
    seat = (seat + 1) % playerIds.length
  }

  return { hands }
}
