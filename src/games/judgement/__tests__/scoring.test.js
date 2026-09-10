import { computeRoundScore, computeRoundResults, addToCumulative } from '../scoring'

describe('computeRoundScore', () => {
  test('bid 0, exact (won 0) -> +10', () => {
    expect(computeRoundScore(0, 0)).toBe(10)
  })

  test('bid 0, missed (won 1) -> -10', () => {
    expect(computeRoundScore(0, 1)).toBe(-10)
  })

  test('bid 1, exact -> +10', () => {
    expect(computeRoundScore(1, 1)).toBe(10)
  })

  test('bid 1, missed (won 0) -> -10', () => {
    expect(computeRoundScore(1, 0)).toBe(-10)
  })

  test('bid 2, exact -> +20', () => {
    expect(computeRoundScore(2, 2)).toBe(20)
  })

  test('bid 2, overtrick miss (won 3) -> -20', () => {
    expect(computeRoundScore(2, 3)).toBe(-20)
  })

  test('bid 2, undertrick miss (won 1) -> -20', () => {
    expect(computeRoundScore(2, 1)).toBe(-20)
  })

  test('mid bid 5, exact -> +50', () => {
    expect(computeRoundScore(5, 5)).toBe(50)
  })

  test('max bid 17 (n=3 peak), exact -> +170', () => {
    expect(computeRoundScore(17, 17)).toBe(170)
  })
})

describe('computeRoundResults', () => {
  test('computes each player independently from mixed outcomes', () => {
    const playerIds = ['a', 'b', 'c']
    const bids = { a: 2, b: 0, c: 3 }
    const tricksWon = { a: 2, b: 1, c: 1 }
    expect(computeRoundResults(playerIds, bids, tricksWon)).toEqual({
      a: 20,
      b: -10,
      c: -30
    })
  })
})

describe('addToCumulative', () => {
  test('accumulates positive and negative deltas across rounds', () => {
    let cumulative = { a: 0, b: 0 }
    cumulative = addToCumulative(cumulative, { a: 10, b: -10 })
    expect(cumulative).toEqual({ a: 10, b: -10 })
    cumulative = addToCumulative(cumulative, { a: -20, b: 30 })
    expect(cumulative).toEqual({ a: -10, b: 20 })
  })

  test('does not mutate the input object', () => {
    const original = { a: 5 }
    const next = addToCumulative(original, { a: 5 })
    expect(original.a).toBe(5)
    expect(next.a).toBe(10)
  })
})
