import {
  gameReducer,
  getInitialState,
  shuffleArray,
  prepareWordQueue,
  ACTIONS
} from '../src/games/dumb-charades/reducer'
import { buildWordQueue } from '../src/games/dumb-charades/wordpacks'
import { calcXP, findWinners } from '../src/games/dumb-charades/scoring'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makePlayingState(overrides = {}) {
  return {
    ...getInitialState(),
    phase: 'playing',
    wordQueue: ['Sholay', 'DDLJ', '3 Idiots', 'PK', 'Singham'],
    currentTeamIndex: 0,
    teams: [
      { id: 't0', name: 'Team 1', score: 0 },
      { id: 't1', name: 'Team 2', score: 0 }
    ],
    settings: { ...getInitialState().settings, winPoints: 5 },
    ...overrides
  }
}

function makeActorPrepState(overrides = {}) {
  return {
    ...getInitialState(),
    phase: 'actor_prep',
    wordQueue: ['Sholay', 'DDLJ', '3 Idiots', 'PK', 'Singham'],
    replacementsLeft: 3,
    currentTeamIndex: 0,
    teams: [
      { id: 't0', name: 'Team 1', score: 0 },
      { id: 't1', name: 'Team 2', score: 0 }
    ],
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

// ─── buildWordQueue ──────────────────────────────────────────────────────────

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

  test('empty categories returns only custom words', () => {
    expect(buildWordQueue([], 'easy')).toEqual([])
    const withCustom = buildWordQueue([], 'easy', ['MyMovie'])
    expect(withCustom).toEqual(['MyMovie'])
  })

  test('combines words from multiple categories', () => {
    const single = buildWordQueue(['bollywood-movies'], 'easy')
    const multi = buildWordQueue(['bollywood-movies', 'animals'], 'easy')
    expect(multi.length).toBeGreaterThan(single.length)
  })

  test('includes custom words regardless of difficulty filter', () => {
    const words = buildWordQueue(['bollywood-movies'], 'easy', ['CustomFilm1', 'CustomFilm2'])
    expect(words).toContain('CustomFilm1')
    expect(words).toContain('CustomFilm2')
  })

  test('deduplicates custom words that already appear in pack', () => {
    const words = buildWordQueue(['bollywood-movies'], 'easy', ['Sholay'])
    const count = words.filter(w => w === 'Sholay').length
    expect(count).toBe(1)
  })

  test('bollywood-movies easy pool has 65+ words', () => {
    const words = buildWordQueue(['bollywood-movies'], 'easy')
    expect(words.length).toBeGreaterThanOrEqual(65)
  })

  test('bollywood-movies hard pool has 200+ words', () => {
    const words = buildWordQueue(['bollywood-movies'], 'hard')
    expect(words.length).toBeGreaterThanOrEqual(200)
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

// ─── ACTOR_READY ─────────────────────────────────────────────────────────────

describe('ACTOR_READY', () => {
  test('transitions from round_start to actor_prep', () => {
    const init = { ...getInitialState(), phase: 'round_start' }
    const state = gameReducer(init, {
      type: ACTIONS.ACTOR_READY,
      payload: { wordQueue: ['Sholay', 'DDLJ'] }
    })
    expect(state.phase).toBe('actor_prep')
  })

  test('sets the provided wordQueue', () => {
    const queue = ['Sholay', 'DDLJ', 'PK']
    const state = gameReducer(getInitialState(), {
      type: ACTIONS.ACTOR_READY,
      payload: { wordQueue: queue }
    })
    expect(state.wordQueue).toEqual(queue)
  })

  test('resets replacementsLeft to 3', () => {
    const init = { ...getInitialState(), replacementsLeft: 1 }
    const state = gameReducer(init, {
      type: ACTIONS.ACTOR_READY,
      payload: { wordQueue: ['A', 'B'] }
    })
    expect(state.replacementsLeft).toBe(3)
  })
})

// ─── REPLACE_WORD ─────────────────────────────────────────────────────────────

describe('REPLACE_WORD', () => {
  test('moves first word to end of queue', () => {
    const state = gameReducer(makeActorPrepState(), { type: ACTIONS.REPLACE_WORD })
    expect(state.wordQueue[0]).toBe('DDLJ')
    expect(state.wordQueue[state.wordQueue.length - 1]).toBe('Sholay')
  })

  test('decrements replacementsLeft by 1', () => {
    const state = gameReducer(makeActorPrepState({ replacementsLeft: 3 }), { type: ACTIONS.REPLACE_WORD })
    expect(state.replacementsLeft).toBe(2)
  })

  test('is a no-op when replacementsLeft is 0', () => {
    const init = makeActorPrepState({ replacementsLeft: 0 })
    const state = gameReducer(init, { type: ACTIONS.REPLACE_WORD })
    expect(state.wordQueue).toEqual(init.wordQueue)
    expect(state.replacementsLeft).toBe(0)
  })

  test('is a no-op when only one word remains', () => {
    const init = makeActorPrepState({ wordQueue: ['OnlyOne'] })
    const state = gameReducer(init, { type: ACTIONS.REPLACE_WORD })
    expect(state.wordQueue).toEqual(['OnlyOne'])
  })

  test('can replace up to 3 times', () => {
    let s = makeActorPrepState()
    s = gameReducer(s, { type: ACTIONS.REPLACE_WORD })
    s = gameReducer(s, { type: ACTIONS.REPLACE_WORD })
    s = gameReducer(s, { type: ACTIONS.REPLACE_WORD })
    expect(s.replacementsLeft).toBe(0)
    // 4th replace is no-op
    const after = gameReducer(s, { type: ACTIONS.REPLACE_WORD })
    expect(after.replacementsLeft).toBe(0)
  })
})

// ─── START_ACTING ─────────────────────────────────────────────────────────────

describe('START_ACTING', () => {
  test('transitions from actor_prep to playing', () => {
    const state = gameReducer(makeActorPrepState(), { type: ACTIONS.START_ACTING })
    expect(state.phase).toBe('playing')
  })
})

// ─── CORRECT ─────────────────────────────────────────────────────────────────

describe('CORRECT', () => {
  test('transitions to turn_result', () => {
    const state = gameReducer(makePlayingState(), { type: ACTIONS.CORRECT })
    expect(state.phase).toBe('turn_result')
  })

  test('sets lastTurnOutcome to correct', () => {
    const state = gameReducer(makePlayingState(), { type: ACTIONS.CORRECT })
    expect(state.lastTurnOutcome).toBe('correct')
  })

  test('awards NO points to either team', () => {
    const state = gameReducer(makePlayingState(), { type: ACTIONS.CORRECT })
    expect(state.teams[0].score).toBe(0)
    expect(state.teams[1].score).toBe(0)
  })

  test('pointsTo is null on correct guess', () => {
    const state = gameReducer(makePlayingState(), { type: ACTIONS.CORRECT })
    expect(state.pointsTo).toBeNull()
  })
})

// ─── TIMER_END ────────────────────────────────────────────────────────────────

describe('TIMER_END', () => {
  test('awards 1 point to the opponent team', () => {
    const state = gameReducer(makePlayingState({ currentTeamIndex: 0 }), { type: ACTIONS.TIMER_END })
    // Team 1 is acting (idx 0), so Team 2 (idx 1) gets +1
    expect(state.teams[1].score).toBe(1)
    expect(state.teams[0].score).toBe(0)
  })

  test('transitions to turn_result when win condition not met', () => {
    const state = gameReducer(makePlayingState(), { type: ACTIONS.TIMER_END })
    expect(state.phase).toBe('turn_result')
  })

  test('transitions to game_end when opponent reaches winPoints', () => {
    const init = makePlayingState({
      teams: [
        { id: 't0', name: 'Team 1', score: 0 },
        { id: 't1', name: 'Team 2', score: 4 }  // one away from winning
      ],
      settings: { ...getInitialState().settings, winPoints: 5 }
    })
    const state = gameReducer(init, { type: ACTIONS.TIMER_END })
    expect(state.teams[1].score).toBe(5)
    expect(state.phase).toBe('game_end')
  })

  test('sets lastTurnOutcome to expired', () => {
    const state = gameReducer(makePlayingState(), { type: ACTIONS.TIMER_END })
    expect(state.lastTurnOutcome).toBe('expired')
  })

  test('sets pointsTo to the opponent team id', () => {
    const state = gameReducer(makePlayingState({ currentTeamIndex: 0 }), { type: ACTIONS.TIMER_END })
    expect(state.pointsTo).toBe('t1')
  })

  test('wraps team index correctly for last team acting', () => {
    // Team 2 (idx 1) acting → Team 1 (idx 0) should get the point
    const state = gameReducer(makePlayingState({ currentTeamIndex: 1 }), { type: ACTIONS.TIMER_END })
    expect(state.teams[0].score).toBe(1)
    expect(state.pointsTo).toBe('t0')
  })
})

// ─── CONFIRM_TURN ─────────────────────────────────────────────────────────────

describe('CONFIRM_TURN', () => {
  test('advances to next team', () => {
    const init = makePlayingState({ phase: 'turn_result', currentTeamIndex: 0 })
    const state = gameReducer(init, { type: ACTIONS.CONFIRM_TURN })
    expect(state.currentTeamIndex).toBe(1)
  })

  test('cycles back to team 0 after last team', () => {
    const init = makePlayingState({ phase: 'turn_result', currentTeamIndex: 1 })
    const state = gameReducer(init, { type: ACTIONS.CONFIRM_TURN })
    expect(state.currentTeamIndex).toBe(0)
  })

  test('increments turnNumber', () => {
    const init = { ...makePlayingState(), phase: 'turn_result', turnNumber: 3 }
    const state = gameReducer(init, { type: ACTIONS.CONFIRM_TURN })
    expect(state.turnNumber).toBe(4)
  })

  test('transitions phase to round_start', () => {
    const init = { ...makePlayingState(), phase: 'turn_result' }
    const state = gameReducer(init, { type: ACTIONS.CONFIRM_TURN })
    expect(state.phase).toBe('round_start')
  })

  test('resets wordQueue and replacementsLeft', () => {
    const init = { ...makeActorPrepState(), phase: 'turn_result', wordQueue: ['Sholay'], replacementsLeft: 1 }
    const state = gameReducer(init, { type: ACTIONS.CONFIRM_TURN })
    expect(state.wordQueue).toEqual([])
    expect(state.replacementsLeft).toBe(3)
  })

  test('clears lastTurnOutcome and pointsTo', () => {
    const init = { ...makePlayingState(), phase: 'turn_result', lastTurnOutcome: 'expired', pointsTo: 't1' }
    const state = gameReducer(init, { type: ACTIONS.CONFIRM_TURN })
    expect(state.lastTurnOutcome).toBeNull()
    expect(state.pointsTo).toBeNull()
  })
})

// ─── RESET ───────────────────────────────────────────────────────────────────

describe('RESET', () => {
  test('returns to initial state', () => {
    const played = gameReducer(makePlayingState(), { type: ACTIONS.TIMER_END })
    const reset = gameReducer(played, { type: ACTIONS.RESET })
    expect(reset.phase).toBe('team_setup')
    expect(reset.turnNumber).toBe(1)
    expect(reset.teams.every(t => t.score === 0)).toBe(true)
  })
})

// ─── RESTORE_STATE ────────────────────────────────────────────────────────────

describe('RESTORE_STATE', () => {
  test('restores a valid saved state', () => {
    const saved = { ...makePlayingState(), phase: 'actor_prep' }
    const state = gameReducer(getInitialState(), { type: ACTIONS.RESTORE_STATE, payload: saved })
    expect(state.phase).toBe('actor_prep')
  })

  test('ignores invalid payload', () => {
    const init = getInitialState()
    const state = gameReducer(init, { type: ACTIONS.RESTORE_STATE, payload: null })
    expect(state.phase).toBe('team_setup')
  })
})

// ─── Scoring utils ────────────────────────────────────────────────────────────

describe('calcXP', () => {
  test('returns 10 × score + 5 for winner', () => {
    expect(calcXP(3, true)).toBe(35)
  })

  test('returns 10 × score for loser', () => {
    expect(calcXP(3, false)).toBe(30)
  })

  test('returns 5 bonus only for winner with 0 score', () => {
    expect(calcXP(0, true)).toBe(5)
    expect(calcXP(0, false)).toBe(0)
  })
})

describe('findWinners', () => {
  test('returns team with highest score', () => {
    const teams = [
      { id: 't0', score: 3 },
      { id: 't1', score: 5 }
    ]
    const winners = findWinners(teams)
    expect(winners).toHaveLength(1)
    expect(winners[0].id).toBe('t1')
  })

  test('returns all tied teams', () => {
    const teams = [
      { id: 't0', score: 5 },
      { id: 't1', score: 5 }
    ]
    const winners = findWinners(teams)
    expect(winners).toHaveLength(2)
  })
})

// ─── prepareWordQueue ─────────────────────────────────────────────────────────

describe('prepareWordQueue', () => {
  test('returns shuffled array from settings', () => {
    const settings = {
      categories: ['bollywood-movies'],
      difficulty: 'easy',
      customWords: []
    }
    const queue = prepareWordQueue(settings)
    expect(queue.length).toBeGreaterThan(0)
    queue.forEach(w => expect(typeof w).toBe('string'))
  })

  test('includes custom words from settings', () => {
    const settings = {
      categories: ['bollywood-movies'],
      difficulty: 'easy',
      customWords: ['MyCustomFilm']
    }
    const queue = prepareWordQueue(settings)
    expect(queue).toContain('MyCustomFilm')
  })

  test('handles missing customWords gracefully', () => {
    const settings = {
      categories: ['bollywood-movies'],
      difficulty: 'easy'
    }
    expect(() => prepareWordQueue(settings)).not.toThrow()
  })
})
