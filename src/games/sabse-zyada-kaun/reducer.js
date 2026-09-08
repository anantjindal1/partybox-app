import { filterPrompts, pickRandomPrompt } from './prompts'

export const ACTIONS = {
  SET_PLAYERS: 'SET_PLAYERS',
  SET_TAGS: 'SET_TAGS',
  SET_ADULT: 'SET_ADULT',
  SET_ROUND_COUNT: 'SET_ROUND_COUNT',
  START_GAME: 'START_GAME',
  PICK_WINNER: 'PICK_WINNER',
  SKIP_PROMPT: 'SKIP_PROMPT',
  NEXT_ROUND: 'NEXT_ROUND',
  PLAY_AGAIN: 'PLAY_AGAIN',
  RESTORE_STATE: 'RESTORE_STATE',
}

export function getInitialState() {
  return {
    phase: 'setup',
    players: [],
    selectedTags: ['friends'],
    includeAdult: false,
    roundCount: 8,
    currentRound: 0,
    usedPromptIds: [],
    currentPrompt: null,
    wins: {},
    history: [], // [{ promptId, promptEn, winnerIds: [] }]
  }
}

function nextPrompt(state) {
  const pool = filterPrompts(state.selectedTags, state.includeAdult)
  return pickRandomPrompt(pool, state.usedPromptIds)
}

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_PLAYERS':
      return { ...state, players: action.payload }

    case 'SET_TAGS':
      return { ...state, selectedTags: action.payload }

    case 'SET_ADULT':
      return { ...state, includeAdult: action.payload }

    case 'SET_ROUND_COUNT':
      return { ...state, roundCount: action.payload }

    case 'START_GAME': {
      const prompt = nextPrompt(state)
      return {
        ...state,
        phase: 'round',
        currentRound: 1,
        currentPrompt: prompt,
        usedPromptIds: prompt ? [prompt.id] : [],
        wins: {},
        history: [],
      }
    }

    case 'SKIP_PROMPT': {
      const prompt = nextPrompt(state)
      return {
        ...state,
        currentPrompt: prompt,
        usedPromptIds: prompt ? [...state.usedPromptIds, prompt.id] : state.usedPromptIds,
      }
    }

    case 'PICK_WINNER': {
      const winnerIds = action.payload // array — ties allowed if host taps more than one
      const wins = { ...state.wins }
      for (const id of winnerIds) wins[id] = (wins[id] ?? 0) + 1
      return {
        ...state,
        phase: 'round_result',
        wins,
        history: [
          ...state.history,
          { promptId: state.currentPrompt?.id, promptEn: state.currentPrompt?.en, winnerIds },
        ],
      }
    }

    case 'NEXT_ROUND': {
      if (state.currentRound >= state.roundCount) {
        return { ...state, phase: 'game_end' }
      }
      const prompt = nextPrompt(state)
      return {
        ...state,
        phase: 'round',
        currentRound: state.currentRound + 1,
        currentPrompt: prompt,
        usedPromptIds: prompt ? [...state.usedPromptIds, prompt.id] : state.usedPromptIds,
      }
    }

    case 'PLAY_AGAIN':
      return {
        ...getInitialState(),
        players: state.players,
        selectedTags: state.selectedTags,
        includeAdult: state.includeAdult,
        roundCount: state.roundCount,
      }

    case 'RESTORE_STATE':
      return { ...state, ...action.payload }

    default:
      return state
  }
}
