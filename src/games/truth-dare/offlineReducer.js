import { MAX_SLOTS, pickNextSlot, pickPrompt, spinRotation } from './logic'

// Players with no typed name keep their seat number, so "Player 3" stays
// "Player 3" after someone else leaves.
const makePlayer = (num, name = '') => ({ id: `p${num}`, num, name: name.trim() })

export function getInitialState() {
  return {
    phase: 'setup',
    setting: 'friends',
    spinMode: 'random',
    players: [],
    nextNum: 1,
    rotation: 0,
    cycleDone: [],
    step: 'idle',
    turnId: null,
    type: null,
    promptId: null,
    usedIds: [],
  }
}

export function reducer(state, action) {
  const rng = action.rng ?? Math.random
  switch (action.type) {
    case 'START': {
      const players = action.names.map((name, i) => makePlayer(i + 1, name))
      return {
        ...getInitialState(),
        phase: 'play',
        setting: action.setting,
        spinMode: action.spinMode,
        players,
        nextNum: players.length + 1,
      }
    }

    case 'SPIN': {
      if (state.step !== 'idle' || state.players.length < 2) return state
      const ids = state.players.map(p => p.id)
      const { id, cycleDone } = pickNextSlot(ids, state.spinMode, state.cycleDone, rng)
      return {
        ...state,
        step: 'spinning',
        turnId: id,
        cycleDone,
        rotation: spinRotation(state.rotation, ids.indexOf(id), ids.length, rng),
      }
    }

    case 'SPUN':
      return state.step === 'spinning' ? { ...state, step: 'choose' } : state

    case 'CHOOSE':
    case 'SKIP': {
      const type = action.type === 'CHOOSE' ? action.choice : state.type
      const prompt = pickPrompt(state.setting, type, state.usedIds, rng)
      return {
        ...state,
        step: 'prompt',
        type,
        promptId: prompt?.id ?? null,
        usedIds: prompt ? [...state.usedIds, prompt.id] : state.usedIds,
      }
    }

    case 'DONE':
      return { ...state, step: 'idle', type: null, promptId: null }

    case 'ADD_PLAYER': {
      if (state.step !== 'idle' || state.players.length >= MAX_SLOTS) return state
      return {
        ...state,
        players: [...state.players, makePlayer(state.nextNum, action.name ?? '')],
        nextNum: state.nextNum + 1,
      }
    }

    case 'REMOVE_PLAYER': {
      if (state.step !== 'idle' || state.players.length <= 2) return state
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.id),
        cycleDone: state.cycleDone.filter(id => id !== action.id),
      }
    }

    case 'NEW_GAME':
      return { ...getInitialState(), setting: state.setting, spinMode: state.spinMode }

    default:
      return state
  }
}
