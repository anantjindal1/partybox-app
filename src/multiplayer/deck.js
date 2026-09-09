/**
 * Standard 52-card deck — pure, no Firebase, no React.
 * Cards are short id strings ('AS', '10H', 'KD') rather than objects: this
 * is what actually gets written into room.state and re-sent to every
 * client on every change, so keeping it compact matters.
 */

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs']

const SUIT_LETTER = { spades: 'S', hearts: 'H', diamonds: 'D', clubs: 'C' }
const LETTER_SUIT = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' }

export function cardId(rank, suit) {
  return `${rank}${SUIT_LETTER[suit]}`
}

// Suit is always the last character; rank is everything before it. Never
// index by position (id[0]/id[1]) — that breaks on the two-character '10'
// rank, e.g. '10H'[0] === '1', not '10'.
export function parseCard(id) {
  const suitLetter = id.slice(-1)
  const rank = id.slice(0, -1)
  return { rank, suit: LETTER_SUIT[suitLetter] }
}

export function rankIndex(rank) {
  return RANKS.indexOf(rank)
}

export function createDeck({ includeJokers = false } = {}) {
  const deck = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(cardId(rank, suit))
    }
  }
  if (includeJokers) {
    deck.push('JOKER1', 'JOKER2')
  }
  return deck
}

export function shuffleDeck(deck, rng = Math.random) {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
