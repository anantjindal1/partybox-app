import { buildWordPool, shuffleArray } from './wordpacks'

export const ACTIONS = {
  SET_TEAMS:           'SET_TEAMS',
  CONFIRM_CATEGORIES:  'CONFIRM_CATEGORIES',
  CONFIRM_SETTINGS:    'CONFIRM_SETTINGS',
  ACTOR_READY:         'ACTOR_READY',    // handoff → acting, reveals word
  CORRECT:             'CORRECT',         // +1 to current team, next word
  SKIP:                'SKIP',            // no penalty, next word
  TIMER_END:           'TIMER_END',       // acting → turn_result
  NEXT_TURN:           'NEXT_TURN',       // turn_result → handoff, advance team
  PLAY_AGAIN:          'PLAY_AGAIN',      // reset to team_setup
  RESTORE_STATE:       'RESTORE_STATE',
}

export function getInitialState() {
  return {
    phase: 'team_setup',

    // Teams: each { name, score, actorIdx, memberCount }
    teams: [
      { name: 'Team 1', score: 0, actorIdx: 0, memberCount: 3 },
      { name: 'Team 2', score: 0, actorIdx: 0, memberCount: 3 },
    ],
    currentTeamIdx: 0,

    // Settings (set during setup flow)
    categories:   ['bollywood_movies'],
    difficulty:   'easy',
    timerSeconds: 90,
    winPoints:    5,
    customWords:  [],

    // Word queue (built once at game start, never repeats)
    wordQueue:   [],    // remaining words this game
    usedWords:   [],    // tracked as array (Set not serialisable)
    currentWord: '',

    // Turn stats
    turnCorrect:  0,
    turnSkipped:  0,
    turnOutcome:  null, // 'correct' | 'timeout' | null
    turnHistory:  [],   // [{ word, result: 'correct'|'skip'|'timeout' }]

    // Game history (all turns)
    gameHistory: [],    // [{ teamName, correct, skipped, history }]

    error: null,
  }
}

// ── Word queue helpers ─────────────────────────────────────────────────────────

function pickNextWord(wordQueue, usedWords, settings) {
  // Always filter usedWords from the queue — guards against any state-restoration
  // edge cases and ensures words never repeat across turns within a game session.
  const usedSet = new Set(usedWords)
  const filtered = wordQueue.filter(w => !usedSet.has(w))

  if (filtered.length > 0) {
    return { word: filtered[0], queue: filtered.slice(1), used: usedWords }
  }
  // Queue exhausted — rebuild pool minus used words, reshuffle
  const pool = buildWordPool(settings.categories, settings.difficulty, settings.customWords)
  const fresh = shuffleArray(pool.filter(w => !usedSet.has(w)))
  if (fresh.length === 0) {
    // All words exhausted — reshuffle entire pool
    const all = shuffleArray(pool)
    return { word: all[0] ?? '???', queue: all.slice(1), used: [] }
  }
  return { word: fresh[0], queue: fresh.slice(1), used: usedWords }
}

// ── Reducer ───────────────────────────────────────────────────────────────────

export function gameReducer(state, action) {
  switch (action.type) {

    case ACTIONS.SET_TEAMS: {
      const teams = action.payload.teamNames.map((name, i) => ({
        name,
        score: 0,
        actorIdx: 0,
        memberCount: action.payload.memberCount,
      }))
      return { ...state, teams, phase: 'category_select', error: null }
    }

    case ACTIONS.CONFIRM_CATEGORIES: {
      if (state.categories.length === 0)
        return { ...state, error: 'selectAtLeastOne' }
      return { ...state, phase: 'settings_select', error: null }
    }

    case ACTIONS.CONFIRM_SETTINGS: {
      // Build and shuffle the full word queue for this game
      const pool = buildWordPool(state.categories, state.difficulty, state.customWords)
      const wordQueue = shuffleArray(pool)
      return {
        ...state,
        wordQueue,
        usedWords: [],
        phase: 'handoff',
        error: null,
      }
    }

    case ACTIONS.ACTOR_READY: {
      // Actor tapped the button — reveal the word and start the turn
      const { word, queue, used } = pickNextWord(state.wordQueue, state.usedWords, {
        categories: state.categories,
        difficulty: state.difficulty,
        customWords: state.customWords,
      })
      return {
        ...state,
        phase:        'acting',
        wordQueue:    queue,
        usedWords:    [...used, word],
        currentWord:  word,
        turnCorrect:  0,
        turnSkipped:  0,
        turnOutcome:  null,
        turnHistory:  [],
        error: null,
      }
    }

    case ACTIONS.CORRECT: {
      // One correct guess ends the turn immediately — classic rules
      const team = state.teams[state.currentTeamIdx]
      const newScore = team.score + 1
      const updatedTeams = state.teams.map((t, i) =>
        i === state.currentTeamIdx ? { ...t, score: newScore } : t
      )
      const won = newScore >= state.winPoints

      const entry = { word: state.currentWord, result: 'correct' }
      const newTurnHistory = [...state.turnHistory, entry]
      const turnEntry = {
        teamName: team.name,
        correct:  1,
        skipped:  state.turnSkipped,
        history:  newTurnHistory,
        outcome:  'correct',
      }

      if (won) {
        return {
          ...state,
          teams:       updatedTeams,
          phase:       'game_end',
          turnHistory: newTurnHistory,
          turnCorrect: 1,
          turnOutcome: 'correct',
          gameHistory: [...state.gameHistory, turnEntry],
          error: null,
        }
      }

      // Not won yet — go straight to turn_result (no new word)
      return {
        ...state,
        teams:       updatedTeams,
        phase:       'turn_result',
        turnHistory: newTurnHistory,
        turnCorrect: 1,
        turnOutcome: 'correct',
        gameHistory: [...state.gameHistory, turnEntry],
        error: null,
      }
    }

    case ACTIONS.SKIP: {
      const entry = { word: state.currentWord, result: 'skip' }
      const newTurnHistory = [...state.turnHistory, entry]
      const newTurnSkipped = state.turnSkipped + 1

      const { word: nextWord, queue: nextQueue, used: nextUsed } = pickNextWord(
        state.wordQueue, state.usedWords,
        { categories: state.categories, difficulty: state.difficulty, customWords: state.customWords }
      )

      return {
        ...state,
        wordQueue:   nextQueue,
        usedWords:   [...nextUsed, nextWord],
        currentWord: nextWord,
        turnSkipped: newTurnSkipped,
        turnHistory: newTurnHistory,
        error: null,
      }
    }

    case ACTIONS.TIMER_END: {
      const team = state.teams[state.currentTeamIdx]
      // Record the word being acted when time ran out
      const timeoutEntry = { word: state.currentWord, result: 'timeout' }
      const newTurnHistory = [...state.turnHistory, timeoutEntry]
      const historyEntry = {
        teamName: team.name,
        correct:  0,
        skipped:  state.turnSkipped,
        history:  newTurnHistory,
        outcome:  'timeout',
      }
      return {
        ...state,
        phase:       'turn_result',
        turnHistory: newTurnHistory,
        turnOutcome: 'timeout',
        gameHistory: [...state.gameHistory, historyEntry],
        error: null,
      }
    }

    case ACTIONS.NEXT_TURN: {
      const nextTeamIdx = (state.currentTeamIdx + 1) % state.teams.length
      // Increment actorIdx for the current team
      const updatedTeams = state.teams.map((t, i) =>
        i === state.currentTeamIdx ? { ...t, actorIdx: t.actorIdx + 1 } : t
      )
      return {
        ...state,
        teams:          updatedTeams,
        currentTeamIdx: nextTeamIdx,
        turnCorrect:    0,
        turnSkipped:    0,
        turnOutcome:    null,
        turnHistory:    [],
        currentWord:    '',
        phase:          'handoff',
        error: null,
      }
    }

    case ACTIONS.PLAY_AGAIN: {
      // Reset scores and phase but preserve settings so teams can play again
      const init = getInitialState()
      return {
        ...init,
        categories:   state.categories,
        difficulty:   state.difficulty,
        timerSeconds: state.timerSeconds,
        winPoints:    state.winPoints,
        customWords:  state.customWords,
      }
    }

    case 'CHANGE_SETTINGS':
      return { ...state, phase: 'settings_select' }

    case ACTIONS.RESTORE_STATE: {
      const next = action.payload
      if (next && typeof next.phase === 'string') return next
      return state
    }

    // Category / difficulty / settings mutations (used by screen components)
    case 'TOGGLE_CATEGORY': {
      const key = action.payload
      const cats = state.categories.includes(key)
        ? state.categories.filter(c => c !== key)
        : [...state.categories, key]
      return { ...state, categories: cats, error: null }
    }

    case 'SET_ALL_CATEGORIES': {
      return { ...state, categories: action.payload, error: null }
    }

    case 'SET_DIFFICULTY': {
      return { ...state, difficulty: action.payload, error: null }
    }

    case 'SET_TIMER': {
      return { ...state, timerSeconds: action.payload, error: null }
    }

    case 'SET_WIN_POINTS': {
      return { ...state, winPoints: action.payload, error: null }
    }

    case 'SET_CUSTOM_WORDS': {
      return { ...state, customWords: action.payload, error: null }
    }

    default:
      return state
  }
}
