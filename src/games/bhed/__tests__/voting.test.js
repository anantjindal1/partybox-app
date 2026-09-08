import { tallyVotes, resolveWinners } from '../voting'

describe('tallyVotes', () => {
  test('counts votes grouped by target', () => {
    const actions = [
      { type: 'VOTE', payload: { targetPlayerId: 'a' } },
      { type: 'VOTE', payload: { targetPlayerId: 'a' } },
      { type: 'VOTE', payload: { targetPlayerId: 'b' } }
    ]
    expect(tallyVotes(actions)).toEqual({ a: 2, b: 1 })
  })

  test('ignores non-VOTE actions', () => {
    const actions = [
      { type: 'ACK', payload: {} },
      { type: 'VOTE', payload: { targetPlayerId: 'a' } }
    ]
    expect(tallyVotes(actions)).toEqual({ a: 1 })
  })

  test('empty for no actions', () => {
    expect(tallyVotes([])).toEqual({})
    expect(tallyVotes(undefined)).toEqual({})
  })

  test('ignores a VOTE action missing a target', () => {
    const actions = [{ type: 'VOTE', payload: {} }]
    expect(tallyVotes(actions)).toEqual({})
  })
})

describe('resolveWinners', () => {
  test('returns the single highest-voted id', () => {
    expect(resolveWinners({ a: 3, b: 1 })).toEqual(['a'])
  })

  test('returns all tied leaders', () => {
    const result = resolveWinners({ a: 2, b: 2, c: 1 })
    expect(result.sort()).toEqual(['a', 'b'])
  })

  test('empty array when nobody voted', () => {
    expect(resolveWinners({})).toEqual([])
  })
})
