import {
  gameReducer,
  getInitialState,
  shuffleArray,
  ACTIONS
} from '../src/games/dumb-charades/reducer'
import { buildWordQueue } from '../src/games/dumb-charades/wordpacks'
import { calcRoundScore } from '../src/games/dumb-charades/scoring'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makePlayingState(overrides = {}) {
  return {
    ...getInitialState(),
    phase: 'playing',
    wordQueue: ['Sholay', 'DDLJ', '3 Idiots', 'PK', 'Singham'],
    currentWordIndex: 0,
    roundCorrect: 0,
    roundPassed: 0,
    wordTimings: [],
    wordStartTime: 1000,
    ...overrides
  }
}

function makeRoundEndState(overrides = {}) {
  return {
    ...getInitialState(),
    phase: 'round_end',
    roundCorrect: 3,
    roundPassed: 1,
    wordTimings: [
      { word: 'Sholay', timeTaken: 2000, result: 'correct' },
      { word: 'DDLJ', timeTaken: 3000, result: 'correct' },
      { word: '3 Idiots', timeTaken: null, result: 'pass' },
      { word: 'PK', timeTaken: 1500, result: 'correct' }
    ],
    teams: [
      { id: 't0', name: 'Team 1', score: 0, roundHistory: [] },
      { id: 't1', name: 'Team 2', score: 0, roundHistory: [] }
    ],
    currentTeamIndex: 0,
    roundNumber: 1,
    settings: { ...getInitialState().settings, roundsPerTeam: 2 },
    ...overrides
  }
}

// ─── shuffleArray ────────────────────────────────────────────────────────────

describe('shuffleArray', () => {
  test('returns same elements in the same length', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const shuffled = shuffleArray(arr)
    expect(shuffled).toHaveLength(arr.length)
    expect([...shuffled].sort((a, b) => a - b)).toEqual([...arr].sort((a, b) => a - b))
  })

  test('does not mutate original array', () => {
    const arr = [1, 2, 3, 4, 5]
    const copy = [...arr]
    shuffleArray(arr)
    expect(arr).toEqual(copy)
  })

  test('produces different orderings across multiple calls (probabilistic)', () => {
    const arr = Array.from({ length: 10 }, (_, i) => i)
    const results = new Set(Array.from({ length: 20 }, () => shuffleArray(arr).join(',')))
    expect(results.size).toBeGreaterThan(1)
  })
})

// ─── buildWordQueue + deduplication ─────────────────────────────────────────

describe('buildWordQueue', () => {
  test('returns only easy words when difficulty is easy', () => {
    const words = buildWordQueue(['bollywood-movies'], 'easy')
    expect(words.length).toBeGreaterThan(0)
    words.forEach(w => expect(typeof w).toBe('string'))
  })

  test('medium difficulty pool is larger than easy pool', () => {
    const easy = buildWordQueue(['bollywood-movies'], 'easy')
    const medium = buildWordQueue(['bollywood-movies'], 'medium')
    expect(medium.length).toBeGreaterThan(easy.length)
  })

  test('hard difficulty pool is the largest', () => {
    const medium = buildWordQueue(['bollywood-movies'], 'medium')
    const hard = buildWordQueue(['bollywood-movies'], 'hard')
    expect(hard.length).toBeGreaterThan(medium.length)
  })

  test('has no duplicate words in queue', () => {
    const words = buildWordQueue(['bollywood-movies', 'bollywood-actors'], 'hard')
    const unique = new Set(words)
    expect(unique.size).toBe(words.length)
  })

  test('empty categories returns empty array', () => {
    expect(buildWordQueue([], 'easy')).toEqual([])
  })

  test('combines words from multiple categories', () => {
    const single = buildWordQueue(['bollywood-movies'], 'easy')
    const multi = buildWordQueue(['bollywood-movies', 'animals'], 'easy')
    expect(multi.length).toBeGreaterThan(single.length)
  })
})

// ─── SET_TEAMS ───────────────────────────────────────────────────────────────

describe('SET_TEAMS', () => {
  test('creates the correct number of teams', () => {
    const state = gameReducer(getInitialState(), {
      type: ACTIONS.SET_TEAMS,
      payload: { teamNames: ['Alpha', 'Bravo', 'Charlie'] }
    })
    expect(state.teams).toHaveLength(3)
    expect(state.phase).toBe('category_select')
  })

  test('sets team names correctly', () => {
    const state = gameReducer(getInitialState(), {
      type: ACTIONS.SET_TEAMS,
      payload: { teamNames: ['Desi Boys', 'Videshi Girls'] }
    })
    expect(state.teams[0].name).toBe('Desi Boys')
    expect(state.teams[1].name).toBe('Videshi Girls')
  })

  test('resets scores to 0', () => {
    const state = gameReducer(getInitialState(), {
      type: ACTIONS.SET_TEAMS,
      payload: { teamNames: ['A', 'B'] }
    })
    state.teams.forEach(t => expect(t.score).toBe(0))
  })
})

// ─── TOGGLE_CATEGORY + CONFIRM_CATEGORIES ────────────────────────────────────

describe('TOGGLE_CATEGORY', () => {
  test('adds a category when not selected', () => {
    const state = gameReducer(getInitialState(), {
      type: ACTIONS.TOGGLE_CATEGORY, payload: 'animals'
    })
    expect(state.settings.categories).toContain('animals')
  })

  test('removes a category when already selected', () => {
    const init = { ...getInitialState(), settings: { ...getInitialState().settings, categories: ['bollywood-movies', 'animals'] } }
    const state = gameReducer(init, { type: ACTIONS.TOGGLE_CATEGORY, payload: 'animals' })
    expect(state.settings.categories).not.toContain('animals')
  })
})

describe('CONFIRM_CATEGORIES', () => {
  test('advances to settings_select with valid categories', () => {
    const state = gameReducer(getInitialState(), { type: ACTIONS.CONFIRM_CATEGORIES })
    expect(state.phase).toBe('settings_select')
  })

  test('sets error when no categories selected', () => {
    const init = { ...getInitialState(), settings: { ...getInitialState().settings, categories: [] } }
    const state = gameReducer(init, { type: ACTIONS.CONFIRM_CATEGORIES })
    expect(state.error).toBeTruthy()
    expect(state.phase).toBe('team_setup') // unchanged
  })
})

// ─── START_ROUND ─────────────────────────────────────────────────────────────

describe('START_ROUND', () => {
  test('sets phase to playing', () => {
    const state = gameReducer(getInitialState(), {
      type: ACTIONS.START_ROUND,
      payload: { wordQueue: ['A', 'B', 'C'], ts: Date.now() }
    })
    expect(state.phase).toBe('playing')
  })

  test('resets round counters', () => {
    const state = gameReducer(
      { ...getInitialState(), roundCorrect: 5, roundPassed: 2 },
      { type: ACTIONS.START_ROUND, payload: { wordQueue: ['A'], ts: Date.now() } }
    )
    expect(state.roundCorrect).toBe(0)
    expect(state.roundPassed).toBe(0)
  })

  test('stores the word queue unchanged', () => {
    const queue = ['Sholay', 'DDLJ', 'PK']
    const state = gameReducer(getInitialState(), {
      type: ACTIONS.START_ROUND, payload: { wordQueue: queue, ts: 1000 }
    })
    expect(state.wordQueue).toEqual(queue)
  })
})

// ─── CORRECT ─────────────────────────────────────────────────────────────────

describe('CORRECT', () => {
  test('increments roundCorrect by 1', () => {
    const state = gameReducer(makePlayingState(), {
      type: ACTIONS.CORRECT, payload: { ts: 3000 }
    })
    expect(state.roundCorrect).toBe(1)
  })

  test('does NOT increment roundPassed', () => {
    const state = gameReducer(makePlayingState(), {
      type: ACTIONS.CORRECT, payload: { ts: 3000 }
    })
    expect(state.roundPassed).toBe(0)
  })

  test('advances to next word', () => {
    const state = gameReducer(makePlayingState({ currentWordIndex: 0 }), {
      type: ACTIONS.CORRECT, payload: { ts: 3000 }
    })
    expect(state.currentWordIndex).toBe(1)
  })

  test('records timing with result=correct', () => {
    const state = gameReducer(makePlayingState({ wordStartTime: 1000 }), {
      type: ACTIONS.CORRECT, payload: { ts: 3000 }
    })
    expect(state.wordTimings[0]).toMatchObject({ result: 'correct', timeTaken: 2000 })
  })

  test('transitions to round_end on last word', () => {
    const state = gameReducer(
      makePlayingState({ wordQueue: ['only word'], currentWordIndex: 0 }),
      { type: ACTIONS.CORRECT, payload: { ts: 2000 } }
    )
    expect(state.phase).toBe('round_end')
  })
})

// ─── PASS ────────────────────────────────────────────────────────────────────

describe('PASS', () => {
  test('increments roundPassed by 1', () => {
    const state = gameReducer(makePlayingState(), {
      type: ACTIONS.PASS, payload: { ts: 3000 }
    })
    expect(state.roundPassed).toBe(1)
  })

  test('does NOT increment roundCorrect', () => {
    const state = gameReducer(makePlayingState(), {
      type: ACTIONS.PASS, payload: { ts: 3000 }
    })
    expect(state.roundCorrect).toBe(0)
  })

  test('records timing with result=pass and null timeTaken', () => {
    const state = gameReducer(makePlayingState(), {
      type: ACTIONS.PASS, payload: { ts: 3000 }
    })
    expect(state.wordTimings[0]).toMatchObject({ result: 'pass', timeTaken: null })
  })

  test('transitions to round_end on last word', () => {
    const state = gameReducer(
      makePlayingState({ wordQueue: ['only word'], currentWordIndex: 0 }),
      { type: ACTIONS.PASS, payload: { ts: 2000 } }
    )
    expect(state.phase).toBe('round_end')
  })
})

// ─── TIMER_END ────────────────────────────────────────────────────────────────

describe('TIMER_END', () => {
  test('transitions to round_end regardless of word position', () => {
    const state = gameReducer(makePlayingState({ currentWordIndex: 2 }), {
      type: ACTIONS.TIMER_END
    })
    expect(state.phase).toBe('round_end')
  })

  test('preserves current score when timer fires', () => {
    const s = makePlayingState({ roundCorrect: 4, roundPassed: 1 })
    const state = gameReducer(s, { type: ACTIONS.TIMER_END })
    expect(state.roundCorrect).toBe(4)
    expect(state.roundPassed).toBe(1)
  })
})

// ─── CONFIRM_ROUND ────────────────────────────────────────────────────────────

describe('CONFIRM_ROUND', () => {
  test('adds round score to current team', () => {
    const state = gameReducer(makeRoundEndState(), { type: ACTIONS.CONFIRM_ROUND })
    expect(state.teams[0].score).toBe(3) // max_words: 3 correct
  })

  test('appends to roundHistory', () => {
    const state = gameReducer(makeRoundEndState(), { type: ACTIONS.CONFIRM_ROUND })
    expect(state.teams[0].roundHistory).toHaveLength(1)
    expect(state.teams[0].roundHistory[0].correct).toBe(3)
  })

  test('switches to next team', () => {
    const state = gameReducer(makeRoundEndState(), { type: ACTIONS.CONFIRM_ROUND })
    expect(state.currentTeamIndex).toBe(1)
    expect(state.phase).toBe('round_start')
  })

  test('cycles team index back to 0 after last team', () => {
    const s = makeRoundEndState({ currentTeamIndex: 1, roundNumber: 2 })
    const state = gameReducer(s, { type: ACTIONS.CONFIRM_ROUND })
    expect(state.currentTeamIndex).toBe(0)
  })

  test('transitions to game_end after all turns are completed', () => {
    // 2 teams × 2 rounds = 4 turns; roundNumber = 4 means it's the last turn
    const s = makeRoundEndState({ roundNumber: 4, settings: { ...getInitialState().settings, roundsPerTeam: 2 } })
    const state = gameReducer(s, { type: ACTIONS.CONFIRM_ROUND })
    expect(state.phase).toBe('game_end')
  })

  test('resets round counters after CONFIRM_ROUND', () => {
    const state = gameReducer(makeRoundEndState(), { type: ACTIONS.CONFIRM_ROUND })
    expect(state.roundCorrect).toBe(0)
    expect(state.roundPassed).toBe(0)
  })
})

// ─── RESET ───────────────────────────────────────────────────────────────────

describe('RESET', () => {
  test('returns to initial state', () => {
    const played = gameReducer(makePlayingState(), { type: ACTIONS.TIMER_END })
    const reset = gameReducer(played, { type: ACTIONS.RESET })
    expect(reset.phase).toBe('team_setup')
    expect(reset.roundNumber).toBe(1)
    expect(reset.teams.every(t => t.score === 0)).toBe(true)
  })
})

// ─── Scoring: fastest_guess ──────────────────────────────────────────────────

describe('calcRoundScore', () => {
  test('max_words: returns correct word count', () => {
    expect(calcRoundScore(5, [], 'max_words')).toBe(5)
  })

  test('fastest_guess: faster average time yields higher score than slower', () => {
    const fastTimings = [{ word: 'A', timeTaken: 500, result: 'correct' }]
    const slowTimings = [{ word: 'A', timeTaken: 9000, result: 'correct' }]
    const fast = calcRoundScore(1, fastTimings, 'fastest_guess')
    const slow = calcRoundScore(1, slowTimings, 'fastest_guess')
    expect(fast).toBeGreaterThan(slow)
  })

  test('fastest_guess: 0 correct words returns 0', () => {
    expect(calcRoundScore(0, [], 'fastest_guess')).toBe(0)
  })

  test('fastest_guess: pass timings are excluded from average', () => {
    const timings = [
      { word: 'A', timeTaken: 1000, result: 'correct' },
      { word: 'B', timeTaken: null, result: 'pass' }
    ]
    const score = calcRoundScore(1, timings, 'fastest_guess')
    expect(score).toBeGreaterThan(0)
  })
})
