import {
  getTeamA,
  getTeamB,
  getTeamOf,
  computeTeamTricks,
  computeHandOutcome,
  checkMatchWinner
} from '../courtPieceLogic'

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
})

describe('computeHandOutcome', () => {
  test('normal split (8-5): team A wins, no kot, 1 point', () => {
    expect(computeHandOutcome({ teamA: 8, teamB: 5 })).toEqual({
      winningTeam: 'teamA',
      isKot: false,
      pointsAwarded: 1
    })
  })

  test('close split (7-6): team A wins, no kot, 1 point', () => {
    expect(computeHandOutcome({ teamA: 7, teamB: 6 })).toEqual({
      winningTeam: 'teamA',
      isKot: false,
      pointsAwarded: 1
    })
  })

  test('kot for team A (13-0)', () => {
    expect(computeHandOutcome({ teamA: 13, teamB: 0 })).toEqual({
      winningTeam: 'teamA',
      isKot: true,
      pointsAwarded: 2
    })
  })

  test('kot for team B (0-13)', () => {
    expect(computeHandOutcome({ teamA: 0, teamB: 13 })).toEqual({
      winningTeam: 'teamB',
      isKot: true,
      pointsAwarded: 2
    })
  })

  test('never returns a fractional or negative pointsAwarded', () => {
    const outcomes = [
      computeHandOutcome({ teamA: 7, teamB: 6 }),
      computeHandOutcome({ teamA: 13, teamB: 0 })
    ]
    for (const o of outcomes) {
      expect(Number.isInteger(o.pointsAwarded)).toBe(true)
      expect(o.pointsAwarded).toBeGreaterThan(0)
    }
  })
})

describe('checkMatchWinner', () => {
  test('below target entirely: no winner yet', () => {
    expect(checkMatchWinner({ teamA: 6, teamB: 5 }, { teamA: 3, teamB: 2 })).toBeNull()
  })

  test('normal win: leader at target, trailer already has hand wins', () => {
    expect(checkMatchWinner({ teamA: 7, teamB: 3 }, { teamA: 4, teamB: 2 })).toBe('teamA')
  })

  test('shutout in progress: leader at target, trailer has zero hand wins -> no winner yet', () => {
    expect(checkMatchWinner({ teamA: 7, teamB: 0 }, { teamA: 4, teamB: 0 })).toBeNull()
  })

  test('shutout resolved by extension: leader reaches 13 with trailer still at zero', () => {
    expect(checkMatchWinner({ teamA: 13, teamB: 0 }, { teamA: 7, teamB: 0 })).toBe('teamA')
  })

  test('shutout resolved by trailer winning their first hand: original leader still wins', () => {
    expect(checkMatchWinner({ teamA: 8, teamB: 1 }, { teamA: 5, teamB: 1 })).toBe('teamA')
  })

  test('symmetric case for team B', () => {
    expect(checkMatchWinner({ teamA: 0, teamB: 7 }, { teamA: 0, teamB: 4 })).toBeNull()
    expect(checkMatchWinner({ teamA: 1, teamB: 8 }, { teamA: 1, teamB: 5 })).toBe('teamB')
  })
})
