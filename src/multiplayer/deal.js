import { parseCard } from './deck'

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

/**
 * Deals every card in the deck, round-robin, one at a time — nothing is
 * ever left undealt. If the deck doesn't divide evenly, the first
 * `deck.length % playerIds.length` players (in order) simply hold one
 * more card than everyone else. This is a deliberate exception to
 * `dealEven`'s discard-the-remainder policy, for games (like Satti)
 * that structurally need the entire deck in play.
 */
export function dealAll(deck, playerIds) {
  const hands = {}
  for (const id of playerIds) hands[id] = []
  deck.forEach((card, i) => {
    hands[playerIds[i % playerIds.length]].push(card)
  })
  return { hands }
}

const FACE_RANKS = ['A', 'K', 'Q', 'J']
const MAX_REDEALS = 1000

export function hasFaceCard(hand) {
  return hand.some(card => FACE_RANKS.includes(parseCard(card).rank))
}

/**
 * House rule (Teri, Court Piece, Mendikot, Teen Do Paanch): a deal where
 * any player holds no face card (A/K/Q/J) is void and dealt again. Runs
 * `deal` until every hand from `fullHands(result)` has one — silently, so
 * nobody ever sees a void hand.
 */
export function dealWithFaceCards(deal, fullHands = result => result.hands) {
  let result
  for (let i = 0; i < MAX_REDEALS; i++) {
    result = deal()
    if (Object.values(fullHands(result)).every(hasFaceCard)) break
  }
  return result
}

/**
 * For games that deal `firstCount` cards, call trump, then deal
 * `secondCount` more from `remaining`: checks the complete hands up front,
 * so trump is never called on a deal that would be void.
 */
export function dealStagedWithFaceCards(makeDeck, playerIds, firstCount, secondCount) {
  return dealWithFaceCards(
    () => dealCards(makeDeck(), playerIds, firstCount),
    ({ hands, remaining }) => {
      const { hands: rest } = dealCards(remaining, playerIds, secondCount)
      return Object.fromEntries(playerIds.map(id => [id, [...hands[id], ...rest[id]]]))
    }
  )
}
