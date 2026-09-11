import { getTeamA, getTeamB, getTeamOf, computeTeamTricks } from '../partnerships'

const turnOrder = ['p0', 'p1', 'p2', 'p3']

describe('getTeamA / getTeamB / getTeamOf', () => {
  test('team A is seats 0 and 2, team B is seats 1 and 3', () => {
    expect(getTeamA(turnOrder)).toEqual(['p0', 'p2'])
    expect(getTeamB(turnOrder)).toEqual(['p1', 'p3'])
  })

  test('getTeamOf resolves every seat correctly', () => {
    expect(getTeamOf('p0', turnOrder)).toBe('teamA')
    expect(getTeamOf('p2', turnOrder)).toBe('teamA')
    expect(getTeamOf('p1', turnOrder)).toBe('teamB')
    expect(getTeamOf('p3', turnOrder)).toBe('teamB')
  })
})

describe('computeTeamTricks', () => {
  test('sums each partner pair independently', () => {
    const tricksWon = { p0: 5, p1: 2, p2: 3, p3: 3 }
    expect(computeTeamTricks(turnOrder, tricksWon)).toEqual({ teamA: 8, teamB: 5 })
  })

  test('missing players default to zero', () => {
    const tricksWon = { p0: 4 }
    expect(computeTeamTricks(turnOrder, tricksWon)).toEqual({ teamA: 4, teamB: 0 })
  })
})
