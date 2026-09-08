import { PROMPTS, filterPrompts, pickRandomPrompt } from '../prompts'

describe('PROMPTS data', () => {
  it('every prompt has a unique id', () => {
    const ids = PROMPTS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every prompt has at least one tag', () => {
    expect(PROMPTS.every((p) => p.tags.length > 0)).toBe(true)
  })

  it('has at least one adult-tagged prompt to exercise the toggle', () => {
    expect(PROMPTS.some((p) => p.adult)).toBe(true)
  })
})

describe('filterPrompts', () => {
  it('excludes adult prompts by default', () => {
    const result = filterPrompts(['friends'], false)
    expect(result.every((p) => !p.adult)).toBe(true)
  })

  it('includes adult prompts when the toggle is on', () => {
    const withAdult = filterPrompts(['friends'], true)
    const withoutAdult = filterPrompts(['friends'], false)
    expect(withAdult.length).toBeGreaterThan(withoutAdult.length)
  })

  it('only returns prompts matching at least one selected tag', () => {
    const result = filterPrompts(['icebreaker'], true)
    expect(result.every((p) => p.tags.includes('icebreaker'))).toBe(true)
  })

  it('returns prompts matching any tag when multiple are selected (union, not intersection)', () => {
    const officeOnly = filterPrompts(['office'], true)
    const combined = filterPrompts(['office', 'friends'], true)
    expect(combined.length).toBeGreaterThanOrEqual(officeOnly.length)
  })

  it('falls back to every tag when none are selected', () => {
    const result = filterPrompts([], true)
    expect(result.length).toBe(PROMPTS.length)
  })
})

describe('pickRandomPrompt', () => {
  const pool = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

  it('returns null for an empty pool', () => {
    expect(pickRandomPrompt([], [])).toBeNull()
  })

  it('avoids already-used ids while unused ones remain', () => {
    const rng = () => 0 // always picks the first candidate
    const result = pickRandomPrompt(pool, ['a'], rng)
    expect(result.id).not.toBe('a')
  })

  it('falls back to repeats once the pool is exhausted', () => {
    const rng = () => 0
    const result = pickRandomPrompt(pool, ['a', 'b', 'c'], rng)
    expect(pool.map((p) => p.id)).toContain(result.id)
  })
})
