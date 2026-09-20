import { countTensInHand, computeMendikotOutcome, isOutcomeDecided } from '../mendikotLogic'

describe('countTensInHand', () => {
  test('zero tens in a hand with none', () => {
    expect(countTensInHand(['AS', 'KH', '3D', '9C'])).toBe(0)
  })

  test('one ten in a hand', () => {
    expect(countTensInHand(['AS', '10H', '3D', '9C'])).toBe(1)
  })

  test('two tens in a hand', () => {
    expect(countTensInHand(['10S', '10H', '3D', '9C'])).toBe(2)
  })
})

describe('computeMendikotOutcome', () => {
  test('a clean 4-0 sweep is a Mendikot for team A', () => {
    expect(computeMendikotOutcome({ teamA: 9, teamB: 4 }, { teamA: 4, teamB: 0 })).toEqual({
      winningTeam: 'teamA',
      isMendikot: true
    })
  })

  test('a clean 4-0 sweep is a Mendikot for team B', () => {
    expect(computeMendikotOutcome({ teamA: 3, teamB: 10 }, { teamA: 0, teamB: 4 })).toEqual({
      winningTeam: 'teamB',
      isMendikot: true
    })
  })

  test('a 3-1 split wins for the team with more tens, no Mendikot, team A', () => {
    expect(computeMendikotOutcome({ teamA: 5, teamB: 8 }, { teamA: 3, teamB: 1 })).toEqual({
      winningTeam: 'teamA',
      isMendikot: false
    })
  })

  test('a 3-1 split wins for the team with more tens, no Mendikot, team B', () => {
    expect(computeMendikotOutcome({ teamA: 8, teamB: 5 }, { teamA: 1, teamB: 3 })).toEqual({
      winningTeam: 'teamB',
      isMendikot: false
    })
  })

  test('a 2-2 split is broken by hand count, team A ahead on hands', () => {
    expect(computeMendikotOutcome({ teamA: 7, teamB: 6 }, { teamA: 2, teamB: 2 })).toEqual({
      winningTeam: 'teamA',
      isMendikot: false
    })
  })

  test('a 2-2 split is broken by hand count, team B ahead on hands', () => {
    expect(computeMendikotOutcome({ teamA: 6, teamB: 7 }, { teamA: 2, teamB: 2 })).toEqual({
      winningTeam: 'teamB',
      isMendikot: false
    })
  })
})

describe('isOutcomeDecided', () => {
  it('is decided once a team has all four 10s', () => {
    expect(isOutcomeDecided({ teamA: 3, teamB: 0 }, { teamA: 4, teamB: 0 })).toBe(true)
  })

  it('is decided at a 3-1 split, before all 13 hands are played', () => {
    expect(isOutcomeDecided({ teamA: 4, teamB: 3 }, { teamA: 3, teamB: 1 })).toBe(true)
  })

  it('is NOT decided at 3-0 — the fourth 10 could still make it a Mendikot', () => {
    expect(isOutcomeDecided({ teamA: 6, teamB: 2 }, { teamA: 3, teamB: 0 })).toBe(false)
  })

  it('is not decided while 10s are still out', () => {
    expect(isOutcomeDecided({ teamA: 1, teamB: 1 }, { teamA: 1, teamB: 1 })).toBe(false)
  })

  it('is not decided at 2-2 until a team holds 7 hands', () => {
    expect(isOutcomeDecided({ teamA: 6, teamB: 3 }, { teamA: 2, teamB: 2 })).toBe(false)
  })

  it('is decided at 2-2 once a team holds 7 hands', () => {
    expect(isOutcomeDecided({ teamA: 7, teamB: 3 }, { teamA: 2, teamB: 2 })).toBe(true)
  })
})
