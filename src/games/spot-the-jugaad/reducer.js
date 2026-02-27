/**
 * Spot the Jugaad state machine. Pure reducer, no side effects.
 * Phases: setup → puzzle_show → answer_selected → show_result → next_puzzle → session_end
 */

import { calculatePuzzleScore } from './scoring'

export const ACTIONS = {
  START_SESSION: 'START_SESSION',
  UPDATE_SETTING: 'UPDATE_SETTING',
  RECORD_ANSWER: 'RECORD_ANSWER',
  TIMEOUT: 'TIMEOUT',
  NEXT_PUZZLE: 'NEXT_PUZZLE',
  END_SESSION: 'END_SESSION',
  RESET: 'RESET',
  RESTORE_STATE: 'RESTORE_STATE'
}

export function getInitialState() {
  return {
    phase: 'setup',
    difficulty: 'easy',
    puzzles: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    answers: [],
    startTime: null,
    responseTime: null,
    lastCorrect: null,
    puzzleStartTime: null
  }
}

export function spotTheJugaadReducer(state, action) {
  switch (action.type) {

    case ACTIONS.START_SESSION: {
      const { difficulty, puzzles } = action.payload
      return {
        ...state,
        phase: 'puzzle_show',
        difficulty,
        puzzles,
        currentIndex: 0,
        score: 0,
        streak: 0,
        answers: [],
        startTime: action.payload.startTime ?? null,
        responseTime: null,
        lastCorrect: null,
        puzzleStartTime: action.payload.startTime ?? null
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
      const { selectedIndex, puzzleStartTime } = action.payload
      const p = state.puzzles[state.currentIndex]
      if (!p || state.phase !== 'puzzle_show') return state
      const correct = selectedIndex === p.correctIndex
      const responseTimeMs = (action.payload.ts ?? Date.now()) - (puzzleStartTime ?? state.puzzleStartTime ?? 0)
      const streakBefore = correct ? state.streak : 0
      const points = correct ? calculatePuzzleScore(responseTimeMs, streakBefore) : 0
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
      if (state.phase !== 'puzzle_show') return state
      const newAnswers = [...state.answers, { correct: false, selectedIndex: -1, responseTimeMs: 10000, points: 0 }]
      return {
        ...state,
        phase: 'answer_selected',
        score: state.score,
        streak: 0,
        answers: newAnswers,
        responseTime: 10000,
        lastCorrect: false
      }
    }

    case ACTIONS.NEXT_PUZZLE: {
      const nextIndex = state.currentIndex + 1
      if (nextIndex >= state.puzzles.length) {
        return { ...state, phase: 'session_end', currentIndex: nextIndex }
      }
      return {
        ...state,
        phase: 'puzzle_show',
        currentIndex: nextIndex,
        responseTime: null,
        lastCorrect: null,
        puzzleStartTime: action.payload?.ts ?? null
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

export function isSessionEnd(state) {
  return state.phase === 'session_end'
}
