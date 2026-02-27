/**
 * A to Z Dhamaka dictionary tests.
 * Letter distribution uniform, getWords returns valid list, lookup under 50ms.
 */
import { getRandomLetter, getCategoriesPool, getWords, hasWord } from '../dictionary'

describe('categories dictionary', () => {
  test('getCategoriesPool returns 10 categories', () => {
    const pool = getCategoriesPool()
    expect(Array.isArray(pool)).toBe(true)
    expect(pool).toContain('Name')
    expect(pool).toContain('Place')
    expect(pool).toContain('Animal')
    expect(pool).toContain('Thing')
    expect(pool).toContain('Bollywood Movie')
    expect(pool).toContain('Indian Food')
    expect(pool).toContain('Profession')
    expect(pool).toContain('Festival')
    expect(pool).toContain('Cricket Term')
    expect(pool).toContain('Brand')
    expect(pool).toHaveLength(10)
  })

  test('getRandomLetter returns single uppercase A-Z', () => {
    for (let i = 0; i < 50; i++) {
      const L = getRandomLetter()
      expect(L).toMatch(/^[A-Z]$/)
    }
  })

  test('letter distribution is roughly uniform (sample)', () => {
    const counts = {}
    for (let i = 0; i < 260; i++) {
      const L = getRandomLetter()
      counts[L] = (counts[L] || 0) + 1
    }
    const letters = Object.keys(counts).sort()
    expect(letters.length).toBeGreaterThanOrEqual(20)
    letters.forEach(l => {
      expect(counts[l]).toBeGreaterThanOrEqual(2)
      expect(counts[l]).toBeLessThanOrEqual(20)
    })
  })

  test('getWords returns array for valid letter and category', () => {
    const list = getWords('A', 'Name')
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThanOrEqual(10)
    expect(list.every(w => typeof w === 'string' && w[0].toUpperCase() === 'A')).toBe(true)
  })

  test('getWords is case-insensitive for letter and category', () => {
    const list1 = getWords('a', 'name')
    const list2 = getWords('A', 'Name')
    expect(list1).toEqual(list2)
    expect(getWords('B', 'INDIAN FOOD').length).toBeGreaterThan(0)
  })

  test('getWords returns copy (does not mutate internal)', () => {
    const list = getWords('A', 'Place')
    const first = list[0]
    list[0] = 'mutated'
    expect(getWords('A', 'Place')[0]).toBe(first)
  })

  test('getWords returns empty array for unknown letter', () => {
    const list = getWords('', 'Name')
    expect(list).toEqual([])
  })

  test('hasWord: exact match case-insensitive', () => {
    expect(hasWord('A', 'Name', 'Amit')).toBe(true)
    expect(hasWord('A', 'Name', 'amit')).toBe(true)
    expect(hasWord('A', 'Name', '  Amit  ')).toBe(true)
    expect(hasWord('B', 'Place', 'Bombay')).toBe(true)
    expect(hasWord('B', 'Place', 'bombay')).toBe(true)
  })

  test('hasWord: must start with letter', () => {
    expect(hasWord('A', 'Name', 'Bob')).toBe(false)
    expect(hasWord('A', 'Name', '')).toBe(false)
  })

  test('hasWord: word not in list is false without fuzzy', () => {
    expect(hasWord('A', 'Name', 'Axyz')).toBe(false)
  })

  test('hasWord: fuzzy ≤1 char difference', () => {
    expect(hasWord('A', 'Name', 'Amit', true)).toBe(true)
    expect(hasWord('A', 'Name', 'Amitt', true)).toBe(true)
    expect(hasWord('A', 'Name', 'Amit', false)).toBe(true)
  })

  test('lookup under 50ms', () => {
    const start = performance.now()
    for (let i = 0; i < 100; i++) {
      getWords('A', 'Name')
      getWords('B', 'Place')
      hasWord('C', 'Thing', 'Chair')
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(50)
  })
})
