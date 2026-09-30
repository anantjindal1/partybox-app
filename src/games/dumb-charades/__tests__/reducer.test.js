import { gameReducer, getInitialState, ACTIONS } from '../reducer'
import { buildWordPool } from '../wordpacks'

const run = (state, ...actions) => actions.reduce(gameReducer, state)

function startedGame(overrides = {}) {
  const base = { ...getInitialState(), ...overrides }
  return run(base,
    { type: ACTIONS.SET_TEAMS, payload: { teamNames: ['A', 'B'], memberCount: 2 } },
    { type: ACTIONS.CONFIRM_CATEGORIES },
    { type: ACTIONS.CONFIRM_SETTINGS },
  )
}

describe('setup flow', () => {
  test('SET_TEAMS resets scores and moves to category select', () => {
    const s = run(getInitialState(), { type: ACTIONS.SET_TEAMS, payload: { teamNames: ['X', 'Y', 'Z'], memberCount: 4 } })
    expect(s.phase).toBe('category_select')
    expect(s.teams).toEqual([
      { name: 'X', score: 0, actorIdx: 0, memberCount: 4 },
      { name: 'Y', score: 0, actorIdx: 0, memberCount: 4 },
      { name: 'Z', score: 0, actorIdx: 0, memberCount: 4 },
    ])
  })

  test('CONFIRM_CATEGORIES with none selected sets an error and stays put', () => {
    const s = run({ ...getInitialState(), phase: 'category_select', categories: [] }, { type: ACTIONS.CONFIRM_CATEGORIES })
    expect(s.phase).toBe('category_select')
    expect(s.error).toBe('selectAtLeastOne')
  })

  test('TOGGLE_CATEGORY adds then removes', () => {
    const s1 = run({ ...getInitialState(), categories: [] }, { type: 'TOGGLE_CATEGORY', payload: 'bollywood_movies' })
    expect(s1.categories).toEqual(['bollywood_movies'])
    expect(run(s1, { type: 'TOGGLE_CATEGORY', payload: 'bollywood_movies' }).categories).toEqual([])
  })

  test('CONFIRM_SETTINGS builds a queue from the selected pool', () => {
    const s = startedGame()
    const pool = buildWordPool(s.categories, s.difficulty, s.customWords)
    expect(s.phase).toBe('handoff')
    expect(s.wordQueue).toHaveLength(pool.length)
    expect([...s.wordQueue].sort()).toEqual([...pool].sort())
  })

  test('CONFIRM_SETTINGS excludes words already seen today', () => {
    const base = { ...getInitialState(), categories: [], customWords: ['a', 'b', 'c'] }
    const s = run(base, { type: ACTIONS.CONFIRM_SETTINGS, payload: { excludeWords: ['a', 'b'] } })
    expect(s.wordQueue).toEqual(['c'])
  })

  test('CONFIRM_SETTINGS falls back to the full pool when everything was seen', () => {
    const base = { ...getInitialState(), categories: [], customWords: ['a', 'b'] }
    const s = run(base, { type: ACTIONS.CONFIRM_SETTINGS, payload: { excludeWords: ['a', 'b'] } })
    expect([...s.wordQueue].sort()).toEqual(['a', 'b'])
  })
})

describe('turns', () => {
  test('ACTOR_READY reveals the next word and marks it used', () => {
    const s0 = startedGame()
    const s = run(s0, { type: ACTIONS.ACTOR_READY })
    expect(s.phase).toBe('acting')
    expect(s.currentWord).toBe(s0.wordQueue[0])
    expect(s.usedWords).toEqual([s0.wordQueue[0]])
    expect(s.wordQueue).toEqual(s0.wordQueue.slice(1))
  })

  test('SKIP moves to a new word with no penalty', () => {
    const s1 = run(startedGame(), { type: ACTIONS.ACTOR_READY })
    const s2 = run(s1, { type: ACTIONS.SKIP })
    expect(s2.currentWord).not.toBe(s1.currentWord)
    expect(s2.turnSkipped).toBe(1)
    expect(s2.turnHistory).toEqual([{ word: s1.currentWord, result: 'skip' }])
    expect(s2.teams[0].score).toBe(0)
    expect(s2.phase).toBe('acting')
  })

  test('CORRECT scores one point and ends the turn', () => {
    const s = run(startedGame(), { type: ACTIONS.ACTOR_READY }, { type: ACTIONS.CORRECT })
    expect(s.teams[0].score).toBe(1)
    expect(s.phase).toBe('turn_result')
    expect(s.turnOutcome).toBe('correct')
    expect(s.gameHistory).toHaveLength(1)
    expect(s.gameHistory[0]).toMatchObject({ teamName: 'A', correct: 1, outcome: 'correct' })
  })

  test('CORRECT reaching winPoints ends the game', () => {
    const s0 = startedGame()
    const near = { ...s0, winPoints: 1 }
    const s = run(near, { type: ACTIONS.ACTOR_READY }, { type: ACTIONS.CORRECT })
    expect(s.phase).toBe('game_end')
  })

  test('TIMER_END records a timeout without scoring', () => {
    const s1 = run(startedGame(), { type: ACTIONS.ACTOR_READY })
    const s = run(s1, { type: ACTIONS.TIMER_END })
    expect(s.phase).toBe('turn_result')
    expect(s.turnOutcome).toBe('timeout')
    expect(s.teams[0].score).toBe(0)
    expect(s.gameHistory[0]).toMatchObject({ correct: 0, outcome: 'timeout' })
    expect(s.turnHistory.at(-1)).toEqual({ word: s1.currentWord, result: 'timeout' })
  })

  test('NEXT_TURN rotates teams, advances the actor and clears turn state', () => {
    const s = run(startedGame(), { type: ACTIONS.ACTOR_READY }, { type: ACTIONS.TIMER_END }, { type: ACTIONS.NEXT_TURN })
    expect(s.currentTeamIdx).toBe(1)
    expect(s.teams[0].actorIdx).toBe(1)
    expect(s.teams[1].actorIdx).toBe(0)
    expect(s.phase).toBe('handoff')
    expect(s.currentWord).toBe('')
    expect(s.turnHistory).toEqual([])
  })

  test('NEXT_TURN wraps back to the first team', () => {
    const s = run(startedGame(),
      { type: ACTIONS.NEXT_TURN },
      { type: ACTIONS.NEXT_TURN })
    expect(s.currentTeamIdx).toBe(0)
  })

  test('words never repeat within a game until the pool runs out', () => {
    let s = startedGame({ categories: [], customWords: ['a', 'b', 'c', 'd'] })
    s = run(s, { type: ACTIONS.ACTOR_READY }, { type: ACTIONS.SKIP }, { type: ACTIONS.SKIP }, { type: ACTIONS.SKIP })
    expect(new Set(s.usedWords).size).toBe(4)
    s = run(s, { type: ACTIONS.SKIP })
    expect(['a', 'b', 'c', 'd']).toContain(s.currentWord)
    expect(s.usedWords).toEqual([s.currentWord])
  })
})

describe('reset and restore', () => {
  test('PLAY_AGAIN resets scores but keeps settings', () => {
    const played = run(startedGame({ difficulty: 'hard', timerSeconds: 60, winPoints: 3 }),
      { type: ACTIONS.ACTOR_READY }, { type: ACTIONS.CORRECT })
    const s = run(played, { type: ACTIONS.PLAY_AGAIN })
    expect(s.phase).toBe('team_setup')
    expect(s.gameHistory).toEqual([])
    expect(s.teams.every(t => t.score === 0)).toBe(true)
    expect(s).toMatchObject({ difficulty: 'hard', timerSeconds: 60, winPoints: 3, categories: played.categories })
  })

  test('RESTORE_STATE accepts a valid snapshot and ignores junk', () => {
    const snap = { ...getInitialState(), phase: 'acting' }
    expect(run(getInitialState(), { type: ACTIONS.RESTORE_STATE, payload: snap })).toBe(snap)
    const s0 = getInitialState()
    expect(run(s0, { type: ACTIONS.RESTORE_STATE, payload: { foo: 1 } })).toBe(s0)
  })
})
