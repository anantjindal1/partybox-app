/**
 * Spot the Jugaad reducer tests.
 * - START_SESSION initializes properly
 * - RECORD_ANSWER updates score
 * - TIMEOUT advances puzzle
 * - After 10 puzzles → phase = session_end
 * - XP awarded on session end
 */

jest.mock('../../../services/xp', () => ({ awardXP: jest.fn().mockResolvedValue(0) }))
jest.mock('../../../firebase', () => ({ db: {} }))

import { getInitialState, spotTheJugaadReducer, ACTIONS } from '../reducer'
import { runSessionEndXP } from '../SpotTheJugaad'

const mockPuzzles = Array(10).fill(null).map((_, i) => ({
  items: ['🐕', '🐈', '🐄', '🚗'],
  correctIndex: 3,
  category: 'Test',
  difficulty: 'easy'
}))

describe('spotTheJugaad reducer', () => {
  test('START_SESSION initializes properly', () => {
    const state = getInitialState()
    const next = spotTheJugaadReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'medium', puzzles: mockPuzzles, startTime: 1000 }
    })
    expect(next.phase).toBe('puzzle_show')
    expect(next.difficulty).toBe('medium')
    expect(next.puzzles).toHaveLength(10)
    expect(next.currentIndex).toBe(0)
    expect(next.score).toBe(0)
    expect(next.streak).toBe(0)
    expect(next.answers).toHaveLength(0)
  })

  test('RECORD_ANSWER updates score', () => {
    let state = getInitialState()
    state = spotTheJugaadReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'easy', puzzles: mockPuzzles, startTime: 0 }
    })
    state = spotTheJugaadReducer(state, {
      type: ACTIONS.RECORD_ANSWER,
      payload: { selectedIndex: 3, puzzleStartTime: 0, ts: 2000 }
    })
    expect(state.phase).toBe('answer_selected')
    expect(state.score).toBeGreaterThan(0)
    expect(state.answers).toHaveLength(1)
    expect(state.answers[0].correct).toBe(true)
  })

  test('TIMEOUT advances to answer_selected', () => {
    let state = getInitialState()
    state = spotTheJugaadReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'easy', puzzles: mockPuzzles, startTime: 0 }
    })
    expect(state.phase).toBe('puzzle_show')
    state = spotTheJugaadReducer(state, { type: ACTIONS.TIMEOUT })
    expect(state.phase).toBe('answer_selected')
    expect(state.answers).toHaveLength(1)
    expect(state.answers[0].correct).toBe(false)
  })

  test('after 10 puzzles NEXT_PUZZLE → phase session_end', () => {
    let state = getInitialState()
    state = spotTheJugaadReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'easy', puzzles: mockPuzzles, startTime: 0 }
    })
    for (let i = 0; i < 10; i++) {
      state = spotTheJugaadReducer(state, { type: ACTIONS.NEXT_PUZZLE, payload: { ts: 0 } })
    }
    expect(state.phase).toBe('session_end')
  })

  test('RESET returns to initial state', () => {
    let state = getInitialState()
    state = spotTheJugaadReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'hard', puzzles: mockPuzzles, startTime: 0 }
    })
    state = spotTheJugaadReducer(state, { type: ACTIONS.RESET })
    expect(state.phase).toBe('setup')
    expect(state.score).toBe(0)
    expect(state.puzzles).toHaveLength(0)
  })

  test('XP awarded via awardXP on session end', async () => {
    const mockAwardXP = jest.fn().mockResolvedValue(100)
    const state = {
      ...getInitialState(),
      phase: 'session_end',
      score: 85,
      answers: [...Array(8).fill({ correct: true }), ...Array(2).fill({ correct: false })]
    }
    await runSessionEndXP(state, mockAwardXP)
    expect(mockAwardXP).toHaveBeenCalledTimes(1)
    expect(mockAwardXP).toHaveBeenCalledWith(8 * 2 + 5)
  })
})
