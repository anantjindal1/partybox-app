import { PROMPTS, TAGS, filterPrompts, pickRandomPrompt } from '../prompts'

describe('PROMPTS data integrity', () => {
  it('has unique ids', () => {
    const ids = PROMPTS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every entry has at least one tag from TAGS', () => {
    const validTags = Object.keys(TAGS)
    for (const p of PROMPTS) {
      expect(p.tags.length).toBeGreaterThan(0)
      expect(p.tags.every((t) => validTags.includes(t))).toBe(true)
    }
  })

  it('has at least one adult entry', () => {
    expect(PROMPTS.some((p) => p.adult)).toBe(true)
  })

  it('has both adult and non-adult entries in a healthy ratio', () => {
    const adultCount = PROMPTS.filter((p) => p.adult).length
    const nonAdultCount = PROMPTS.length - adultCount
    expect(nonAdultCount).toBeGreaterThan(adultCount)
  })
})

describe('filterPrompts', () => {
  it('excludes adult prompts by default', () => {
    const result = filterPrompts(['friends'], false)
    expect(result.every((p) => !p.adult)).toBe(true)
  })

  it('includes adult prompts when toggled on', () => {
    const result = filterPrompts(['friends'], true)
    expect(result.some((p) => p.adult)).toBe(true)
  })

  it('unions across multiple tags, not intersects', () => {
    const officeOnly = filterPrompts(['office'], true)
    const friendsOnly = filterPrompts(['friends'], true)
    const union = filterPrompts(['office', 'friends'], true)
    expect(union.length).toBeGreaterThanOrEqual(Math.max(officeOnly.length, friendsOnly.length))
  })

  it('falls back to all tags when none selected', () => {
    const result = filterPrompts([], true)
    expect(result.length).toBe(PROMPTS.length)
  })
})

describe('pickRandomPrompt', () => {
  it('returns null for an empty pool', () => {
    expect(pickRandomPrompt([], [])).toBeNull()
  })

  it('avoids used ids while unused prompts remain', () => {
    const pool = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    for (let i = 0; i < 20; i++) {
      const picked = pickRandomPrompt(pool, ['a', 'b'])
      expect(picked.id).toBe('c')
    }
  })

  it('falls back to repeats once the pool is exhausted', () => {
    const pool = [{ id: 'a' }, { id: 'b' }]
    const picked = pickRandomPrompt(pool, ['a', 'b'])
    expect(['a', 'b']).toContain(picked.id)
  })
})
