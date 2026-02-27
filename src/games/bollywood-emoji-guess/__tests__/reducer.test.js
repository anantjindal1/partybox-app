/**
 * Bollywood Emoji Guess reducer tests.
 * START_SESSION, RECORD_ANSWER, TIMEOUT, after 10 questions → session_end.
 */
jest.mock('../../../services/xp', () => ({ awardXP: jest.fn().mockResolvedValue(0) }))
jest.mock('../../../firebase', () => ({ db: {} }))

import { getInitialState, bollywoodEmojiGuessReducer, ACTIONS } from '../reducer'

const mockQuestions = Array.from({ length: 10 }, (_, i) => ({
  emojiClue: `🎬${i}`,
  options: ['A', 'B', 'C', 'D'],
  correctIndex: i % 4,
  category: 'movie',
  difficulty: 'easy'
}))

describe('bollywood-emoji-guess reducer', () => {
  test('START_SESSION initializes properly', () => {
    const state = getInitialState()
    const next = bollywoodEmojiGuessReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'medium', questions: mockQuestions, startTime: 1000 }
    })
    expect(next.phase).toBe('question_show')
    expect(next.difficulty).toBe('medium')
    expect(next.questions).toHaveLength(10)
    expect(next.currentIndex).toBe(0)
    expect(next.score).toBe(0)
    expect(next.streak).toBe(0)
    expect(next.answers).toHaveLength(0)
  })

  test('RECORD_ANSWER updates score', () => {
    let state = getInitialState()
    state = bollywoodEmojiGuessReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'easy', questions: mockQuestions, startTime: 0 }
    })
    state = bollywoodEmojiGuessReducer(state, {
      type: ACTIONS.RECORD_ANSWER,
      payload: { selectedIndex: 0, questionStartTime: 0, ts: 3000 }
    })
    expect(state.phase).toBe('answer_selected')
    expect(state.score).toBeGreaterThan(0)
    expect(state.answers).toHaveLength(1)
    expect(state.answers[0].correct).toBe(true)
  })

  test('TIMEOUT advances to answer_selected', () => {
    let state = getInitialState()
    state = bollywoodEmojiGuessReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'easy', questions: mockQuestions, startTime: 0 }
    })
    expect(state.phase).toBe('question_show')
    state = bollywoodEmojiGuessReducer(state, { type: ACTIONS.TIMEOUT })
    expect(state.phase).toBe('answer_selected')
    expect(state.answers).toHaveLength(1)
    expect(state.answers[0].correct).toBe(false)
  })

  test('after 10 questions NEXT_QUESTION → phase session_end', () => {
    let state = getInitialState()
    state = bollywoodEmojiGuessReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'easy', questions: mockQuestions, startTime: 0 }
    })
    for (let i = 0; i < 10; i++) {
      state = bollywoodEmojiGuessReducer(state, {
        type: ACTIONS.RECORD_ANSWER,
        payload: { selectedIndex: 0, questionStartTime: 0, ts: 2000 }
      })
      state = bollywoodEmojiGuessReducer(state, { type: ACTIONS.NEXT_QUESTION, payload: { ts: 0 } })
    }
    expect(state.phase).toBe('session_end')
  })

  test('RESET returns initial state', () => {
    let state = getInitialState()
    state = bollywoodEmojiGuessReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'hard', questions: mockQuestions, startTime: 0 }
    })
    state = bollywoodEmojiGuessReducer(state, { type: ACTIONS.RESET })
    expect(state.phase).toBe('setup')
    expect(state.score).toBe(0)
    expect(state.questions).toHaveLength(0)
  })

  test('XP awarded via runSessionEndXP on session end', async () => {
    const { runSessionEndXP } = require('../BollywoodEmojiGuess')
    const mockAwardXP = jest.fn().mockResolvedValue(20)
    const state = {
      ...getInitialState(),
      phase: 'session_end',
      score: 85,
      answers: Array(10).fill({ correct: true })
    }
    await runSessionEndXP(state, mockAwardXP)
    expect(mockAwardXP).toHaveBeenCalledTimes(1)
    expect(mockAwardXP).toHaveBeenCalledWith(10 * 2 + 5)
  })
})
