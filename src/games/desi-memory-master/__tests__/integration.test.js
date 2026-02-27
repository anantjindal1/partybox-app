/**
 * Integration tests: full game flow, rapid flipping, personal best persistence.
 */
import { getInitialState, desiMemoryMasterReducer, ACTIONS, isGameComplete } from '../reducer'
import { generateBoard } from '../boardUtils'
import { getBests, updateBests } from '../persistence'

// Mock localStorage for persistence tests
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value },
    clear: () => { store = {} },
    get store() { return store }
  }
})()
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('desi-memory-master integration', () => {
  beforeEach(() => localStorageMock.clear())

  test('Full game flow: setup → generate → play → complete', () => {
    const theme = 'Indian Food'
    const board = generateBoard('easy', theme)
    expect(board.length).toBe(16)

    let state = getInitialState()
    state = desiMemoryMasterReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { difficulty: 'easy', theme }
    })
    expect(state.phase).toBe('board_generate')

    state = desiMemoryMasterReducer(state, {
      type: ACTIONS.GENERATE_BOARD,
      payload: { board, startTime: 0 }
    })
    expect(state.phase).toBe('playing')
    expect(state.board.length).toBe(16)

    // Find two indices that match (same value)
    const valueToIndices = {}
    state.board.forEach((c, i) => {
      if (!valueToIndices[c.value]) valueToIndices[c.value] = []
      valueToIndices[c.value].push(i)
    })
    const pair = Object.values(valueToIndices).find(indices => indices.length === 2)
    expect(pair).toBeDefined()
    const [i, j] = pair

    state = desiMemoryMasterReducer(state, { type: ACTIONS.FLIP_CARD, payload: { index: i } })
    state = desiMemoryMasterReducer(state, { type: ACTIONS.FLIP_CARD, payload: { index: j } })
    state = desiMemoryMasterReducer(state, { type: ACTIONS.CHECK_MATCH })
    expect(state.matchedIndices).toContain(i)
    expect(state.matchedIndices).toContain(j)
    state = desiMemoryMasterReducer(state, { type: ACTIONS.RESET_FLIPPED })
    expect(state.phase).toBe('playing')

    // Match all 8 pairs (simplified: we already matched 1, do 7 more)
    for (let p = 0; p < 7; p++) {
      const remaining = state.board.map((c, idx) => ({ ...c, idx }))
        .filter(c => !state.matchedIndices.includes(c.idx))
      const byVal = {}
      remaining.forEach(c => {
        if (!byVal[c.value]) byVal[c.value] = []
        byVal[c.value].push(c.idx)
      })
      const [idx1, idx2] = Object.values(byVal).find(arr => arr.length === 2)
      state = desiMemoryMasterReducer(state, { type: ACTIONS.FLIP_CARD, payload: { index: idx1 } })
      state = desiMemoryMasterReducer(state, { type: ACTIONS.FLIP_CARD, payload: { index: idx2 } })
      state = desiMemoryMasterReducer(state, { type: ACTIONS.CHECK_MATCH })
      state = desiMemoryMasterReducer(state, { type: ACTIONS.RESET_FLIPPED })
    }
    expect(isGameComplete(state)).toBe(true)
  })

  test('Rapid flipping does not break state — max 2 flipped', () => {
    const board = generateBoard('easy', 'Cricket')
    let state = getInitialState()
    state = desiMemoryMasterReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { difficulty: 'easy', theme: 'Cricket' }
    })
    state = desiMemoryMasterReducer(state, {
      type: ACTIONS.GENERATE_BOARD,
      payload: { board, startTime: 0 }
    })
    // Rapidly "flip" 5 cards — only first 2 should be in flippedIndices
    for (const index of [0, 1, 2, 3, 4]) {
      state = desiMemoryMasterReducer(state, { type: ACTIONS.FLIP_CARD, payload: { index } })
    }
    expect(state.flippedIndices.length).toBe(2)
  })

  test('Personal best persists in localStorage', () => {
    const { bestTime, leastMistakes } = updateBests('easy', 25, 0)
    expect(bestTime).toBe(25)
    expect(leastMistakes).toBe(0)
    const read = getBests('easy')
    expect(read.bestTime).toBe(25)
    expect(read.leastMistakes).toBe(0)
    updateBests('easy', 20, 1)
    const read2 = getBests('easy')
    expect(read2.bestTime).toBe(20)
    expect(read2.leastMistakes).toBe(0) // 0 was better than 1, so stays 0
  })
})
