import { dealUneven } from '../dealUneven'
import { createDeck, shuffleDeck } from '../../../multiplayer/deck'

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
