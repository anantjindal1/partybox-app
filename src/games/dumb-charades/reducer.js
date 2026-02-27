import { buildWordQueue } from './wordpacks'
import { calcRoundScore } from './scoring'

export const ACTIONS = {
  SET_TEAMS: 'SET_TEAMS',
  TOGGLE_CATEGORY: 'TOGGLE_CATEGORY',
  CONFIRM_CATEGORIES: 'CONFIRM_CATEGORIES',
  UPDATE_SETTING: 'UPDATE_SETTING',
  CONFIRM_SETTINGS: 'CONFIRM_SETTINGS',
  START_ROUND: 'START_ROUND',   // payload: { wordQueue, ts }
  CORRECT: 'CORRECT',           // payload: { ts }
  PASS: 'PASS',                 // payload: { ts }
  TIMER_END: 'TIMER_END',
  CONFIRM_ROUND: 'CONFIRM_ROUND',
  RESET: 'RESET',
  RESTORE_STATE: 'RESTORE_STATE'
}

export function getInitialState() {
  return {
    phase: 'team_setup',
    teams: [
      { id: 't0', name: 'Team 1', score: 0, roundHistory: [] },
      { id: 't1', name: 'Team 2', score: 0, roundHistory: [] }
    ],
    currentTeamIndex: 0,
    roundNumber: 1,          // 1-based; increments after each team plays
    settings: {
      timerSeconds: 60,
      difficulty: 'easy',
      categories: ['bollywood-movies'],
      scoringMode: 'max_words',
      inputMode: 'tap',
      roundsPerTeam: 2
    },
    // Active round state
    wordQueue: [],
    currentWordIndex: 0,
    roundCorrect: 0,
    roundPassed: 0,
    wordTimings: [],
    wordStartTime: null,
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
      // payload: { teamNames: string[] }
      const teams = action.payload.teamNames.map((name, i) => ({
        id: `t${i}`, name, score: 0, roundHistory: []
      }))
      return { ...state, teams, phase: 'category_select', error: null }
    }

    case ACTIONS.TOGGLE_CATEGORY: {
      // payload: slug string
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
      // payload: { key, value }
      return {
        ...state,
        settings: { ...state.settings, [action.payload.key]: action.payload.value }
      }
    }

    case ACTIONS.CONFIRM_SETTINGS: {
      return { ...state, phase: 'round_start', error: null }
    }

    case ACTIONS.START_ROUND: {
      // payload: { wordQueue: string[], ts: number }
      return {
        ...state,
        phase: 'playing',
        wordQueue: action.payload.wordQueue,
        currentWordIndex: 0,
        roundCorrect: 0,
        roundPassed: 0,
        wordTimings: [],
        wordStartTime: action.payload.ts,
        error: null
      }
    }

    case ACTIONS.CORRECT: {
      // payload: { ts: number }
      const timeTaken = action.payload.ts - (state.wordStartTime ?? action.payload.ts)
      const timing = {
        word: state.wordQueue[state.currentWordIndex],
        timeTaken,
        result: 'correct'
      }
      const newTimings = [...state.wordTimings, timing]
      const newCorrect = state.roundCorrect + 1
      const nextIndex = state.currentWordIndex + 1

      if (nextIndex >= state.wordQueue.length) {
        return {
          ...state,
          roundCorrect: newCorrect,
          wordTimings: newTimings,
          currentWordIndex: nextIndex,
          phase: 'round_end'
        }
      }
      return {
        ...state,
        roundCorrect: newCorrect,
        wordTimings: newTimings,
        currentWordIndex: nextIndex,
        wordStartTime: action.payload.ts
      }
    }

    case ACTIONS.PASS: {
      // payload: { ts: number }
      const timing = {
        word: state.wordQueue[state.currentWordIndex],
        timeTaken: null,
        result: 'pass'
      }
      const newTimings = [...state.wordTimings, timing]
      const newPassed = state.roundPassed + 1
      const nextIndex = state.currentWordIndex + 1

      if (nextIndex >= state.wordQueue.length) {
        return {
          ...state,
          roundPassed: newPassed,
          wordTimings: newTimings,
          currentWordIndex: nextIndex,
          phase: 'round_end'
        }
      }
      return {
        ...state,
        roundPassed: newPassed,
        wordTimings: newTimings,
        currentWordIndex: nextIndex,
        wordStartTime: action.payload.ts
      }
    }

    case ACTIONS.TIMER_END: {
      return { ...state, phase: 'round_end' }
    }

    case ACTIONS.CONFIRM_ROUND: {
      const {
        roundCorrect, roundPassed, wordTimings,
        currentTeamIndex, teams, settings, roundNumber
      } = state

      const roundScore = calcRoundScore(roundCorrect, wordTimings, settings.scoringMode)
      const updatedTeams = teams.map((t, i) => {
        if (i !== currentTeamIndex) return t
        return {
          ...t,
          score: t.score + roundScore,
          roundHistory: [...t.roundHistory, { correct: roundCorrect, passed: roundPassed, score: roundScore }]
        }
      })

      const totalTurns = settings.roundsPerTeam * teams.length
      const newRoundNumber = roundNumber + 1
      const nextTeamIndex = (currentTeamIndex + 1) % teams.length

      if (newRoundNumber > totalTurns) {
        return {
          ...state,
          teams: updatedTeams,
          roundNumber: newRoundNumber,
          phase: 'game_end'
        }
      }

      return {
        ...state,
        teams: updatedTeams,
        currentTeamIndex: nextTeamIndex,
        roundNumber: newRoundNumber,
        roundCorrect: 0,
        roundPassed: 0,
        wordTimings: [],
        wordStartTime: null,
        phase: 'round_start'
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

// Helper exported for use in components (shuffle happens outside reducer for purity)
export function prepareWordQueue(settings) {
  const words = buildWordQueue(settings.categories, settings.difficulty)
  return shuffleArray(words)
}
