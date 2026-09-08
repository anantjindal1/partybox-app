import { filterPrompts, pickRandomPrompt } from './prompts'

export const ACTIONS = {
  SET_TAGS: 'SET_TAGS',
  SET_ADULT: 'SET_ADULT',
  START_GAME: 'START_GAME',
  NEXT_PROMPT: 'NEXT_PROMPT',
  SKIP_PROMPT: 'SKIP_PROMPT',
  RESTART: 'RESTART',
  RESTORE_STATE: 'RESTORE_STATE',
}

export function getInitialState() {
  return {
    phase: 'setup',
    selectedTags: ['friends'],
    includeAdult: false,
    promptNumber: 0,
    usedPromptIds: [],
    currentPrompt: null,
  }
}

function nextPrompt(state) {
  const pool = filterPrompts(state.selectedTags, state.includeAdult)
  return pickRandomPrompt(pool, state.usedPromptIds)
}

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_TAGS':
      return { ...state, selectedTags: action.payload }

    case 'SET_ADULT':
      return { ...state, includeAdult: action.payload }

    case 'START_GAME': {
      const prompt = nextPrompt(state)
      return {
        ...state,
        phase: 'round',
        promptNumber: 1,
        currentPrompt: prompt,
        usedPromptIds: prompt ? [prompt.id] : [],
      }
    }

    case 'NEXT_PROMPT': {
      const prompt = nextPrompt(state)
      return {
        ...state,
        promptNumber: state.promptNumber + 1,
        currentPrompt: prompt,
        usedPromptIds: prompt ? [...state.usedPromptIds, prompt.id] : state.usedPromptIds,
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

    case 'RESTART':
      return {
        ...getInitialState(),
        selectedTags: state.selectedTags,
        includeAdult: state.includeAdult,
      }

    case 'RESTORE_STATE':
      return { ...state, ...action.payload }

    default:
      return state
  }
}
