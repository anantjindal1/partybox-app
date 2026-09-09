import { RANKS, SUITS, cardId, parseCard, rankIndex, createDeck, shuffleDeck } from '../deck'

function seededRng(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

describe('createDeck', () => {
  test('produces exactly 52 unique ids with no jokers', () => {
    const deck = createDeck()
    expect(deck.length).toBe(52)
    expect(new Set(deck).size).toBe(52)
  })

  test('produces 54 unique ids with jokers included', () => {
    const deck = createDeck({ includeJokers: true })
    expect(deck.length).toBe(54)
    expect(new Set(deck).size).toBe(54)
    expect(deck).toContain('JOKER1')
    expect(deck).toContain('JOKER2')
  })

  test('every card round-trips through cardId/parseCard', () => {
    const deck = createDeck()
    for (const id of deck) {
      const { rank, suit } = parseCard(id)
      expect(cardId(rank, suit)).toBe(id)
    }
  })

  test('parseCard correctly handles the two-character "10" rank', () => {
    expect(parseCard('10H')).toEqual({ rank: '10', suit: 'hearts' })
    expect(parseCard('10S')).toEqual({ rank: '10', suit: 'spades' })
  })

  test('parseCard handles single-character ranks', () => {
    expect(parseCard('AS')).toEqual({ rank: 'A', suit: 'spades' })
    expect(parseCard('KD')).toEqual({ rank: 'K', suit: 'diamonds' })
    expect(parseCard('2C')).toEqual({ rank: '2', suit: 'clubs' })
  })
})

describe('rankIndex', () => {
  test('ace is lowest (index 0), king is highest', () => {
    expect(rankIndex('A')).toBe(0)
    expect(rankIndex('K')).toBe(RANKS.length - 1)
  })

  test('is monotonically increasing through the rank order', () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(rankIndex(RANKS[i])).toBeGreaterThan(rankIndex(RANKS[i - 1]))
    }
  })
})

describe('shuffleDeck', () => {
  test('never drops or duplicates a card', () => {
    const deck = createDeck()
    const shuffled = shuffleDeck(deck, seededRng(1))
    expect(shuffled.length).toBe(deck.length)
    expect(new Set(shuffled)).toEqual(new Set(deck))
  })

  test('does not mutate the input array', () => {
    const deck = createDeck()
    const copy = [...deck]
    shuffleDeck(deck, seededRng(1))
    expect(deck).toEqual(copy)
  })

  test('is deterministic given the same rng sequence', () => {
    const deck = createDeck()
    const a = shuffleDeck(deck, seededRng(42))
    const b = shuffleDeck(deck, seededRng(42))
    expect(a).toEqual(b)
  })

  test('actually reorders the deck (overwhelmingly likely with a real shuffle)', () => {
    const deck = createDeck()
    const shuffled = shuffleDeck(deck, seededRng(7))
    expect(shuffled).not.toEqual(deck)
  })
})
