import { pickLawyers, tallyVotes, resolveWinners } from '../adaalatLogic'

describe('pickLawyers', () => {
  it('picks exactly 2 distinct players', () => {
    const { lawyerIds } = pickLawyers(['a', 'b', 'c', 'd'], [], () => 0.5)
    expect(lawyerIds).toHaveLength(2)
    expect(new Set(lawyerIds).size).toBe(2)
  })

  it('prefers players who have not argued yet this cycle', () => {
    const { lawyerIds } = pickLawyers(['a', 'b', 'c', 'd'], ['a', 'b'], () => 0.5)
    expect(lawyerIds).toEqual(expect.arrayContaining(['c', 'd']))
  })

  it('resets the cycle once fewer than 2 eligible players remain', () => {
    const { lawyerIds, nextArguedIds } = pickLawyers(['a', 'b', 'c', 'd'], ['a', 'b', 'c'], () => 0.5)
    expect(lawyerIds).toHaveLength(2)
    // Cycle reset — nextArguedIds should be exactly this round's pair, not
    // the stale 3-player list plus more.
    expect(nextArguedIds).toHaveLength(2)
  })

  it('accumulates arguedIds across a cycle that has not reset yet', () => {
    const { nextArguedIds } = pickLawyers(['a', 'b', 'c', 'd', 'e'], ['a'], () => 0.5)
    expect(nextArguedIds).toHaveLength(3)
    expect(nextArguedIds).toContain('a')
  })
})

describe('tallyVotes', () => {
  it('counts votes per target', () => {
    const tally = tallyVotes([
      { type: 'VOTE', payload: { targetPlayerId: 'a' } },
      { type: 'VOTE', payload: { targetPlayerId: 'a' } },
      { type: 'VOTE', payload: { targetPlayerId: 'b' } }
    ])
    expect(tally).toEqual({ a: 2, b: 1 })
  })

  it('ignores non-VOTE actions', () => {
    const tally = tallyVotes([{ type: 'OTHER', payload: {} }])
    expect(tally).toEqual({})
  })
})

describe('resolveWinners', () => {
  it('returns the single highest-voted lawyer', () => {
    expect(resolveWinners({ a: 3, b: 1 }, ['a', 'b'])).toEqual(['a'])
  })

  it('splits the win on an exact tie', () => {
    expect(resolveWinners({ a: 2, b: 2 }, ['a', 'b'])).toEqual(['a', 'b'])
  })

  it('returns no winner when nobody voted', () => {
    expect(resolveWinners({}, ['a', 'b'])).toEqual([])
  })
})
