/**
 * Tez Hisab state machine. Pure reducer, no side effects.
 * Phases: setup → question_show → answer_selected → show_result → next_question → session_end
 */

import { calculateQuestionScore } from './scoring'

export const ACTIONS = {
  START_SESSION: 'START_SESSION',
  UPDATE_SETTING: 'UPDATE_SETTING',
  RECORD_ANSWER: 'RECORD_ANSWER',
  TIMEOUT: 'TIMEOUT',
  NEXT_QUESTION: 'NEXT_QUESTION',
  END_SESSION: 'END_SESSION',
  RESET: 'RESET',
  RESTORE_STATE: 'RESTORE_STATE'
}

const QUESTIONS_PER_SESSION = 15

export function getInitialState() {
  return {
    phase: 'setup',
    difficulty: 'easy',
    questions: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    answers: [],
    startTime: null,
    responseTime: null,
    lastCorrect: null,
    questionStartTime: null
  }
}

export function tezHisabReducer(state, action) {
  switch (action.type) {

    case ACTIONS.START_SESSION: {
      const { difficulty, questions } = action.payload
      return {
        ...state,
        phase: 'question_show',
        difficulty,
        questions,
        currentIndex: 0,
        score: 0,
        streak: 0,
        answers: [],
        startTime: action.payload.startTime ?? null,
        responseTime: null,
        lastCorrect: null,
        questionStartTime: action.payload.startTime ?? null
      }
    }

    case ACTIONS.UPDATE_SETTING: {
      if (state.phase !== 'setup') return state
      const { key, value } = action.payload || {}
      if (key === 'difficulty' && ['easy', 'medium', 'hard'].includes(value)) {
        return { ...state, difficulty: value }
      }
      return state
    }

    case ACTIONS.RECORD_ANSWER: {
      const { selectedIndex, questionStartTime } = action.payload
      const q = state.questions[state.currentIndex]
      if (!q || state.phase !== 'question_show') return state
      const correct = selectedIndex === q.correctIndex
      const responseTimeMs = (action.payload.ts ?? Date.now()) - (questionStartTime ?? state.questionStartTime ?? 0)
      const streakBefore = correct ? state.streak : 0
      const points = correct ? calculateQuestionScore(responseTimeMs, streakBefore) : 0
      const newStreak = correct ? state.streak + 1 : 0
      const newAnswers = [...state.answers, { correct, selectedIndex, responseTimeMs, points }]
      return {
        ...state,
        phase: 'answer_selected',
        score: state.score + points,
        streak: correct ? newStreak : 0,
        answers: newAnswers,
        responseTime: responseTimeMs,
        lastCorrect: correct
      }
    }

    case ACTIONS.TIMEOUT: {
      if (state.phase !== 'question_show') return state
      const newAnswers = [...state.answers, { correct: false, selectedIndex: -1, responseTimeMs: 8000, points: 0 }]
      return {
        ...state,
        phase: 'answer_selected',
        score: state.score,
        streak: 0,
        answers: newAnswers,
        responseTime: 8000,
        lastCorrect: false
      }
    }

    case ACTIONS.NEXT_QUESTION: {
      const nextIndex = state.currentIndex + 1
      if (nextIndex >= state.questions.length) {
        return { ...state, phase: 'session_end', currentIndex: nextIndex }
      }
      return {
        ...state,
        phase: 'question_show',
        currentIndex: nextIndex,
        responseTime: null,
        lastCorrect: null,
        questionStartTime: action.payload?.ts ?? null
      }
    }

    case ACTIONS.END_SESSION: {
      return { ...state, phase: 'session_end' }
    }

    case ACTIONS.RESET: {
      return getInitialState()
    }

    case ACTIONS.RESTORE_STATE: {
      const next = action.payload
      if (next && typeof next.phase === 'string') return next
      return state
    }

    default:
      return state
  }
}

/**
 * Transition from answer_selected/show_result to next question or session_end.
 * Call this from UI after showing result; reducer NEXT_QUESTION does the rest.
 */
export function shouldShowResult(state) {
  return state.phase === 'answer_selected' || state.phase === 'show_result'
}

export function isSessionEnd(state) {
  return state.phase === 'session_end'
}
