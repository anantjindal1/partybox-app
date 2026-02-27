/**
 * A to Z Dhamaka reducer tests.
 * recordAnswer stores correctly, END_ROUND/NEXT_PLAYER, APPLY_REVEAL, detectDuplicates via scoring.
 */
import { getInitialState, categoriesReducer, ACTIONS } from '../reducer'

const twoPlayers = [
  { id: 'p0', name: 'Alice' },
  { id: 'p1', name: 'Bob' }
]
const fourCategories = ['Name', 'Place', 'Animal', 'Thing']

describe('categories reducer', () => {
  test('START_GAME with 2 players and 4 categories sets round_active', () => {
    const state = getInitialState()
    const next = categoriesReducer(state, {
      type: ACTIONS.START_GAME,
      payload: {
        players: twoPlayers,
        letter: 'A',
        categories: fourCategories,
        roundStartTime: 1000
      }
    })
    expect(next.phase).toBe('round_active')
    expect(next.players).toHaveLength(2)
    expect(next.letter).toBe('A')
    expect(next.categories).toEqual(fourCategories)
    expect(next.currentPlayerIndex).toBe(0)
    expect(next.roundNumber).toBe(1)
  })

  test('START_GAME rejects fewer than 2 players', () => {
    const state = getInitialState()
    const next = categoriesReducer(state, {
      type: ACTIONS.START_GAME,
      payload: {
        players: [{ id: 'p0', name: 'Solo' }],
        letter: 'A',
        categories: fourCategories
      }
    })
    expect(next.phase).toBe('setup')
  })

  test('RECORD_ANSWER stores only for current player', () => {
    let state = getInitialState()
    state = categoriesReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: twoPlayers, letter: 'A', categories: fourCategories, roundStartTime: 0 }
    })
    state = categoriesReducer(state, {
      type: ACTIONS.RECORD_ANSWER,
      payload: { playerId: 'p0', category: 'Name', word: 'Amit' }
    })
    expect(state.players[0].answers.Name).toBe('Amit')
    expect(state.players[1].answers.Name).toBeUndefined()
  })

  test('RECORD_ANSWER ignores wrong playerId', () => {
    let state = getInitialState()
    state = categoriesReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: twoPlayers, letter: 'A', categories: fourCategories, roundStartTime: 0 }
    })
    state = categoriesReducer(state, {
      type: ACTIONS.RECORD_ANSWER,
      payload: { playerId: 'p1', category: 'Name', word: 'Bob' }
    })
    expect(state.players[0].answers.Name).toBeUndefined()
    expect(state.players[1].answers.Name).toBeUndefined()
  })

  test('END_ROUND sets phase to reveal', () => {
    let state = getInitialState()
    state = categoriesReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: twoPlayers, letter: 'A', categories: fourCategories, roundStartTime: 0 }
    })
    state = categoriesReducer(state, { type: ACTIONS.END_ROUND })
    expect(state.phase).toBe('reveal')
  })

  test('NEXT_PLAYER advances index and resets timer', () => {
    let state = getInitialState()
    state = categoriesReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: twoPlayers, letter: 'A', categories: fourCategories, roundStartTime: 0 }
    })
    expect(state.currentPlayerIndex).toBe(0)
    state = categoriesReducer(state, { type: ACTIONS.NEXT_PLAYER, payload: { roundStartTime: 2000 } })
    expect(state.currentPlayerIndex).toBe(1)
    expect(state.roundStartTime).toBe(2000)
  })

  test('NEXT_PLAYER when last player goes to reveal', () => {
    let state = getInitialState()
    state = categoriesReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: twoPlayers, letter: 'A', categories: fourCategories, roundStartTime: 0 }
    })
    state = categoriesReducer(state, { type: ACTIONS.NEXT_PLAYER, payload: { roundStartTime: 0 } })
    expect(state.currentPlayerIndex).toBe(1)
    state = categoriesReducer(state, { type: ACTIONS.NEXT_PLAYER, payload: { roundStartTime: 0 } })
    expect(state.phase).toBe('reveal')
  })

  test('APPLY_REVEAL updates scores and stores duplicateMap', () => {
    let state = getInitialState()
    state = categoriesReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: twoPlayers, letter: 'A', categories: fourCategories, roundStartTime: 0 }
    })
    state = categoriesReducer(state, { type: ACTIONS.RECORD_ANSWER, payload: { playerId: 'p0', category: 'Name', word: 'Amit' } })
    state = categoriesReducer(state, { type: ACTIONS.RECORD_ANSWER, payload: { playerId: 'p0', category: 'Place', word: 'Agra' } })
    state = categoriesReducer(state, { type: ACTIONS.RECORD_ANSWER, payload: { playerId: 'p0', category: 'Animal', word: 'Ant' } })
    state = categoriesReducer(state, { type: ACTIONS.RECORD_ANSWER, payload: { playerId: 'p0', category: 'Thing', word: 'Apple' } })
    state = categoriesReducer(state, { type: ACTIONS.NEXT_PLAYER, payload: { roundStartTime: 0 } })
    state = categoriesReducer(state, { type: ACTIONS.RECORD_ANSWER, payload: { playerId: 'p1', category: 'Name', word: 'Anil' } })
    state = categoriesReducer(state, { type: ACTIONS.RECORD_ANSWER, payload: { playerId: 'p1', category: 'Place', word: 'X' } })
    state = categoriesReducer(state, { type: ACTIONS.RECORD_ANSWER, payload: { playerId: 'p1', category: 'Animal', word: 'Ape' } })
    state = categoriesReducer(state, { type: ACTIONS.RECORD_ANSWER, payload: { playerId: 'p1', category: 'Thing', word: 'Arrow' } })
    state = categoriesReducer(state, { type: ACTIONS.END_ROUND })
    const validMap = { p0: { Name: true, Place: true, Animal: true, Thing: true }, p1: { Name: true, Place: false, Animal: true, Thing: true } }
    const duplicateMap = {}
    state = categoriesReducer(state, { type: ACTIONS.APPLY_REVEAL, payload: { validMap, duplicateMap } })
    expect(state.duplicateMap).toEqual(duplicateMap)
    expect(state.players[0].score).toBeGreaterThan(0)
    expect(state.validMap).toEqual(validMap)
  })

  test('GO_TO_RESULT sets phase round_end', () => {
    let state = getInitialState()
    state = categoriesReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: twoPlayers, letter: 'A', categories: fourCategories, roundStartTime: 0 }
    })
    state.phase = 'reveal'
    state = categoriesReducer(state, { type: ACTIONS.GO_TO_RESULT })
    expect(state.phase).toBe('round_end')
  })

  test('START_NEXT_ROUND resets answers and goes to round_active', () => {
    let state = getInitialState()
    state.phase = 'round_end'
    state.players = [
      { id: 'p0', name: 'A', answers: { Name: 'Amit' }, score: 10 },
      { id: 'p1', name: 'B', answers: { Name: 'Anil' }, score: 5 }
    ]
    state.letter = 'A'
    state.categories = fourCategories
    state.roundNumber = 1
    state = categoriesReducer(state, {
      type: ACTIONS.START_NEXT_ROUND,
      payload: { letter: 'B', categories: ['Place', 'Animal', 'Thing', 'Brand'], roundStartTime: 3000 }
    })
    expect(state.phase).toBe('round_active')
    expect(state.currentPlayerIndex).toBe(0)
    expect(state.players[0].answers).toEqual({})
    expect(state.players[0].score).toBe(10)
    expect(state.letter).toBe('B')
    expect(state.roundNumber).toBe(2)
  })

  test('RESET returns initial state', () => {
    let state = getInitialState()
    state = categoriesReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: twoPlayers, letter: 'A', categories: fourCategories, roundStartTime: 0 }
    })
    state = categoriesReducer(state, { type: ACTIONS.RESET })
    expect(state.phase).toBe('setup')
    expect(state.players).toHaveLength(0)
    expect(state.letter).toBeNull()
  })
})
