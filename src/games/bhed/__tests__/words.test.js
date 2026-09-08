import { CATEGORIES, WORDS, filterWords, pickSecretWord, pickGuessOptions } from '../words'

function seededRng(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

describe('WORDS', () => {
  test('every word belongs to a known category', () => {
    const validCategories = Object.keys(CATEGORIES)
    for (const w of WORDS) {
      expect(validCategories).toContain(w.category)
    }
  })

  test('every word has a unique id', () => {
    const ids = WORDS.map(w => w.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('every word has en and hi text', () => {
    for (const w of WORDS) {
      expect(w.word.en).toBeTruthy()
      expect(w.word.hi).toBeTruthy()
    }
  })
})

describe('filterWords', () => {
  test('returns all words when no categories selected', () => {
    expect(filterWords([])).toEqual(WORDS)
    expect(filterWords(null)).toEqual(WORDS)
  })

  test('returns only words matching selected categories', () => {
    const result = filterWords(['food'])
    expect(result.length).toBeGreaterThan(0)
    expect(result.every(w => w.category === 'food')).toBe(true)
  })

  test('returns the union across multiple categories', () => {
    const result = filterWords(['food', 'places'])
    expect(result.every(w => ['food', 'places'].includes(w.category))).toBe(true)
    expect(result.some(w => w.category === 'food')).toBe(true)
    expect(result.some(w => w.category === 'places')).toBe(true)
  })
})

describe('pickSecretWord', () => {
  test('returns null for an empty pool', () => {
    expect(pickSecretWord([], [], seededRng(1))).toBe(null)
  })

  test('avoids repeats until the pool is exhausted', () => {
    const pool = filterWords(['food'])
    const used = pool.slice(0, -1).map(w => w.id) // all but one used
    const picked = pickSecretWord(pool, used, seededRng(1))
    expect(picked.id).toBe(pool[pool.length - 1].id)
  })

  test('resets once the whole pool has been used', () => {
    const pool = filterWords(['professions'])
    const used = pool.map(w => w.id) // all used
    const picked = pickSecretWord(pool, used, seededRng(1))
    expect(pool.map(w => w.id)).toContain(picked.id)
  })
})

describe('pickGuessOptions', () => {
  test('always includes the correct word', () => {
    const pool = filterWords(['objects'])
    const correct = pool[0]
    const options = pickGuessOptions(correct, pool, 5, seededRng(3))
    expect(options.some(o => o.id === correct.id)).toBe(true)
  })

  test('never duplicates the correct word', () => {
    const pool = filterWords(['objects'])
    const correct = pool[0]
    const options = pickGuessOptions(correct, pool, 5, seededRng(3))
    const ids = options.map(o => o.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('returns at most `count` options, fewer if the pool is small', () => {
    const pool = filterWords(['objects'])
    const correct = pool[0]
    expect(pickGuessOptions(correct, pool, 5, seededRng(4)).length).toBe(5)
    const tinyPool = pool.slice(0, 2)
    const options = pickGuessOptions(tinyPool[0], tinyPool, 5, seededRng(4))
    expect(options.length).toBe(2)
  })

  test('returns empty array with no correct word', () => {
    expect(pickGuessOptions(null, WORDS, 5, seededRng(1))).toEqual([])
  })
})
