/**
 * Integration tests: full 10-question session, rapid taps, session score.
 */
jest.mock('../../../services/xp', () => ({ awardXP: jest.fn().mockResolvedValue(0) }))
jest.mock('../../../firebase', () => ({ db: {} }))

import { getInitialState, bollywoodEmojiGuessReducer, ACTIONS } from '../reducer'
import { generateSessionPuzzles } from '../puzzlepacks'

describe('bollywood-emoji-guess integration', () => {
  test('full 10-question session flow', () => {
    const questions = generateSessionPuzzles('easy', 10)
    expect(questions.length).toBe(10)

    let state = getInitialState()
    state = bollywoodEmojiGuessReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'easy', questions, startTime: 0 }
    })

    for (let i = 0; i < 10; i++) {
      expect(state.phase).toBe('question_show')
      const q = state.questions[state.currentIndex]
      expect(q).toBeDefined()
      state = bollywoodEmojiGuessReducer(state, {
        type: ACTIONS.RECORD_ANSWER,
        payload: { selectedIndex: q.correctIndex, questionStartTime: 0, ts: 4000 }
      })
      expect(state.phase).toBe('answer_selected')
      state = bollywoodEmojiGuessReducer(state, { type: ACTIONS.NEXT_QUESTION, payload: { ts: 0 } })
    }
    expect(state.phase).toBe('session_end')
    expect(state.answers.length).toBe(10)
    expect(state.score).toBeGreaterThan(0)
  })

  test('rapid taps do not break state — only first answer recorded', () => {
    const questions = generateSessionPuzzles('easy', 10)
    let state = getInitialState()
    state = bollywoodEmojiGuessReducer(state, {
      type: ACTIONS.START_SESSION,
      payload: { difficulty: 'easy', questions, startTime: 0 }
    })
    const q = state.questions[0]
    state = bollywoodEmojiGuessReducer(state, {
      type: ACTIONS.RECORD_ANSWER,
      payload: { selectedIndex: 0, questionStartTime: 0, ts: 100 }
    })
    state = bollywoodEmojiGuessReducer(state, {
      type: ACTIONS.RECORD_ANSWER,
      payload: { selectedIndex: 1, questionStartTime: 0, ts: 101 }
    })
    state = bollywoodEmojiGuessReducer(state, {
      type: ACTIONS.RECORD_ANSWER,
      payload: { selectedIndex: 2, questionStartTime: 0, ts: 102 }
    })
    expect(state.answers.length).toBe(1)
  })
})
