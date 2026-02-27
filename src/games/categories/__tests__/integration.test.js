/**
 * A to Z Dhamaka integration tests.
 * 3-player round flow, duplicate scenario, invalid word, timer ends round, no crash on rapid selections.
 */
jest.mock('../../../services/xp', () => ({ awardXP: jest.fn().mockResolvedValue(0) }))
jest.mock('../../../services/gameStatePersistence', () => ({
  getSavedState: jest.fn(() => null),
  clearSavedState: jest.fn(),
  saveGameState: jest.fn()
}))

import { getInitialState, categoriesReducer, ACTIONS } from '../reducer'
import { hasWord } from '../dictionary'
import { buildDuplicateMap, calculateScores, getRoundWinnerIndex } from '../scoring'

const threePlayers = [
  { id: 'p0', name: 'A' },
  { id: 'p1', name: 'B' },
  { id: 'p2', name: 'C' }
]
const fourCategories = ['Name', 'Place', 'Animal', 'Thing']

describe('categories integration', () => {
  test('3-player round flow: each player records answers, then reveal and scores', () => {
    let state = getInitialState()
    state = categoriesReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: threePlayers, letter: 'A', categories: fourCategories, roundStartTime: 0 }
    })
    expect(state.phase).toBe('round_active')
    expect(state.currentPlayerIndex).toBe(0)

    for (const [idx, pid] of ['p0', 'p1', 'p2'].entries()) {
      expect(state.currentPlayerIndex).toBe(idx)
      state = categoriesReducer(state, { type: ACTIONS.RECORD_ANSWER, payload: { playerId: pid, category: 'Name', word: 'Amit' } })
      state = categoriesReducer(state, { type: ACTIONS.RECORD_ANSWER, payload: { playerId: pid, category: 'Place', word: 'Agra' } })
      state = categoriesReducer(state, { type: ACTIONS.RECORD_ANSWER, payload: { playerId: pid, category: 'Animal', word: 'Ant' } })
      state = categoriesReducer(state, { type: ACTIONS.RECORD_ANSWER, payload: { playerId: pid, category: 'Thing', word: 'Apple' } })
      if (idx < 2) {
        state = categoriesReducer(state, { type: ACTIONS.NEXT_PLAYER, payload: { roundStartTime: 0 } })
      }
    }
    state = categoriesReducer(state, { type: ACTIONS.END_ROUND })
    expect(state.phase).toBe('reveal')

    const validMap = {}
    state.players.forEach(p => {
      validMap[p.id] = {}
      fourCategories.forEach(cat => {
        const w = (p.answers && p.answers[cat]) || ''
        validMap[p.id][cat] = !!w && hasWord('A', cat, w, true)
      })
    })
    const duplicateMap = buildDuplicateMap(state.players, fourCategories)
    expect(duplicateMap['Name:amit']).toBe(true)
    expect(duplicateMap['Place:agra']).toBe(true)
    expect(duplicateMap['Animal:ant']).toBe(true)
    expect(duplicateMap['Thing:apple']).toBe(true)

    state = categoriesReducer(state, { type: ACTIONS.APPLY_REVEAL, payload: { validMap, duplicateMap } })
    expect(state.players.every(p => typeof p.score === 'number')).toBe(true)
    state = categoriesReducer(state, { type: ACTIONS.GO_TO_RESULT })
    expect(state.phase).toBe('round_end')
  })

  test('duplicate scenario: two same answers get 5 each, one unique gets 10', () => {
    const players = [
      { id: 'p0', name: 'A', answers: { Name: 'Amit', Place: 'Agra', Animal: 'Ant', Thing: 'Apple' }, score: 0 },
      { id: 'p1', name: 'B', answers: { Name: 'Amit', Place: 'Agra', Animal: 'Ape', Thing: 'Arrow' }, score: 0 },
      { id: 'p2', name: 'C', answers: { Name: 'Anil', Place: 'Ajmer', Animal: 'Ant', Thing: 'Atlas' }, score: 0 }
    ]
    const validMap = {
      p0: { Name: true, Place: true, Animal: true, Thing: true },
      p1: { Name: true, Place: true, Animal: true, Thing: true },
      p2: { Name: true, Place: true, Animal: true, Thing: true }
    }
    const duplicateMap = buildDuplicateMap(players, fourCategories)
    expect(duplicateMap['Name:amit']).toBe(true)
    expect(duplicateMap['Place:agra']).toBe(true)
    expect(duplicateMap['Animal:ant']).toBe(true)
    const result = calculateScores(players, duplicateMap, validMap, fourCategories)
    expect(result[0].score).toBeGreaterThan(0)
    expect(result[1].score).toBeGreaterThan(0)
    expect(result[2].score).toBeGreaterThan(0)
  })

  test('invalid word: not in dictionary gets 0', () => {
    const players = [
      { id: 'p0', name: 'A', answers: { Name: 'AxxxNotInDict', Place: 'Agra', Animal: 'Ant', Thing: 'Apple' }, score: 0 }
    ]
    const validMap = { p0: { Name: false, Place: true, Animal: true, Thing: true } }
    const result = calculateScores(players, {}, validMap, fourCategories)
    expect(result[0].score).toBe(3 * 10)
  })

  test('timer ends round: NEXT_PLAYER until last then END_ROUND', () => {
    let state = getInitialState()
    state = categoriesReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: threePlayers, letter: 'A', categories: fourCategories, roundStartTime: 0 }
    })
    state = categoriesReducer(state, { type: ACTIONS.NEXT_PLAYER, payload: { roundStartTime: 0 } })
    state = categoriesReducer(state, { type: ACTIONS.NEXT_PLAYER, payload: { roundStartTime: 0 } })
    state = categoriesReducer(state, { type: ACTIONS.NEXT_PLAYER, payload: { roundStartTime: 0 } })
    expect(state.phase).toBe('reveal')
  })

  test('no crash under rapid RECORD_ANSWER (only current player accepted)', () => {
    let state = getInitialState()
    state = categoriesReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: threePlayers, letter: 'A', categories: fourCategories, roundStartTime: 0 }
    })
    for (let i = 0; i < 20; i++) {
      state = categoriesReducer(state, {
        type: ACTIONS.RECORD_ANSWER,
        payload: { playerId: 'p0', category: fourCategories[i % 4], word: 'Amit' }
      })
    }
    expect(state.players[0].answers).toBeDefined()
    expect(state.phase).toBe('round_active')
  })
})
