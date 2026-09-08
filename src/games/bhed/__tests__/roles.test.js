import { assignBhed } from '../roles'

function seededRng(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

describe('assignBhed', () => {
  test('returns null for fewer than 4 players', () => {
    expect(assignBhed([], seededRng(1))).toBe(null)
    expect(assignBhed(['a', 'b', 'c'], seededRng(1))).toBe(null)
  })

  test('returns one of the given player ids for 4+ players', () => {
    const players = ['a', 'b', 'c', 'd', 'e']
    const bhed = assignBhed(players, seededRng(1))
    expect(players).toContain(bhed)
  })

  test('is deterministic given the same rng sequence', () => {
    const players = ['a', 'b', 'c', 'd', 'e', 'f']
    const a = assignBhed(players, seededRng(42))
    const b = assignBhed(players, seededRng(42))
    expect(a).toBe(b)
  })

  test('does not mutate the input array', () => {
    const players = ['a', 'b', 'c', 'd']
    const copy = [...players]
    assignBhed(players, seededRng(7))
    expect(players).toEqual(copy)
  })

  test('over many seeds, every player can end up as the Bhed', () => {
    const players = ['a', 'b', 'c', 'd']
    const seen = new Set()
    for (let seed = 1; seed <= 200; seed++) {
      seen.add(assignBhed(players, seededRng(seed)))
    }
    expect(seen.size).toBe(4)
  })
})
