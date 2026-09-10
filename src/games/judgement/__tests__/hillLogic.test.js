import { computeHandSizeSequence, rotate, getForbiddenBid, determineTrumpChooser } from '../hillLogic'

describe('computeHandSizeSequence', () => {
  test('small maxHandSize: peak appears exactly once', () => {
    const seq = computeHandSizeSequence(5)
    expect(seq).toEqual([1, 2, 3, 4, 5, 4, 3, 2, 1])
    expect(seq.filter(n => n === 5).length).toBe(1)
    expect(seq.length).toBe(2 * 5 - 1)
  })

  test('large maxHandSize (n=3 player count -> 17): correct length and peak count', () => {
    const seq = computeHandSizeSequence(17)
    expect(seq.length).toBe(2 * 17 - 1)
    expect(seq.filter(n => n === 17).length).toBe(1)
    expect(seq[0]).toBe(1)
    expect(seq[seq.length - 1]).toBe(1)
    expect(Math.max(...seq)).toBe(17)
  })

  test('maxHandSize of 1: a single-round hill', () => {
    expect(computeHandSizeSequence(1)).toEqual([1])
  })
})

describe('rotate', () => {
  test('rotates an array to start at the given index', () => {
    expect(rotate(['a', 'b', 'c', 'd'], 2)).toEqual(['c', 'd', 'a', 'b'])
  })

  test('startIdx 0 is a no-op', () => {
    expect(rotate(['a', 'b', 'c'], 0)).toEqual(['a', 'b', 'c'])
  })
})

describe('getForbiddenBid', () => {
  test('returns the value that would make bids sum to the hand size', () => {
    expect(getForbiddenBid(5, { a: 2, b: 1 })).toBe(2)
  })

  test('returns null when the forbidden value is out of the legal 0..handSize range', () => {
    expect(getForbiddenBid(3, { a: 3, b: 3 })).toBeNull()
  })

  test('hand size 1: forbidden value is whichever of {0,1} completes the sum', () => {
    expect(getForbiddenBid(1, { a: 1 })).toBe(0)
    expect(getForbiddenBid(1, { a: 0 })).toBe(1)
  })

  test('no bids so far: forbidden value equals the hand size itself', () => {
    expect(getForbiddenBid(4, {})).toBe(4)
  })
})

describe('determineTrumpChooser', () => {
  test('picks the single highest bidder', () => {
    const bidOrder = ['a', 'b', 'c']
    const bids = { a: 2, b: 5, c: 1 }
    expect(determineTrumpChooser(bidOrder, bids)).toBe('b')
  })

  test('tie resolved by earliest position in bidOrder', () => {
    const bidOrder = ['b', 'c', 'a']
    const bids = { a: 5, b: 5, c: 2 }
    expect(determineTrumpChooser(bidOrder, bids)).toBe('b')
  })

  test('tie-break correctly follows a different leaderIdx rotation', () => {
    const bidOrder = ['a', 'b', 'c']
    const bids = { a: 5, b: 5, c: 2 }
    expect(determineTrumpChooser(bidOrder, bids)).toBe('a')
  })
})
