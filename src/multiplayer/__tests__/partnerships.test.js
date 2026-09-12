import { getTeamA, getTeamB, getTeamOf, computeTeamTricks, buildTurnOrderFromPartner } from '../partnerships'

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

describe('buildTurnOrderFromPartner', () => {
  const playerIds = ['host', 'a', 'b', 'c']

  test('puts host and chosen partner at indices 0/2, the rest at 1/3', () => {
    const result = buildTurnOrderFromPartner(playerIds, 'host', 'b')
    expect(result).toEqual(['host', 'a', 'b', 'c'])
    expect(getTeamA(result)).toEqual(['host', 'b'])
    expect(getTeamB(result)).toEqual(['a', 'c'])
  })

  test('preserves the other two players relative order regardless of which partner is picked', () => {
    const result = buildTurnOrderFromPartner(playerIds, 'host', 'c')
    expect(getTeamA(result)).toEqual(['host', 'c'])
    expect(getTeamB(result)).toEqual(['a', 'b'])
  })

  test('falls back to unmodified playerIds when no partner is picked', () => {
    expect(buildTurnOrderFromPartner(playerIds, 'host', null)).toBe(playerIds)
    expect(buildTurnOrderFromPartner(playerIds, 'host', undefined)).toBe(playerIds)
  })

  test('falls back when the chosen partner is not a real player', () => {
    expect(buildTurnOrderFromPartner(playerIds, 'host', 'ghost')).toBe(playerIds)
  })

  test('falls back when host and partner are the same id', () => {
    expect(buildTurnOrderFromPartner(playerIds, 'host', 'host')).toBe(playerIds)
  })

  test('falls back when hostId is not actually in playerIds', () => {
    expect(buildTurnOrderFromPartner(playerIds, 'nobody', 'a')).toBe(playerIds)
  })

  test('falls back for a player count other than 4', () => {
    expect(buildTurnOrderFromPartner(['host', 'a', 'b'], 'host', 'a')).toEqual(['host', 'a', 'b'])
  })
})
