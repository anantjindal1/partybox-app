import { removeCardFromHand, addCardsToHand, sortHand, sortHandByRank } from '../hand'

describe('removeCardFromHand', () => {
  test('removes exactly the named card', () => {
    const hand = ['AS', '2H', 'KD']
    expect(removeCardFromHand(hand, '2H')).toEqual(['AS', 'KD'])
  })

  test('does not mutate the input array', () => {
    const hand = ['AS', '2H', 'KD']
    const copy = [...hand]
    removeCardFromHand(hand, '2H')
    expect(hand).toEqual(copy)
  })

  test('returns an equivalent array if the card is not present', () => {
    const hand = ['AS', '2H']
    expect(removeCardFromHand(hand, 'KD')).toEqual(['AS', '2H'])
  })

  test('removes only one instance if duplicates exist (defensive, should not normally happen)', () => {
    const hand = ['AS', 'AS', '2H']
    expect(removeCardFromHand(hand, 'AS')).toEqual(['AS', '2H'])
  })
})

describe('addCardsToHand', () => {
  test('appends the given cards', () => {
    expect(addCardsToHand(['AS'], ['2H', 'KD'])).toEqual(['AS', '2H', 'KD'])
  })

  test('does not mutate either input array', () => {
    const hand = ['AS']
    const toAdd = ['2H']
    addCardsToHand(hand, toAdd)
    expect(hand).toEqual(['AS'])
    expect(toAdd).toEqual(['2H'])
  })
})

describe('sortHand', () => {
  test('groups by suit in a stable order', () => {
    const hand = ['KC', 'AS', '2H', '3D']
    const sorted = sortHand(hand)
    const suits = sorted.map(id => id.slice(-1))
    expect(suits).toEqual(['S', 'H', 'D', 'C'])
  })

  test('orders ranks ascending within a suit, ace-high by default', () => {
    const hand = ['KS', 'AS', '2S', '10S']
    const sorted = sortHand(hand)
    expect(sorted).toEqual(['2S', '10S', 'KS', 'AS'])
  })

  test('ace-low when explicitly requested', () => {
    const hand = ['KS', 'AS', '2S']
    const sorted = sortHand(hand, { aceHigh: false })
    expect(sorted).toEqual(['AS', '2S', 'KS'])
  })

  test('does not mutate the input array', () => {
    const hand = ['KC', 'AS']
    const copy = [...hand]
    sortHand(hand)
    expect(hand).toEqual(copy)
  })
})

describe('sortHandByRank', () => {
  test('groups same-rank cards together, ranks ascending overall', () => {
    const hand = ['7H', '2S', '7C', '2D']
    const sorted = sortHandByRank(hand)
    const ranks = sorted.map(id => id.slice(0, -1))
    expect(ranks).toEqual(['2', '2', '7', '7'])
  })

  test('uses suit as a tie-break within a rank (fixed SUITS order)', () => {
    const hand = ['7C', '7S', '7H', '7D']
    const sorted = sortHandByRank(hand)
    expect(sorted).toEqual(['7S', '7H', '7D', '7C'])
  })

  test('ace-high by default, sorts to the end', () => {
    const hand = ['AS', '2H', 'KD']
    const sorted = sortHandByRank(hand)
    expect(sorted).toEqual(['2H', 'KD', 'AS'])
  })

  test('ace-low when explicitly requested', () => {
    const hand = ['AS', '2H', 'KD']
    const sorted = sortHandByRank(hand, { aceHigh: false })
    expect(sorted).toEqual(['AS', '2H', 'KD'])
  })

  test('does not mutate the input array', () => {
    const hand = ['7C', '2S']
    const copy = [...hand]
    sortHandByRank(hand)
    expect(hand).toEqual(copy)
  })
})
