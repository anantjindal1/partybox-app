import { computeRoundScore, computeRoundResults, addToCumulative } from '../scoring'

describe('computeRoundScore', () => {
  test('overtrick: bid 5, won 7 -> 5.2', () => {
    expect(computeRoundScore(5, 7)).toBeCloseTo(5.2)
  })

  test('exact: bid 5, won 5 -> 5', () => {
    expect(computeRoundScore(5, 5)).toBe(5)
  })

  test('failed: bid 5, won 3 -> -5', () => {
    expect(computeRoundScore(5, 3)).toBe(-5)
  })

  test('min bid swept: bid 1, won 13 -> 2.2', () => {
    expect(computeRoundScore(1, 13)).toBeCloseTo(2.2)
  })

  test('max bid exact: bid 13, won 13 -> 13', () => {
    expect(computeRoundScore(13, 13)).toBe(13)
  })

  test('max bid failed: bid 13, won 1 -> -13', () => {
    expect(computeRoundScore(13, 1)).toBe(-13)
  })

  test('zero tricks vs bid 1 -> -1', () => {
    expect(computeRoundScore(1, 0)).toBe(-1)
  })
})

describe('computeRoundResults', () => {
  test('computes a result for every player independently', () => {
    const playerIds = ['a', 'b', 'c', 'd']
    const bids = { a: 5, b: 3, c: 13, d: 1 }
    const tricksWon = { a: 7, b: 3, c: 1, d: 2 }
    expect(computeRoundResults(playerIds, bids, tricksWon)).toEqual({
      a: 5.2,
      b: 3,
      c: -13,
      d: 1.1
    })
  })

  test('sums to a value consistent with 13 total tricks distributed', () => {
    const playerIds = ['a', 'b', 'c', 'd']
    const bids = { a: 3, b: 3, c: 3, d: 4 }
    const tricksWon = { a: 3, b: 3, c: 3, d: 4 }
    const results = computeRoundResults(playerIds, bids, tricksWon)
    expect(Object.values(results)).toEqual([3, 3, 3, 4])
  })
})

describe('addToCumulative', () => {
  test('accumulates across multiple rounds, including negative and fractional deltas', () => {
    let cumulative = { a: 0, b: 0 }
    cumulative = addToCumulative(cumulative, { a: 5.2, b: -3 })
    expect(cumulative).toEqual({ a: 5.2, b: -3 })
    cumulative = addToCumulative(cumulative, { a: -5, b: 2.1 })
    expect(cumulative.a).toBeCloseTo(0.2)
    expect(cumulative.b).toBeCloseTo(-0.9)
  })

  test('does not mutate the original object', () => {
    const original = { a: 1 }
    const next = addToCumulative(original, { a: 1 })
    expect(original.a).toBe(1)
    expect(next.a).toBe(2)
  })
})
