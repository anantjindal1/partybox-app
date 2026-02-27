/**
 * Desi Memory Master state machine. Pure reducer, no side effects.
 * Phases: setup | board_generate | playing | match_check | game_complete
 * matchedIndices stored as number[] for serialization; treat as set in logic.
 */

export const ACTIONS = {
  START_GAME: 'START_GAME',
  UPDATE_SETTING: 'UPDATE_SETTING',
  GENERATE_BOARD: 'GENERATE_BOARD',
  FLIP_CARD: 'FLIP_CARD',
  CHECK_MATCH: 'CHECK_MATCH',
  RESET_FLIPPED: 'RESET_FLIPPED',
  INCREMENT_MISTAKE: 'INCREMENT_MISTAKE',
  COMPLETE_GAME: 'COMPLETE_GAME',
  RESET: 'RESET',
  RESTORE_STATE: 'RESTORE_STATE'
}

export function getInitialState() {
  return {
    phase: 'setup',
    difficulty: 'easy',
    theme: 'Indian Food',
    board: [],
    flippedIndices: [],
    matchedIndices: [],
    mistakes: 0,
    startTime: 0,
    elapsedTime: 0,
    bestTime: null,
    leastMistakes: null
  }
}

export function desiMemoryMasterReducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_GAME: {
      const { difficulty, theme } = action.payload || {}
      if (!['easy', 'medium', 'hard'].includes(difficulty)) return state
      return {
        ...state,
        phase: 'board_generate',
        difficulty,
        theme: theme || state.theme,
        board: [],
        flippedIndices: [],
        matchedIndices: [],
        mistakes: 0,
        startTime: 0,
        elapsedTime: 0
      }
    }

    case ACTIONS.UPDATE_SETTING: {
      if (state.phase !== 'setup') return state
      const { key, value } = action.payload || {}
      if (key === 'difficulty' && ['easy', 'medium', 'hard'].includes(value)) {
        return { ...state, difficulty: value }
      }
      if (key === 'theme' && typeof value === 'string') {
        return { ...state, theme: value }
      }
      return state
    }

    case ACTIONS.GENERATE_BOARD: {
      const { board, startTime } = action.payload || {}
      if (!Array.isArray(board) || board.length === 0) return state
      if (state.phase !== 'board_generate') return state
      return {
        ...state,
        phase: 'playing',
        board,
        startTime: startTime ?? Date.now(),
        elapsedTime: 0
      }
    }

    case ACTIONS.FLIP_CARD: {
      const index = action.payload?.index
      if (typeof index !== 'number' || index < 0 || index >= (state.board?.length ?? 0)) return state
      if (state.phase !== 'playing') return state
      const matched = state.matchedIndices || []
      if (matched.includes(index)) return state
      const flipped = state.flippedIndices || []
      if (flipped.includes(index)) return state
      // Max 2 cards flipped
      if (flipped.length >= 2) return state
      return {
        ...state,
        flippedIndices: [...flipped, index]
      }
    }

    case ACTIONS.CHECK_MATCH: {
      if (state.phase !== 'playing') return state
      const flipped = state.flippedIndices || []
      if (flipped.length !== 2) return state
      const [i, j] = flipped
      const board = state.board || []
      const cardA = board[i]
      const cardB = board[j]
      if (!cardA || !cardB) return state
      const isMatch = cardA.value === cardB.value
      const matched = state.matchedIndices || []
      if (isMatch) {
        return {
          ...state,
          flippedIndices: [],
          matchedIndices: [...matched, i, j],
          phase: 'match_check'
        }
      }
      return {
        ...state,
        mistakes: (state.mistakes || 0) + 1,
        phase: 'match_check'
      }
    }

    case ACTIONS.RESET_FLIPPED: {
      if (state.phase !== 'match_check') return state
      return {
        ...state,
        flippedIndices: [],
        phase: 'playing'
      }
    }

    case ACTIONS.INCREMENT_MISTAKE: {
      // Used only if we need to increment without CHECK_MATCH; CHECK_MATCH already does it for non-match
      return { ...state, mistakes: (state.mistakes || 0) + 1 }
    }

    case ACTIONS.COMPLETE_GAME: {
      const { elapsedTime, bestTime, leastMistakes } = action.payload || {}
      return {
        ...state,
        phase: 'game_complete',
        elapsedTime: elapsedTime ?? state.elapsedTime ?? 0,
        bestTime: bestTime ?? state.bestTime,
        leastMistakes: leastMistakes ?? state.leastMistakes
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

/** Whether all pairs are matched (board length / 2 === matchedIndices length) */
export function isGameComplete(state) {
  const board = state.board || []
  const matched = state.matchedIndices || []
  return board.length > 0 && matched.length === board.length
}
