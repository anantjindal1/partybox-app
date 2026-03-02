import {
  computeBaseScore,
  computeSpeedBonus,
  computeRoundScore,
  resolveTieBreak,
} from '../scoring'

describe('computeBaseScore', () => {
  it('returns 10 for correct answer', () => {
    expect(computeBaseScore(true)).toBe(10)
  })
  it('returns 0 for wrong answer', () => {
    expect(computeBaseScore(false)).toBe(0)
  })
})

describe('computeSpeedBonus', () => {
  it('returns 0 for wrong answer regardless of speed', () => {
    expect(computeSpeedBonus(false, 1)).toBe(0)
    expect(computeSpeedBonus(false, 15)).toBe(0)
  })
  it('returns 5 for correct answer ≤5s', () => {
    expect(computeSpeedBonus(true, 0)).toBe(5)
    expect(computeSpeedBonus(true, 5)).toBe(5)
  })
  it('returns 3 for correct answer 6–10s', () => {
    expect(computeSpeedBonus(true, 6)).toBe(3)
    expect(computeSpeedBonus(true, 10)).toBe(3)
  })
  it('returns 1 for correct answer 11–15s', () => {
    expect(computeSpeedBonus(true, 11)).toBe(1)
    expect(computeSpeedBonus(true, 15)).toBe(1)
  })
  it('returns 0 for correct answer >15s', () => {
    expect(computeSpeedBonus(true, 16)).toBe(0)
  })
})

describe('computeRoundScore', () => {
  it('returns 0 for wrong answer', () => {
    expect(computeRoundScore(false, 3)).toBe(0)
  })
  it('returns 15 for correct answer answered in ≤5s', () => {
    expect(computeRoundScore(true, 3)).toBe(15)
  })
  it('returns 13 for correct answer answered in 6–10s', () => {
    expect(computeRoundScore(true, 8)).toBe(13)
  })
  it('returns 11 for correct answer answered in 11–15s', () => {
    expect(computeRoundScore(true, 14)).toBe(11)
  })
  it('returns 10 for correct answer answered after 15s', () => {
    expect(computeRoundScore(true, 16)).toBe(10)
  })
})

describe('resolveTieBreak', () => {
  const players = ['p1', 'p2', 'p3']

  it('sorts by score descending', () => {
    const scores = { p1: 30, p2: 50, p3: 20 }
    const times = { p1: 5, p2: 5, p3: 5 }
    expect(resolveTieBreak(players, scores, times)).toEqual(['p2', 'p1', 'p3'])
  })

  it('breaks ties by faster response time', () => {
    const scores = { p1: 50, p2: 50, p3: 30 }
    const times = { p1: 8, p2: 5, p3: 3 }
    expect(resolveTieBreak(players, scores, times)).toEqual(['p2', 'p1', 'p3'])
  })

  it('handles missing scores (defaults to 0)', () => {
    const scores = { p2: 10 }
    const times = { p2: 5 }
    const result = resolveTieBreak(players, scores, times)
    expect(result[0]).toBe('p2')
  })

  it('handles missing response times (treated as Infinity)', () => {
    const scores = { p1: 50, p2: 50 }
    const times = { p1: 7 } // p2 has no time
    const result = resolveTieBreak(['p1', 'p2'], scores, times)
    expect(result[0]).toBe('p1')
  })

  it('does not mutate the original array', () => {
    const original = ['p1', 'p2', 'p3']
    resolveTieBreak(original, { p3: 100 }, {})
    expect(original).toEqual(['p1', 'p2', 'p3'])
  })
})
