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
 * Deals as many cards as possible while keeping every player's hand the
 * SAME size — if the deck doesn't divide evenly, the leftover cards are
 * simply never dealt (removed from play for this hand/round), rather
 * than spread unevenly across a few seats. Fully generic — used by any
 * game that wants every player to always hold an equal number of cards
 * regardless of player count.
 */
export function dealEven(deck, playerIds) {
  const cardsPerPlayer = Math.floor(deck.length / playerIds.length)
  return dealCards(deck, playerIds, cardsPerPlayer)
}
