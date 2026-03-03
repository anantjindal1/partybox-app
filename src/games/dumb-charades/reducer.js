import { buildWordQueue } from './wordpacks'

export const ACTIONS = {
  SET_TEAMS: 'SET_TEAMS',
  TOGGLE_CATEGORY: 'TOGGLE_CATEGORY',
  CONFIRM_CATEGORIES: 'CONFIRM_CATEGORIES',
  UPDATE_SETTING: 'UPDATE_SETTING',
  CONFIRM_SETTINGS: 'CONFIRM_SETTINGS',
  ACTOR_READY: 'ACTOR_READY',      // payload: { wordQueue: string[] } — round_start → actor_prep
  REPLACE_WORD: 'REPLACE_WORD',    // rotate wordQueue[0] to end; decrement replacementsLeft
  START_ACTING: 'START_ACTING',    // actor_prep → playing
  CORRECT: 'CORRECT',              // 0 pts, → turn_result
  TIMER_END: 'TIMER_END',          // opponent +1 pt, → turn_result or game_end
  CONFIRM_TURN: 'CONFIRM_TURN',    // advance team, → round_start
  RESET: 'RESET',
  RESTORE_STATE: 'RESTORE_STATE',
  FORCE_END: 'FORCE_END'
}

export function getInitialState() {
  return {
    phase: 'team_setup',
    teams: [
      { id: 't0', name: 'Team 1', score: 0 },
      { id: 't1', name: 'Team 2', score: 0 }
    ],
    currentTeamIndex: 0,
    turnNumber: 1,
    settings: {
      timerSeconds: 90,
      difficulty: 'easy',
      categories: ['bollywood-movies'],
      winPoints: 5,
      customWords: []
    },
    // Active turn state
    wordQueue: [],
    replacementsLeft: 3,
    lastTurnOutcome: null,  // 'correct' | 'expired'
    pointsTo: null,         // team id that received the point, or null
    error: null
  }
}

export function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function gameReducer(state, action) {
  switch (action.type) {

    case ACTIONS.SET_TEAMS: {
      const teams = action.payload.teamNames.map((name, i) => ({
        id: `t${i}`, name, score: 0
      }))
      return { ...state, teams, phase: 'category_select', error: null }
    }

    case ACTIONS.TOGGLE_CATEGORY: {
      const { categories } = state.settings
      const next = categories.includes(action.payload)
        ? categories.filter(c => c !== action.payload)
        : [...categories, action.payload]
      return { ...state, settings: { ...state.settings, categories: next }, error: null }
    }

    case ACTIONS.CONFIRM_CATEGORIES: {
      if (state.settings.categories.length === 0)
        return { ...state, error: 'selectAtLeastOne' }
      return { ...state, phase: 'settings_select', error: null }
    }

    case ACTIONS.UPDATE_SETTING: {
      return {
        ...state,
        settings: { ...state.settings, [action.payload.key]: action.payload.value }
      }
    }

    case ACTIONS.CONFIRM_SETTINGS: {
      return { ...state, phase: 'round_start', error: null }
    }

    case ACTIONS.ACTOR_READY: {
      // payload: { wordQueue: string[] } — prepared outside reducer for purity
      return {
        ...state,
        phase: 'actor_prep',
        wordQueue: action.payload.wordQueue,
        replacementsLeft: 3,
        lastTurnOutcome: null,
        pointsTo: null,
        error: null
      }
    }

    case ACTIONS.REPLACE_WORD: {
      if (state.replacementsLeft <= 0 || state.wordQueue.length <= 1) return state
      const [current, ...rest] = state.wordQueue
      return {
        ...state,
        wordQueue: [...rest, current],
        replacementsLeft: state.replacementsLeft - 1
      }
    }

    case ACTIONS.START_ACTING: {
      return { ...state, phase: 'playing', error: null }
    }

    case ACTIONS.CORRECT: {
      // Guessed correctly → no points change
      return {
        ...state,
        phase: 'turn_result',
        lastTurnOutcome: 'correct',
        pointsTo: null,
        error: null
      }
    }

    case ACTIONS.TIMER_END: {
      const opponentIdx = (state.currentTeamIndex + 1) % state.teams.length
      const updatedTeams = state.teams.map((t, i) =>
        i === opponentIdx ? { ...t, score: t.score + 1 } : t
      )
      const won = updatedTeams[opponentIdx].score >= state.settings.winPoints
      return {
        ...state,
        teams: updatedTeams,
        phase: won ? 'game_end' : 'turn_result',
        lastTurnOutcome: 'expired',
        pointsTo: state.teams[opponentIdx].id,
        error: null
      }
    }

    case ACTIONS.CONFIRM_TURN: {
      const nextTeamIndex = (state.currentTeamIndex + 1) % state.teams.length
      return {
        ...state,
        currentTeamIndex: nextTeamIndex,
        turnNumber: state.turnNumber + 1,
        wordQueue: [],
        replacementsLeft: 3,
        lastTurnOutcome: null,
        pointsTo: null,
        phase: 'round_start',
        error: null
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

    case ACTIONS.FORCE_END: {
      return { ...state, phase: 'game_end' }
    }

    default:
      return state
  }
}

// Prepare a shuffled word queue — called outside reducer for purity
export function prepareWordQueue(settings) {
  const words = buildWordQueue(
    settings.categories,
    settings.difficulty,
    settings.customWords ?? []
  )
  return shuffleArray(words)
}
