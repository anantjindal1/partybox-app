/**
 * Tez Dimaag Challenge reducer tests.
 * START_GAME, turn rotation, TIMEOUT, 5 questions → round_end, CALCULATE_WINNER.
 */
jest.mock('../../../services/xp', () => ({ awardXP: jest.fn().mockResolvedValue(0) }))
jest.mock('../../../firebase', () => ({ db: {} }))

import { getInitialState, rapidFireQuizReducer, ACTIONS, isRoundEnd } from '../reducer'

const mockQuestions = Array.from({ length: 5 }, (_, i) => ({
  category: 'Cricket',
  difficulty: 'easy',
  question: `Q${i + 1}?`,
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 0
}))

describe('rapid-fire-quiz reducer', () => {
  test('START_GAME initializes players', () => {
    const state = getInitialState()
    const next = rapidFireQuizReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }] }
    })
    expect(next.phase).toBe('category_select')
    expect(next.players).toHaveLength(2)
    expect(next.players[0].name).toBe('Alice')
    expect(next.players[0].score).toBe(0)
    expect(next.players[0].correctCount).toBe(0)
  })

  test('SELECT_CATEGORY sets selectedCategory', () => {
    let state = getInitialState()
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }] }
    })
    state = rapidFireQuizReducer(state, { type: ACTIONS.SELECT_CATEGORY, payload: { category: 'Cricket' } })
    expect(state.selectedCategory).toBe('Cricket')
  })

  test('START_ROUND sets questions and phase question_show', () => {
    let state = getInitialState()
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }] }
    })
    state = rapidFireQuizReducer(state, { type: ACTIONS.SELECT_CATEGORY, payload: { category: 'Cricket' } })
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_ROUND,
      payload: { questions: mockQuestions, startTime: 0 }
    })
    expect(state.phase).toBe('question_show')
    expect(state.questions).toHaveLength(5)
    expect(state.currentQuestionIndex).toBe(0)
    expect(state.currentPlayerIndex).toBe(0)
  })

  test('RECORD_ANSWER updates current player score', () => {
    let state = getInitialState()
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }] }
    })
    state = rapidFireQuizReducer(state, { type: ACTIONS.SELECT_CATEGORY, payload: { category: 'Cricket' } })
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_ROUND,
      payload: { questions: mockQuestions, startTime: 0 }
    })
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.RECORD_ANSWER,
      payload: { selectedIndex: 0, questionStartTime: 0, ts: 2000 }
    })
    expect(state.phase).toBe('answer_selected')
    expect(state.players[0].score).toBeGreaterThan(0)
    expect(state.players[0].correctCount).toBe(1)
    expect(state.lastCorrect).toBe(true)
  })

  test('TIMEOUT advances to answer_selected', () => {
    let state = getInitialState()
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }] }
    })
    state = rapidFireQuizReducer(state, { type: ACTIONS.SELECT_CATEGORY, payload: { category: 'Cricket' } })
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_ROUND,
      payload: { questions: mockQuestions, startTime: 0 }
    })
    state = rapidFireQuizReducer(state, { type: ACTIONS.TIMEOUT })
    expect(state.phase).toBe('answer_selected')
    expect(state.lastCorrect).toBe(false)
  })

  test('turn rotation: currentPlayerIndex cycles', () => {
    let state = getInitialState()
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }, { id: '3', name: 'C' }] }
    })
    state = rapidFireQuizReducer(state, { type: ACTIONS.SELECT_CATEGORY, payload: { category: 'Cricket' } })
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_ROUND,
      payload: { questions: mockQuestions, startTime: 0 }
    })
    expect(state.currentPlayerIndex).toBe(0)
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.RECORD_ANSWER,
      payload: { selectedIndex: 0, questionStartTime: 0, ts: 1000 }
    })
    state = rapidFireQuizReducer(state, { type: ACTIONS.NEXT_QUESTION, payload: { ts: 0 } })
    expect(state.currentPlayerIndex).toBe(1)
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.RECORD_ANSWER,
      payload: { selectedIndex: 0, questionStartTime: 0, ts: 1000 }
    })
    state = rapidFireQuizReducer(state, { type: ACTIONS.NEXT_QUESTION, payload: { ts: 0 } })
    expect(state.currentPlayerIndex).toBe(2)
  })

  test('after 5 questions NEXT_QUESTION → phase round_end', () => {
    let state = getInitialState()
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }] }
    })
    state = rapidFireQuizReducer(state, { type: ACTIONS.SELECT_CATEGORY, payload: { category: 'Cricket' } })
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_ROUND,
      payload: { questions: mockQuestions, startTime: 0 }
    })
    for (let i = 0; i < 5; i++) {
      state = rapidFireQuizReducer(state, {
        type: ACTIONS.RECORD_ANSWER,
        payload: { selectedIndex: 0, questionStartTime: 0, ts: 2000 }
      })
      state = rapidFireQuizReducer(state, { type: ACTIONS.NEXT_QUESTION, payload: { ts: 0 } })
    }
    expect(state.phase).toBe('round_end')
  })

  test('CALCULATE_WINNER sets phase game_end and winnerIndex', () => {
    let state = getInitialState()
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }] }
    })
    state = rapidFireQuizReducer(state, { type: ACTIONS.CALCULATE_WINNER, payload: { winnerIndex: 1 } })
    expect(state.phase).toBe('game_end')
    expect(state.winnerIndex).toBe(1)
  })

  test('RESET returns initial state', () => {
    let state = getInitialState()
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }] }
    })
    state = rapidFireQuizReducer(state, { type: ACTIONS.RESET })
    expect(state.phase).toBe('setup')
    expect(state.players).toHaveLength(0)
  })
})
