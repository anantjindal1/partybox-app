import {
  createTurnState,
  getCurrentPlayer,
  advanceTurn,
  removePlayer,
  isRoundComplete
} from '../turnManager'

describe('createTurnState', () => {
  test('accepts plain string IDs', () => {
    const state = createTurnState(['p1', 'p2', 'p3'])
    expect(state.playerIds).toEqual(['p1', 'p2', 'p3'])
    expect(state.currentIdx).toBe(0)
    expect(state.round).toBe(1)
  })

  test('accepts player objects with id field', () => {
    const state = createTurnState([{ id: 'a' }, { id: 'b' }])
    expect(state.playerIds).toEqual(['a', 'b'])
  })

  test('empty players list', () => {
    const state = createTurnState([])
    expect(state.playerIds).toEqual([])
    expect(state.currentIdx).toBe(0)
    expect(state.round).toBe(1)
  })
})

describe('getCurrentPlayer', () => {
  test('returns the player at currentIdx', () => {
    const state = createTurnState(['p1', 'p2'])
    expect(getCurrentPlayer(state)).toEqual({ id: 'p1' })
  })

  test('returns null for empty players', () => {
    const state = createTurnState([])
    expect(getCurrentPlayer(state)).toBeNull()
  })
})

describe('advanceTurn', () => {
  test('advances index to next player', () => {
    let state = createTurnState(['p1', 'p2', 'p3'])
    state = advanceTurn(state)
    expect(state.currentIdx).toBe(1)
    expect(state.round).toBe(1)
    expect(getCurrentPlayer(state)).toEqual({ id: 'p2' })
  })

  test('wraps around and increments round', () => {
    let state = createTurnState(['p1', 'p2'])
    state = advanceTurn(state) // idx 1
    state = advanceTurn(state) // idx 0, round 2
    expect(state.currentIdx).toBe(0)
    expect(state.round).toBe(2)
  })

  test('returns unchanged state for empty players', () => {
    const state = createTurnState([])
    const next = advanceTurn(state)
    expect(next).toEqual(state)
  })
})

describe('removePlayer', () => {
  test('removes player by ID', () => {
    const state = createTurnState(['p1', 'p2', 'p3'])
    const next = removePlayer(state, 'p2')
    expect(next.playerIds).toEqual(['p1', 'p3'])
  })

  test('clamps currentIdx if it goes out of bounds after removal', () => {
    let state = createTurnState(['p1', 'p2', 'p3'])
    state = advanceTurn(state) // idx = 1, on p2
    state = advanceTurn(state) // idx = 2, on p3
    // Remove p3 (idx 2); playerIds becomes ['p1','p2'], length 2 — clamp to 0
    const next = removePlayer(state, 'p3')
    expect(next.playerIds).toEqual(['p1', 'p2'])
    expect(next.currentIdx).toBe(0)
  })

  test('returns empty state when last player removed', () => {
    const state = createTurnState(['solo'])
    const next = removePlayer(state, 'solo')
    expect(next.playerIds).toEqual([])
    expect(next.currentIdx).toBe(0)
  })

  test('preserves round when removing player', () => {
    let state = createTurnState(['p1', 'p2'])
    state = advanceTurn(state) // round still 1
    state = advanceTurn(state) // round = 2
    const next = removePlayer(state, 'p2')
    expect(next.round).toBe(2)
  })
})

describe('isRoundComplete', () => {
  test('returns true when currentIdx is 0 (initial or wrapped)', () => {
    const state = createTurnState(['p1', 'p2'])
    expect(isRoundComplete(state)).toBe(true)
  })

  test('returns false when mid-round', () => {
    const state = advanceTurn(createTurnState(['p1', 'p2', 'p3']))
    expect(isRoundComplete(state)).toBe(false)
  })

  test('returns true after full wrap', () => {
    let state = createTurnState(['p1', 'p2'])
    state = advanceTurn(state) // idx 1
    state = advanceTurn(state) // idx 0, round 2
    expect(isRoundComplete(state)).toBe(true)
  })
})
