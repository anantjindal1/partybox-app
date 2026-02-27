/**
 * Desi Memory Master reducer tests.
 * FLIP_CARD, CHECK_MATCH, non-match increments mistake, all matches → game_complete.
 */
import { getInitialState, desiMemoryMasterReducer, ACTIONS, isGameComplete } from '../reducer'

describe('desiMemoryMaster reducer', () => {
  test('FLIP_CARD flips correctly', () => {
    const board = [
      { id: 'a1', value: 'X' },
      { id: 'a2', value: 'X' },
      { id: 'b1', value: 'Y' },
      { id: 'b2', value: 'Y' }
    ]
    let state = getInitialState()
    state = desiMemoryMasterReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { difficulty: 'easy', theme: 'Indian Food' }
    })
    state = desiMemoryMasterReducer(state, {
      type: ACTIONS.GENERATE_BOARD,
      payload: { board, startTime: 0 }
    })
    expect(state.flippedIndices).toEqual([])
    state = desiMemoryMasterReducer(state, { type: ACTIONS.FLIP_CARD, payload: { index: 0 } })
    expect(state.flippedIndices).toEqual([0])
    state = desiMemoryMasterReducer(state, { type: ACTIONS.FLIP_CARD, payload: { index: 1 } })
    expect(state.flippedIndices).toEqual([0, 1])
    // Third flip ignored (max 2)
    state = desiMemoryMasterReducer(state, { type: ACTIONS.FLIP_CARD, payload: { index: 2 } })
    expect(state.flippedIndices).toEqual([0, 1])
  })

  test('CHECK_MATCH marks matched when same value', () => {
    const board = [
      { id: 'a1', value: 'X' },
      { id: 'a2', value: 'X' },
      { id: 'b1', value: 'Y' },
      { id: 'b2', value: 'Y' }
    ]
    let state = getInitialState()
    state = desiMemoryMasterReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { difficulty: 'easy', theme: 'Indian Food' }
    })
    state = desiMemoryMasterReducer(state, {
      type: ACTIONS.GENERATE_BOARD,
      payload: { board, startTime: 0 }
    })
    state = desiMemoryMasterReducer(state, { type: ACTIONS.FLIP_CARD, payload: { index: 0 } })
    state = desiMemoryMasterReducer(state, { type: ACTIONS.FLIP_CARD, payload: { index: 1 } })
    state = desiMemoryMasterReducer(state, { type: ACTIONS.CHECK_MATCH })
    expect(state.matchedIndices).toEqual([0, 1])
    expect(state.flippedIndices).toEqual([])
    expect(state.phase).toBe('match_check')
    expect(state.mistakes).toBe(0)
  })

  test('CHECK_MATCH non-match increments mistake', () => {
    const board = [
      { id: 'a1', value: 'X' },
      { id: 'a2', value: 'Y' },
      { id: 'b1', value: 'X' },
      { id: 'b2', value: 'Y' }
    ]
    let state = getInitialState()
    state = desiMemoryMasterReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { difficulty: 'easy', theme: 'Indian Food' }
    })
    state = desiMemoryMasterReducer(state, {
      type: ACTIONS.GENERATE_BOARD,
      payload: { board, startTime: 0 }
    })
    state = desiMemoryMasterReducer(state, { type: ACTIONS.FLIP_CARD, payload: { index: 0 } })
    state = desiMemoryMasterReducer(state, { type: ACTIONS.FLIP_CARD, payload: { index: 1 } })
    state = desiMemoryMasterReducer(state, { type: ACTIONS.CHECK_MATCH })
    expect(state.mistakes).toBe(1)
    expect(state.phase).toBe('match_check')
    expect(state.matchedIndices).toEqual([])
  })

  test('After all pairs matched, isGameComplete is true', () => {
    const board = [
      { id: 'a1', value: 'X' },
      { id: 'a2', value: 'X' },
      { id: 'b1', value: 'Y' },
      { id: 'b2', value: 'Y' }
    ]
    let state = getInitialState()
    state = desiMemoryMasterReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { difficulty: 'easy', theme: 'Indian Food' }
    })
    state = desiMemoryMasterReducer(state, {
      type: ACTIONS.GENERATE_BOARD,
      payload: { board, startTime: 0 }
    })
    expect(isGameComplete(state)).toBe(false)
    state = desiMemoryMasterReducer(state, { type: ACTIONS.FLIP_CARD, payload: { index: 0 } })
    state = desiMemoryMasterReducer(state, { type: ACTIONS.FLIP_CARD, payload: { index: 1 } })
    state = desiMemoryMasterReducer(state, { type: ACTIONS.CHECK_MATCH })
    state = desiMemoryMasterReducer(state, { type: ACTIONS.RESET_FLIPPED })
    state = desiMemoryMasterReducer(state, { type: ACTIONS.FLIP_CARD, payload: { index: 2 } })
    state = desiMemoryMasterReducer(state, { type: ACTIONS.FLIP_CARD, payload: { index: 3 } })
    state = desiMemoryMasterReducer(state, { type: ACTIONS.CHECK_MATCH })
    expect(state.matchedIndices).toEqual([0, 1, 2, 3])
    expect(isGameComplete(state)).toBe(true)
  })

  test('RESET returns initial state', () => {
    let state = getInitialState()
    state = desiMemoryMasterReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { difficulty: 'hard', theme: 'Cricket' }
    })
    state = desiMemoryMasterReducer(state, { type: ACTIONS.RESET })
    expect(state.phase).toBe('setup')
    expect(state.difficulty).toBe('easy')
    expect(state.board).toEqual([])
    expect(state.matchedIndices).toEqual([])
  })

  test('UPDATE_SETTING updates difficulty and theme in setup', () => {
    let state = getInitialState()
    state = desiMemoryMasterReducer(state, {
      type: ACTIONS.UPDATE_SETTING,
      payload: { key: 'difficulty', value: 'medium' }
    })
    expect(state.difficulty).toBe('medium')
    state = desiMemoryMasterReducer(state, {
      type: ACTIONS.UPDATE_SETTING,
      payload: { key: 'theme', value: 'Cricket' }
    })
    expect(state.theme).toBe('Cricket')
  })
})
