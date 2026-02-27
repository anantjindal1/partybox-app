/**
 * Integration: full 3-player round, turn order, rapid taps do not break state.
 */
jest.mock('../../../services/xp', () => ({ awardXP: jest.fn().mockResolvedValue(0) }))
jest.mock('../../../firebase', () => ({ db: {} }))

import { getInitialState, rapidFireQuizReducer, ACTIONS } from '../reducer'
import { generateRoundQuestions } from '../questionpacks'

describe('rapid-fire-quiz integration', () => {
  test('full 3-player round flow', () => {
    const questions = generateRoundQuestions('Cricket', 5)
    expect(questions.length).toBe(5)

    let state = getInitialState()
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_GAME,
      payload: {
        players: [
          { id: '1', name: 'A' },
          { id: '2', name: 'B' },
          { id: '3', name: 'C' }
        ]
      }
    })
    state = rapidFireQuizReducer(state, { type: ACTIONS.SELECT_CATEGORY, payload: { category: 'Cricket' } })
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_ROUND,
      payload: { questions, startTime: 0 }
    })

    for (let i = 0; i < 5; i++) {
      expect(state.phase).toBe('question_show')
      expect(state.currentQuestionIndex).toBe(i)
      expect(state.currentPlayerIndex).toBe(i % 3)
      state = rapidFireQuizReducer(state, {
        type: ACTIONS.RECORD_ANSWER,
        payload: { selectedIndex: questions[i].correctIndex, questionStartTime: 0, ts: 3000 }
      })
      state = rapidFireQuizReducer(state, { type: ACTIONS.NEXT_QUESTION, payload: { ts: 0 } })
    }
    expect(state.phase).toBe('round_end')
  })

  test('rapid taps do not double-record', () => {
    const questions = generateRoundQuestions('India GK', 5)
    let state = getInitialState()
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_GAME,
      payload: { players: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }] }
    })
    state = rapidFireQuizReducer(state, { type: ACTIONS.SELECT_CATEGORY, payload: { category: 'India GK' } })
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.START_ROUND,
      payload: { questions, startTime: 0 }
    })
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.RECORD_ANSWER,
      payload: { selectedIndex: 0, questionStartTime: 0, ts: 100 }
    })
    state = rapidFireQuizReducer(state, {
      type: ACTIONS.RECORD_ANSWER,
      payload: { selectedIndex: 1, questionStartTime: 0, ts: 101 }
    })
    expect(state.players[0].correctCount).toBe(1)
  })
})
