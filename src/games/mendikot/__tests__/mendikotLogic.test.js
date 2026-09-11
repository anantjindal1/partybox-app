import { countTensInTrick, computeMendikotOutcome } from '../mendikotLogic'

describe('countTensInTrick', () => {
  test('zero tens in a trick with none', () => {
    expect(countTensInTrick(['AS', 'KH', '3D', '9C'])).toBe(0)
  })

  test('one ten in a trick', () => {
    expect(countTensInTrick(['AS', '10H', '3D', '9C'])).toBe(1)
  })

  test('two tens in a trick', () => {
    expect(countTensInTrick(['10S', '10H', '3D', '9C'])).toBe(2)
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

  test('a 2-2 split is broken by trick count, team A ahead on tricks', () => {
    expect(computeMendikotOutcome({ teamA: 7, teamB: 6 }, { teamA: 2, teamB: 2 })).toEqual({
      winningTeam: 'teamA',
      isMendikot: false
    })
  })

  test('a 2-2 split is broken by trick count, team B ahead on tricks', () => {
    expect(computeMendikotOutcome({ teamA: 6, teamB: 7 }, { teamA: 2, teamB: 2 })).toEqual({
      winningTeam: 'teamB',
      isMendikot: false
    })
  })
})
