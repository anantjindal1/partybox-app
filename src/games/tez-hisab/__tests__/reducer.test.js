/**
 * Tez Hisab reducer tests (TC-44, TC-45, TC-46).
 */

jest.mock('../../../services/xp', () => ({ awardXP: jest.fn().mockResolvedValue(0) }))
jest.mock('../../../firebase', () => ({ db: {} }))

import { getInitialState, tezHisabReducer, ACTIONS } from '../reducer'
import { runSessionEndXP } from '../TezHisab'

const mockQuestions = [
  { question: '1+1=?', options: [1, 2, 3, 4], correctIndex: 1 },
  { question: '2+2=?', options: [2, 3, 4, 5], correctIndex: 2 },
  ...Array(13).fill(null).map((_, i) => ({
    question: `q${i + 3}`,
    options: [1, 2, 3, 4],
    correctIndex: 0
  }))
]

describe('tezHisab reducer', () => {
  test('START_SESSION initializes properly', () => {
    const state = getInitialState()
    const next = tezHisabReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'medium', questions: mockQuestions, startTime: 1000 }
    })
    expect(next.phase).toBe('question_show')
    expect(next.difficulty).toBe('medium')
    expect(next.questions).toHaveLength(15)
    expect(next.currentIndex).toBe(0)
    expect(next.score).toBe(0)
    expect(next.streak).toBe(0)
    expect(next.answers).toHaveLength(0)
  })

  test('RECORD_ANSWER increments score', () => {
    let state = getInitialState()
    state = tezHisabReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'easy', questions: mockQuestions, startTime: 0 }
    })
    state = tezHisabReducer(state, {
      type: ACTIONS.RECORD_ANSWER,
      payload: { selectedIndex: 1, questionStartTime: 0, ts: 2000 }
    })
    expect(state.phase).toBe('answer_selected')
    expect(state.score).toBeGreaterThan(0)
    expect(state.answers).toHaveLength(1)
    expect(state.answers[0].correct).toBe(true)
  })

  test('TIMEOUT advances to answer_selected', () => {
    let state = getInitialState()
    state = tezHisabReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'easy', questions: mockQuestions, startTime: 0 }
    })
    expect(state.phase).toBe('question_show')
    state = tezHisabReducer(state, { type: ACTIONS.TIMEOUT })
    expect(state.phase).toBe('answer_selected')
    expect(state.answers).toHaveLength(1)
    expect(state.answers[0].correct).toBe(false)
  })

  test('TC-45: after 15 questions NEXT_QUESTION → phase session_end', () => {
    let state = getInitialState()
    state = tezHisabReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'easy', questions: mockQuestions, startTime: 0 }
    })
    for (let i = 0; i < 15; i++) {
      state = tezHisabReducer(state, { type: ACTIONS.NEXT_QUESTION, payload: { ts: 0 } })
    }
    expect(state.phase).toBe('session_end')
  })

  test('RESET returns to initial state', () => {
    let state = getInitialState()
    state = tezHisabReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'hard', questions: mockQuestions, startTime: 0 }
    })
    state = tezHisabReducer(state, { type: ACTIONS.RESET })
    expect(state.phase).toBe('setup')
    expect(state.score).toBe(0)
    expect(state.questions).toHaveLength(0)
  })

  test('TC-46: XP awarded via awardXP on session end', async () => {
    const mockAwardXP = jest.fn().mockResolvedValue(100)
    const state = {
      ...getInitialState(),
      phase: 'session_end',
      answers: [...Array(12).fill({ correct: true }), ...Array(3).fill({ correct: false })]
    }
    await runSessionEndXP(state, mockAwardXP)
    expect(mockAwardXP).toHaveBeenCalledTimes(1)
    expect(mockAwardXP).toHaveBeenCalledWith(12 * 2 + 5)
  })
})
