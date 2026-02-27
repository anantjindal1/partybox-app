/**
 * A to Z Dhamaka state machine. Pure reducer, no side effects.
 * Phases: setup | round_active | reveal | round_end
 * 2–6 players, 4 categories per round, 60s timer.
 */
import { calculateScores } from './scoring'

export const ACTIONS = {
  START_GAME: 'START_GAME',
  RECORD_ANSWER: 'RECORD_ANSWER',
  END_ROUND: 'END_ROUND',
  NEXT_PLAYER: 'NEXT_PLAYER',
  APPLY_REVEAL: 'APPLY_REVEAL',
  GO_TO_RESULT: 'GO_TO_RESULT',
  START_NEXT_ROUND: 'START_NEXT_ROUND',
  RESET: 'RESET',
  RESTORE_STATE: 'RESTORE_STATE'
}

const MIN_PLAYERS = 2
const MAX_PLAYERS = 6

function createPlayer(id, name) {
  return {
    id,
    name,
    answers: {},
    score: 0
  }
}

export function getInitialState() {
  return {
    phase: 'setup',
    players: [],
    letter: null,
    categories: [],
    roundStartTime: null,
    currentPlayerIndex: 0,
    roundNumber: 0,
    duplicateMap: {}
  }
}

export function categoriesReducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_GAME: {
      const payload = action.payload || {}
      const players = (payload.players || []).map((p, i) =>
        createPlayer(p.id || `p${i}`, p.name || `Player ${i + 1}`)
      )
      if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) return state
      const letter = payload.letter || 'A'
      const categories = Array.isArray(payload.categories) ? payload.categories.slice(0, 4) : []
      if (categories.length !== 4) return state
      return {
        ...getInitialState(),
        phase: 'round_active',
        players,
        letter,
        categories,
        roundStartTime: payload.roundStartTime ?? Date.now(),
        currentPlayerIndex: 0,
        roundNumber: 1
      }
    }

    case ACTIONS.RECORD_ANSWER: {
      const { playerId, category, word } = action.payload || {}
      if (state.phase !== 'round_active' || !playerId || !category) return state
      const current = state.players[state.currentPlayerIndex]
      if (!current || current.id !== playerId) return state
      const trimmed = typeof word === 'string' ? word.trim() : ''
      const players = state.players.map(p => {
        if (p.id !== playerId) return p
        return {
          ...p,
          answers: { ...(p.answers || {}), [category]: trimmed }
        }
      })
      return { ...state, players }
    }

    case ACTIONS.END_ROUND: {
      if (state.phase !== 'round_active') return state
      return { ...state, phase: 'reveal' }
    }

    case ACTIONS.NEXT_PLAYER: {
      if (state.phase !== 'round_active') return state
      const next = (state.currentPlayerIndex ?? 0) + 1
      if (next >= state.players.length) return { ...state, phase: 'reveal' }
      return {
        ...state,
        currentPlayerIndex: next,
        roundStartTime: (action.payload && action.payload.roundStartTime) ?? Date.now()
      }
    }

    case ACTIONS.APPLY_REVEAL: {
      const { duplicateMap, validMap } = action.payload || {}
      if (state.phase !== 'reveal') return state
      const categories = state.categories || []
      const updatedPlayers = calculateScores(
        state.players,
        duplicateMap || {},
        validMap || {},
        categories
      )
      return {
        ...state,
        duplicateMap: duplicateMap || {},
        validMap: validMap || {},
        players: updatedPlayers
      }
    }

    case ACTIONS.GO_TO_RESULT: {
      if (state.phase !== 'reveal') return state
      return { ...state, phase: 'round_end' }
    }

    case ACTIONS.START_NEXT_ROUND: {
      const payload = action.payload || {}
      if (state.phase !== 'round_end') return state
      const letter = payload.letter || state.letter || 'A'
      const categories = Array.isArray(payload.categories) ? payload.categories.slice(0, 4) : (state.categories || [])
      if (categories.length !== 4) return state
      const players = state.players.map(p => ({
        ...p,
        answers: {},
        lastRoundValidCount: undefined,
        lastRoundUniqueCount: undefined
      }))
      return {
        ...state,
        phase: 'round_active',
        players,
        letter,
        categories,
        roundStartTime: payload.roundStartTime ?? Date.now(),
        currentPlayerIndex: 0,
        roundNumber: (state.roundNumber || 0) + 1,
        duplicateMap: {},
        validMap: undefined
      }
    }

    case ACTIONS.RESET:
      return getInitialState()

    case ACTIONS.RESTORE_STATE:
      return action.payload && typeof action.payload === 'object' ? { ...getInitialState(), ...action.payload } : state

    default:
      return state
  }
}
