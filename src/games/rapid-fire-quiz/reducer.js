/**
 * Tez Dimaag Challenge state machine. Pure reducer, no side effects.
 * Phases: setup | category_select | question_show | answer_selected | show_result | round_end | game_end
 * 2–6 players, turn-based, 5 questions per round, 10 sec per question.
 */
import { calculateQuestionScore } from './scoring'

export const ACTIONS = {
  START_GAME: 'START_GAME',
  SELECT_CATEGORY: 'SELECT_CATEGORY',
  START_ROUND: 'START_ROUND',
  RECORD_ANSWER: 'RECORD_ANSWER',
  TIMEOUT: 'TIMEOUT',
  NEXT_QUESTION: 'NEXT_QUESTION',
  END_ROUND: 'END_ROUND',
  CALCULATE_WINNER: 'CALCULATE_WINNER',
  RESET: 'RESET',
  RESTORE_STATE: 'RESTORE_STATE'
}

const QUESTIONS_PER_ROUND = 5
const TIMEOUT_MS = 10000

export function getInitialState() {
  return {
    phase: 'setup',
    players: [],
    currentPlayerIndex: 0,
    currentQuestionIndex: 0,
    questions: [],
    selectedCategory: null,
    startTime: null,
    responseTime: null,
    questionStartTime: null,
    winnerIndex: null,
    lastCorrect: null,
    lastSelectedIndex: -1
  }
}

function createPlayer(id, name) {
  return {
    id,
    name,
    score: 0,
    correctCount: 0,
    responseTimes: [],
    streak: 0
  }
}

export function rapidFireQuizReducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_GAME: {
      const players = (action.payload?.players || []).map((p, i) =>
        createPlayer(p.id || `p${i}`, p.name || `Player ${i + 1}`)
      )
      if (players.length < 2 || players.length > 6) return state
      return {
        ...getInitialState(),
        phase: 'category_select',
        players
      }
    }

    case ACTIONS.SELECT_CATEGORY: {
      const category = action.payload?.category
      if (state.phase !== 'category_select' || !category) return state
      return {
        ...state,
        selectedCategory: category
      }
    }

    case ACTIONS.START_ROUND: {
      const { questions, startTime } = action.payload || {}
      if (!Array.isArray(questions) || questions.length === 0) return state
      if (state.phase !== 'category_select' && state.phase !== 'question_show') return state
      const resetPlayers = state.players.map(p => ({
        ...p,
        score: 0,
        correctCount: 0,
        responseTimes: [],
        streak: 0
      }))
      return {
        ...state,
        phase: 'question_show',
        players: resetPlayers,
        questions,
        currentQuestionIndex: 0,
        currentPlayerIndex: 0,
        questionStartTime: startTime ?? Date.now(),
        startTime: startTime ?? Date.now(),
        responseTime: null
      }
    }

    case ACTIONS.RECORD_ANSWER: {
      const { selectedIndex, questionStartTime } = action.payload || {}
      const q = state.questions[state.currentQuestionIndex]
      if (!q || state.phase !== 'question_show') return state
      const playerIndex = state.currentPlayerIndex
      const player = state.players[playerIndex]
      if (!player) return state
      const correct = selectedIndex === q.correctIndex
      const responseTimeMs = (action.payload.ts ?? Date.now()) - (questionStartTime ?? state.questionStartTime ?? 0)
      const streakBefore = correct ? player.streak : 0
      const points = correct ? calculateQuestionScore(responseTimeMs, streakBefore) : 0
      const newStreak = correct ? player.streak + 1 : 0
      const newResponseTimes = correct ? [...player.responseTimes, responseTimeMs] : player.responseTimes
      const updatedPlayer = {
        ...player,
        score: player.score + points,
        correctCount: player.correctCount + (correct ? 1 : 0),
        responseTimes: newResponseTimes,
        streak: newStreak
      }
      const newPlayers = state.players.map((p, i) => (i === playerIndex ? updatedPlayer : p))
      return {
        ...state,
        phase: 'answer_selected',
        players: newPlayers,
        responseTime: responseTimeMs,
        lastCorrect: correct,
        lastSelectedIndex: selectedIndex
      }
    }

    case ACTIONS.TIMEOUT: {
      if (state.phase !== 'question_show') return state
      const playerIndex = state.currentPlayerIndex
      const player = state.players[playerIndex]
      if (!player) return state
      const updatedPlayer = {
        ...player,
        streak: 0
      }
      const newPlayers = state.players.map((p, i) => (i === playerIndex ? updatedPlayer : p))
      return {
        ...state,
        phase: 'answer_selected',
        players: newPlayers,
        responseTime: TIMEOUT_MS,
        lastCorrect: false,
        lastSelectedIndex: -1
      }
    }

    case ACTIONS.NEXT_QUESTION: {
      if (state.phase !== 'answer_selected' && state.phase !== 'show_result') return state
      const nextQ = state.currentQuestionIndex + 1
      if (nextQ >= state.questions.length) {
        return { ...state, phase: 'round_end', currentQuestionIndex: nextQ }
      }
      const nextPlayer = nextQ % state.players.length
      return {
        ...state,
        phase: 'question_show',
        currentQuestionIndex: nextQ,
        currentPlayerIndex: nextPlayer,
        responseTime: null,
        questionStartTime: action.payload?.ts ?? null
      }
    }

    case ACTIONS.END_ROUND: {
      return { ...state, phase: 'round_end' }
    }

    case ACTIONS.CALCULATE_WINNER: {
      const winnerIndex = action.payload?.winnerIndex ?? 0
      return {
        ...state,
        phase: 'game_end',
        winnerIndex
      }
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

export function isRoundEnd(state) {
  return state.phase === 'round_end'
}

export function isGameEnd(state) {
  return state.phase === 'game_end'
}
