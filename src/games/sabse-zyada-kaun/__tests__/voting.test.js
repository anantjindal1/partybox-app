import { tallyVotes, resolveWinners } from '../voting'

describe('tallyVotes', () => {
  it('counts votes grouped by target', () => {
    const actions = [
      { type: 'VOTE', payload: { targetPlayerId: 'p1' } },
      { type: 'VOTE', payload: { targetPlayerId: 'p2' } },
      { type: 'VOTE', payload: { targetPlayerId: 'p1' } },
    ]
    expect(tallyVotes(actions)).toEqual({ p1: 2, p2: 1 })
  })

  it('counts a self-vote the same as any other vote', () => {
    const actions = [
      { type: 'VOTE', payload: { targetPlayerId: 'p1' }, playerId: 'p1' },
      { type: 'VOTE', payload: { targetPlayerId: 'p1' }, playerId: 'p2' },
    ]
    expect(tallyVotes(actions)).toEqual({ p1: 2 })
  })

  it('ignores non-VOTE actions', () => {
    const actions = [
      { type: 'REMATCH_VOTE', payload: {} },
      { type: 'VOTE', payload: { targetPlayerId: 'p1' } },
    ]
    expect(tallyVotes(actions)).toEqual({ p1: 1 })
  })

  it('returns an empty object for no actions', () => {
    expect(tallyVotes([])).toEqual({})
    expect(tallyVotes(undefined)).toEqual({})
  })

  it('ignores a VOTE action missing a target', () => {
    const actions = [{ type: 'VOTE', payload: {} }]
    expect(tallyVotes(actions)).toEqual({})
  })
})

describe('resolveWinners', () => {
  it('returns the single player with the most votes', () => {
    expect(resolveWinners({ p1: 3, p2: 1 })).toEqual(['p1'])
  })

  it('returns all players on a tie (co-winners)', () => {
    const winners = resolveWinners({ p1: 2, p2: 2, p3: 1 })
    expect(winners.sort()).toEqual(['p1', 'p2'])
  })

  it('returns an empty array when nobody voted', () => {
    expect(resolveWinners({})).toEqual([])
  })
})
