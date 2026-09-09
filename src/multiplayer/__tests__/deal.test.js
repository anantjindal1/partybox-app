import { dealCards, dealUneven } from '../deal'
import { createDeck, shuffleDeck } from '../deck'

describe('dealCards', () => {
  test('deals exactly cardsPerPlayer to each player', () => {
    const deck = createDeck()
    const { hands } = dealCards(deck, ['a', 'b', 'c', 'd'], 13)
    for (const id of ['a', 'b', 'c', 'd']) {
      expect(hands[id].length).toBe(13)
    }
  })

  test('every dealt card is unique across all hands (no duplicates dealt)', () => {
    const deck = createDeck()
    const { hands } = dealCards(deck, ['a', 'b', 'c', 'd'], 13)
    const allDealt = Object.values(hands).flat()
    expect(new Set(allDealt).size).toBe(allDealt.length)
    expect(allDealt.length).toBe(52)
  })

  test('remaining contains exactly the undealt cards', () => {
    const deck = createDeck()
    const { hands, remaining } = dealCards(deck, ['a', 'b'], 5)
    expect(remaining.length).toBe(deck.length - 10)
    const allDealt = new Set(Object.values(hands).flat())
    for (const card of remaining) {
      expect(allDealt.has(card)).toBe(false)
    }
  })

  test('deals in order from the front of the deck (host controls randomness via shuffleDeck beforehand)', () => {
    const deck = createDeck()
    const { hands } = dealCards(deck, ['a', 'b'], 3)
    expect(hands.a).toEqual(deck.slice(0, 3))
    expect(hands.b).toEqual(deck.slice(3, 6))
  })

  test('throws when there are not enough cards for the requested deal', () => {
    const deck = createDeck()
    expect(() => dealCards(deck, ['a', 'b', 'c', 'd', 'e'], 13)).toThrow()
  })

  test('does not throw exactly at the boundary (cardsPerPlayer * players === deck.length)', () => {
    const deck = createDeck()
    expect(() => dealCards(deck, ['a', 'b', 'c', 'd'], 13)).not.toThrow()
  })

  test('works with a reduced deck (e.g. Teen Do Paanch style)', () => {
    const reduced = createDeck().slice(0, 30)
    const { hands, remaining } = dealCards(reduced, ['a', 'b', 'c'], 10)
    expect(hands.a.length).toBe(10)
    expect(hands.b.length).toBe(10)
    expect(hands.c.length).toBe(10)
    expect(remaining.length).toBe(0)
  })

  test('works correctly on a shuffled deck too', () => {
    const deck = shuffleDeck(createDeck(), () => 0.42)
    const { hands } = dealCards(deck, ['a', 'b', 'c', 'd'], 13)
    const allDealt = new Set(Object.values(hands).flat())
    expect(allDealt.size).toBe(52)
  })
})

describe('dealUneven', () => {
  test('deals the entire deck with no leftover', () => {
    const deck = createDeck()
    const { hands } = dealUneven(deck, ['a', 'b', 'c'])
    const total = Object.values(hands).reduce((sum, h) => sum + h.length, 0)
    expect(total).toBe(52)
  })

  test('every dealt card is unique (no duplicates across hands)', () => {
    const deck = createDeck()
    const { hands } = dealUneven(deck, ['a', 'b', 'c', 'd'])
    const allDealt = Object.values(hands).flat()
    expect(new Set(allDealt).size).toBe(allDealt.length)
  })

  test('distributes the remainder fairly — no seat gets more than one extra card', () => {
    const deck = createDeck() // 52 cards
    const { hands } = dealUneven(deck, ['a', 'b', 'c']) // 52 / 3 = 17 r1
    const sizes = Object.values(hands).map(h => h.length)
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1)
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(52)
  })

  test('divides evenly when it can (52 / 4 = 13 each)', () => {
    const deck = createDeck()
    const { hands } = dealUneven(deck, ['a', 'b', 'c', 'd'])
    for (const h of Object.values(hands)) {
      expect(h.length).toBe(13)
    }
  })

  test('works on a shuffled deck too', () => {
    const deck = shuffleDeck(createDeck(), () => 0.5)
    const { hands } = dealUneven(deck, ['a', 'b', 'c', 'd', 'e'])
    const allDealt = new Set(Object.values(hands).flat())
    expect(allDealt.size).toBe(52)
  })

  test('deals in round-robin order (first seat gets the extra card when remainder is 1)', () => {
    const deck = createDeck() // 52 cards, 3 players -> 18,17,17
    const { hands } = dealUneven(deck, ['a', 'b', 'c'])
    expect(hands.a.length).toBe(18)
    expect(hands.b.length).toBe(17)
    expect(hands.c.length).toBe(17)
  })
})
