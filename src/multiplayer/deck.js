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

// Suit is always the last character of the base id; rank is everything
// before it. Never index by position (id[0]/id[1]) — that breaks on the
// two-character '10' rank, e.g. '10H'[0] === '1', not '10'.
// Multi-deck ids carry a '#N' copy suffix (e.g. '10S#1') so two physical
// copies of the same card have distinct ids — strip it before parsing.
export function parseCard(id) {
  const base = id.includes('#') ? id.slice(0, id.indexOf('#')) : id
  const suitLetter = base.slice(-1)
  const rank = base.slice(0, -1)
  return { rank, suit: LETTER_SUIT[suitLetter] }
}

export function rankIndex(rank) {
  return RANKS.indexOf(rank)
}

export function createDeck({ includeJokers = false, deckCount = 1 } = {}) {
  const deck = []
  for (let copy = 0; copy < deckCount; copy++) {
    const suffix = deckCount > 1 ? `#${copy}` : ''
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push(cardId(rank, suit) + suffix)
      }
    }
    if (includeJokers) {
      deck.push(`JOKER1${suffix}`, `JOKER2${suffix}`)
    }
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
