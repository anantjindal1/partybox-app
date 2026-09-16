import { buildConfessionOrder, buildGuessMap, scoreConfession, tallyByTarget } from '../detectiveLogic'

describe('buildConfessionOrder', () => {
  it('returns all confession ids exactly once', () => {
    const confessions = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const order = buildConfessionOrder(confessions)
    expect(order.sort()).toEqual(['a', 'b', 'c'])
  })

  it('returns ids only, not the original objects', () => {
    const confessions = [{ id: 'a', text: 'x' }, { id: 'b', text: 'y' }]
    const order = buildConfessionOrder(confessions)
    expect(order.every(id => typeof id === 'string')).toBe(true)
  })
})

describe('buildGuessMap', () => {
  it('maps voter to target from GUESS actions', () => {
    const actions = [
      { type: 'GUESS', playerId: 'p1', payload: { targetPlayerId: 'p2' } },
      { type: 'GUESS', playerId: 'p3', payload: { targetPlayerId: 'p2' } },
    ]
    expect(buildGuessMap(actions)).toEqual({ p1: 'p2', p3: 'p2' })
  })

  it('ignores non-GUESS actions and malformed payloads', () => {
    const actions = [
      { type: 'OTHER', playerId: 'p1', payload: { targetPlayerId: 'p2' } },
      { type: 'GUESS', playerId: 'p1', payload: {} },
    ]
    expect(buildGuessMap(actions)).toEqual({})
  })
})

describe('scoreConfession', () => {
  it('awards correct guessers and counts wrong guesses for the author', () => {
    const guessMap = { p1: 'authorX', p2: 'p1', p3: 'authorX' }
    const { correctGuesserIds, authorPoints } = scoreConfession(guessMap, 'authorX', ['p1', 'p2', 'p3'])
    expect(correctGuesserIds.sort()).toEqual(['p1', 'p3'])
    expect(authorPoints).toBe(1)
  })

  it('handles nobody voting', () => {
    const { correctGuesserIds, authorPoints } = scoreConfession({}, 'authorX', ['p1', 'p2'])
    expect(correctGuesserIds).toEqual([])
    expect(authorPoints).toBe(0)
  })

  it('everyone wrong awards the author full points', () => {
    const guessMap = { p1: 'p2', p3: 'p2' }
    const { correctGuesserIds, authorPoints } = scoreConfession(guessMap, 'authorX', ['p1', 'p3'])
    expect(correctGuesserIds).toEqual([])
    expect(authorPoints).toBe(2)
  })
})

describe('tallyByTarget', () => {
  it('counts guesses per target', () => {
    const guessMap = { p1: 'p2', p3: 'p2', p4: 'p5' }
    expect(tallyByTarget(guessMap)).toEqual({ p2: 2, p5: 1 })
  })
})
