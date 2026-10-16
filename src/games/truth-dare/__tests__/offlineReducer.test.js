import { reducer, getInitialState } from '../offlineReducer'
import { segmentAt } from '../logic'

const start = (names = ['', '', '']) =>
  reducer(getInitialState(), { type: 'START', setting: 'office', spinMode: 'random', names })

test('full turn: spin, choose, skip keeps the type, done returns to idle', () => {
  let s = start()
  s = reducer(s, { type: 'SPIN', rng: () => 0.5 })
  expect(s.step).toBe('spinning')
  expect(segmentAt(s.rotation, 3)).toBe(s.players.findIndex(p => p.id === s.turnId))
  s = reducer(s, { type: 'SPUN' })
  s = reducer(s, { type: 'CHOOSE', choice: 'dare' })
  const first = s.promptId
  s = reducer(s, { type: 'SKIP' })
  expect(s.type).toBe('dare')
  expect(s.promptId).not.toBe(first)
  expect(s.promptId.startsWith('o')).toBe(true)
  s = reducer(s, { type: 'DONE' })
  expect(s.step).toBe('idle')
})

test('players can only change between turns, and never below 2', () => {
  let s = start(['A', 'B'])
  s = reducer(s, { type: 'REMOVE_PLAYER', id: 'p1' })
  expect(s.players).toHaveLength(2)
  s = reducer(s, { type: 'ADD_PLAYER' })
  expect(s.players.map(p => p.id)).toEqual(['p1', 'p2', 'p3'])
  s = reducer(s, { type: 'REMOVE_PLAYER', id: 'p2' })
  s = reducer(s, { type: 'ADD_PLAYER' })
  expect(s.players.map(p => p.num)).toEqual([1, 3, 4])
  s = reducer(s, { type: 'SPIN' })
  expect(reducer(s, { type: 'ADD_PLAYER' })).toBe(s)
})
