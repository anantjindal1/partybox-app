import { dealCards, dealEven, dealAll } from '../deal'
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

describe('dealEven', () => {
  test('deals the same number of cards to every player', () => {
    const deck = createDeck()
    const { hands } = dealEven(deck, ['a', 'b', 'c'])
    for (const h of Object.values(hands)) {
      expect(h.length).toBe(17)
    }
  })

  test('leaves the remainder undealt rather than distributing it unevenly', () => {
    const deck = createDeck() // 52 cards, 3 players -> floor(52/3) = 17 each, 1 leftover
    const { hands, remaining } = dealEven(deck, ['a', 'b', 'c'])
    const total = Object.values(hands).reduce((sum, h) => sum + h.length, 0)
    expect(total).toBe(51)
    expect(remaining.length).toBe(1)
  })

  test('every dealt card is unique (no duplicates across hands)', () => {
    const deck = createDeck()
    const { hands } = dealEven(deck, ['a', 'b', 'c', 'd'])
    const allDealt = Object.values(hands).flat()
    expect(new Set(allDealt).size).toBe(allDealt.length)
  })

  test('divides evenly when it can, with nothing left over (52 / 4 = 13 each)', () => {
    const deck = createDeck()
    const { hands, remaining } = dealEven(deck, ['a', 'b', 'c', 'd'])
    for (const h of Object.values(hands)) {
      expect(h.length).toBe(13)
    }
    expect(remaining.length).toBe(0)
  })

  test('works on a shuffled deck too', () => {
    const deck = shuffleDeck(createDeck(), () => 0.5)
    const { hands } = dealEven(deck, ['a', 'b', 'c', 'd', 'e'])
    for (const h of Object.values(hands)) {
      expect(h.length).toBe(10)
    }
  })
})

describe('dealAll', () => {
  test('deals every card in the deck, none left over', () => {
    const deck = createDeck()
    const { hands } = dealAll(deck, ['a', 'b', 'c', 'd'])
    const allDealt = Object.values(hands).flat()
    expect(allDealt.length).toBe(52)
    expect(new Set(allDealt).size).toBe(52)
  })

  test('divides evenly when it can (52 / 4 = 13 each)', () => {
    const deck = createDeck()
    const { hands } = dealAll(deck, ['a', 'b', 'c', 'd'])
    for (const h of Object.values(hands)) {
      expect(h.length).toBe(13)
    }
  })

  test('hand sizes differ by at most 1 when it does not divide evenly', () => {
    const deck = createDeck() // 52 / 5 = 10.4
    const { hands } = dealAll(deck, ['a', 'b', 'c', 'd', 'e'])
    const sizes = Object.values(hands).map(h => h.length)
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1)
    expect(sizes.reduce((sum, n) => sum + n, 0)).toBe(52)
  })

  test('the first (deck.length % playerIds.length) players in order get the extra card', () => {
    const deck = createDeck() // 52 / 5 -> 2 extra cards, players a and b get 11, rest get 10
    const { hands } = dealAll(deck, ['a', 'b', 'c', 'd', 'e'])
    expect(hands.a.length).toBe(11)
    expect(hands.b.length).toBe(11)
    expect(hands.c.length).toBe(10)
    expect(hands.d.length).toBe(10)
    expect(hands.e.length).toBe(10)
  })

  test('deals round-robin in order from the front of the deck', () => {
    const deck = createDeck()
    const { hands } = dealAll(deck, ['a', 'b'])
    expect(hands.a[0]).toBe(deck[0])
    expect(hands.b[0]).toBe(deck[1])
    expect(hands.a[1]).toBe(deck[2])
    expect(hands.b[1]).toBe(deck[3])
  })
})
