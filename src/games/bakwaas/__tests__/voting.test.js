import { tallyVotes, resolveWinners, buildAnswerList } from '../voting'

describe('tallyVotes', () => {
  it('groups VOTE actions by targetPlayerId', () => {
    const actions = [
      { type: 'VOTE', payload: { targetPlayerId: 'p1' } },
      { type: 'VOTE', payload: { targetPlayerId: 'p1' } },
      { type: 'VOTE', payload: { targetPlayerId: 'p2' } },
    ]
    expect(tallyVotes(actions)).toEqual({ p1: 2, p2: 1 })
  })

  it('ignores non-VOTE actions', () => {
    const actions = [
      { type: 'ANSWER', payload: { text: 'hi' } },
      { type: 'VOTE', payload: { targetPlayerId: 'p1' } },
    ]
    expect(tallyVotes(actions)).toEqual({ p1: 1 })
  })

  it('ignores votes with no target', () => {
    const actions = [{ type: 'VOTE', payload: {} }]
    expect(tallyVotes(actions)).toEqual({})
  })

  it('returns {} for empty/undefined input', () => {
    expect(tallyVotes([])).toEqual({})
    expect(tallyVotes(undefined)).toEqual({})
  })
})

describe('resolveWinners', () => {
  it('returns the single highest-vote id', () => {
    expect(resolveWinners({ p1: 3, p2: 1 })).toEqual(['p1'])
  })

  it('returns co-winners on a tie', () => {
    const winners = resolveWinners({ p1: 2, p2: 2, p3: 1 })
    expect(winners.sort()).toEqual(['p1', 'p2'])
  })

  it('returns [] when nobody voted', () => {
    expect(resolveWinners({})).toEqual([])
  })
})

describe('buildAnswerList', () => {
  it('drops non-ANSWER actions', () => {
    const actions = [
      { type: 'VOTE', playerId: 'p1', payload: { targetPlayerId: 'p2' } },
      { type: 'ANSWER', playerId: 'p2', payload: { text: 'a joke' } },
    ]
    const list = buildAnswerList(actions, () => 0)
    expect(list).toEqual([{ authorId: 'p2', text: 'a joke' }])
  })

  it('drops empty/whitespace-only text', () => {
    const actions = [
      { type: 'ANSWER', playerId: 'p1', payload: { text: '   ' } },
      { type: 'ANSWER', playerId: 'p2', payload: { text: 'real answer' } },
    ]
    const list = buildAnswerList(actions, () => 0)
    expect(list).toEqual([{ authorId: 'p2', text: 'real answer' }])
  })

  it('maps playerId to authorId and trims text', () => {
    const actions = [{ type: 'ANSWER', playerId: 'p1', payload: { text: '  hello  ' } }]
    const list = buildAnswerList(actions, () => 0)
    expect(list).toEqual([{ authorId: 'p1', text: 'hello' }])
  })

  it('returns [] for no actions', () => {
    expect(buildAnswerList([])).toEqual([])
    expect(buildAnswerList(undefined)).toEqual([])
  })

  it('is deterministic under an injected rng and actually reorders', () => {
    const actions = [
      { type: 'ANSWER', playerId: 'p1', payload: { text: 'a' } },
      { type: 'ANSWER', playerId: 'p2', payload: { text: 'b' } },
      { type: 'ANSWER', playerId: 'p3', payload: { text: 'c' } },
    ]
    // rng() => 0 forces every Fisher-Yates swap to index 0, producing a
    // known, non-identity permutation of the 3-element input.
    const shuffled = buildAnswerList(actions, () => 0)
    expect(shuffled.map((a) => a.authorId)).toEqual(['p2', 'p3', 'p1'])
    expect(shuffled.map((a) => a.authorId)).not.toEqual(['p1', 'p2', 'p3'])

    const again = buildAnswerList(actions, () => 0)
    expect(again).toEqual(shuffled)
  })
})
