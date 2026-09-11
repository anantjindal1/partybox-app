import { cardId, parseCard, RANKS, SUITS } from '../../multiplayer/deck'

/**
 * A deliberately fresh, exactly-sized deck for each round: the first
 * `playerCount` ranks x all 4 suits (4N cards for N players), so
 * everyone can be dealt exactly 4 cards with nothing left over.
 */
export function buildDonkeyDeck(playerCount) {
  const ranks = RANKS.slice(0, playerCount)
  const deck = []
  for (const rank of ranks) {
    for (const suit of SUITS) deck.push(cardId(rank, suit))
  }
  return deck
}

export function hasFourOfAKind(hand) {
  if (hand.length !== 4) return false
  const ranks = hand.map(id => parseCard(id).rank)
  return ranks.every(r => r === ranks[0])
}

/**
 * chosenCards: {playerId: cardId} — the card each active player is
 * passing to their neighbor. The caller must fully populate this
 * (auto-picking a random card for anyone who didn't choose in time)
 * before calling — this function assumes completeness.
 */
export function resolvePassRound(hands, turnOrder, chosenCards) {
  const newHands = {}
  turnOrder.forEach((playerId, i) => {
    const prevPlayerId = turnOrder[(i - 1 + turnOrder.length) % turnOrder.length]
    const remaining = hands[playerId].filter(id => id !== chosenCards[playerId])
    newHands[playerId] = [...remaining, chosenCards[prevPlayerId]]
  })
  return newHands
}

export function nextLetters(currentLetters) {
  return 'DONKEY'.slice(0, (currentLetters?.length ?? 0) + 1)
}

export function isEliminated(letters) {
  return letters === 'DONKEY'
}

/**
 * The donkey is whoever reacted LAST among expectedReactorIds (by
 * server timestamp) — or, if anyone never reacted before the deadline,
 * the first such non-reactor in seat order (never reacting is
 * strictly "later" than any late reaction; seat order makes ties
 * deterministic).
 */
export function resolveDonkeyRound(reactActions, expectedReactorIds) {
  const reacted = reactActions
    .filter(a => expectedReactorIds.includes(a.playerId))
    .sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0))
  const reactedIds = reacted.map(a => a.playerId)
  const neverReacted = expectedReactorIds.filter(id => !reactedIds.includes(id))
  if (neverReacted.length > 0) return neverReacted[0]
  return reactedIds[reactedIds.length - 1]
}
