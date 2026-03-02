import { resolveSpeedRound } from '../speedLockResolver'

function makeAction(playerId, seconds, valid = true) {
  return { playerId, createdAt: { seconds }, _valid: valid }
}

const alwaysValid = () => true
const byFlag = (a) => a._valid === true

describe('resolveSpeedRound', () => {
  test('first valid action wins', () => {
    const actions = [
      makeAction('p2', 10),
      makeAction('p1', 5),
      makeAction('p3', 15),
    ]
    const result = resolveSpeedRound(actions, alwaysValid)
    expect(result.winnerId).toBe('p1')
    expect(result.resolvedAt).toEqual({ seconds: 5 })
    expect(result.lateActions).toHaveLength(2)
    expect(result.invalidActions).toHaveLength(0)
  })

  test('all invalid returns null winner', () => {
    const actions = [
      makeAction('p1', 1, false),
      makeAction('p2', 2, false),
    ]
    const result = resolveSpeedRound(actions, byFlag)
    expect(result.winnerId).toBeNull()
    expect(result.resolvedAt).toBeNull()
    expect(result.invalidActions).toHaveLength(2)
    expect(result.lateActions).toHaveLength(0)
  })

  test('sorts correctly by createdAt.seconds ascending', () => {
    const actions = [
      makeAction('late', 100),
      makeAction('first', 1),
      makeAction('mid', 50),
    ]
    const result = resolveSpeedRound(actions, alwaysValid)
    expect(result.winnerId).toBe('first')
    expect(result.lateActions.map(a => a.playerId)).toEqual(['mid', 'late'])
  })

  test('validateFn rejects specific actions', () => {
    const actions = [
      makeAction('p1', 1, false),
      makeAction('p2', 2, true),
      makeAction('p3', 3, false),
    ]
    const result = resolveSpeedRound(actions, byFlag)
    expect(result.winnerId).toBe('p2')
    expect(result.invalidActions).toHaveLength(2)
    expect(result.lateActions).toHaveLength(0)
  })

  test('empty actions returns null winner', () => {
    const result = resolveSpeedRound([], alwaysValid)
    expect(result.winnerId).toBeNull()
    expect(result.lateActions).toHaveLength(0)
    expect(result.invalidActions).toHaveLength(0)
  })

  test('missing createdAt defaults to 0 for sort', () => {
    const actions = [
      { playerId: 'noTs', _valid: true },
      makeAction('withTs', 1),
    ]
    const result = resolveSpeedRound(actions, byFlag)
    // noTs has seconds=undefined → 0, wins over withTs seconds=1
    expect(result.winnerId).toBe('noTs')
  })

  test('does not mutate original actions array', () => {
    const actions = [makeAction('p1', 5), makeAction('p2', 1)]
    const original = [...actions]
    resolveSpeedRound(actions, alwaysValid)
    expect(actions).toEqual(original)
  })
})
