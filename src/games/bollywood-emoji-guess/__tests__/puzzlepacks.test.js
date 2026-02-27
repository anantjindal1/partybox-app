/**
 * Bollywood Emoji Guess puzzlepacks tests.
 * 4 options per puzzle, correctIndex valid, no duplicate puzzles, generateSessionPuzzles returns 10 unique.
 */
import { getPuzzlesByDifficulty, generateSessionPuzzles, ALL_PUZZLES } from '../puzzlepacks'

describe('bollywood-emoji-guess puzzlepacks', () => {
  test('minimum 120 puzzles', () => {
    expect(ALL_PUZZLES.length).toBeGreaterThanOrEqual(120)
  })

  test('every puzzle has exactly 4 options', () => {
    ALL_PUZZLES.forEach(p => {
      expect(Array.isArray(p.options)).toBe(true)
      expect(p.options.length).toBe(4)
    })
  })

  test('correctIndex is valid (0-3)', () => {
    ALL_PUZZLES.forEach(p => {
      expect(p.correctIndex).toBeGreaterThanOrEqual(0)
      expect(p.correctIndex).toBeLessThan(4)
      expect(p.options[p.correctIndex]).toBeDefined()
    })
  })

  test('no duplicate puzzles (unique by emojiClue + options + correctIndex)', () => {
    const keys = new Set()
    const duplicates = []
    ALL_PUZZLES.forEach((p, i) => {
      const key = `${p.emojiClue}|${p.correctIndex}|${p.options.join(',')}`
      if (keys.has(key)) duplicates.push({ index: i, key: key.slice(0, 60) })
      else keys.add(key)
    })
    expect(duplicates).toHaveLength(0)
  })

  test('category is movie or actor', () => {
    ALL_PUZZLES.forEach(p => {
      expect(['movie', 'actor']).toContain(p.category)
    })
  })

  test('difficulty is easy, medium, or hard', () => {
    ALL_PUZZLES.forEach(p => {
      expect(['easy', 'medium', 'hard']).toContain(p.difficulty)
    })
  })

  test('getPuzzlesByDifficulty returns only that difficulty', () => {
    const easy = getPuzzlesByDifficulty('easy')
    const medium = getPuzzlesByDifficulty('medium')
    const hard = getPuzzlesByDifficulty('hard')
    easy.forEach(p => expect(p.difficulty).toBe('easy'))
    medium.forEach(p => expect(p.difficulty).toBe('medium'))
    hard.forEach(p => expect(p.difficulty).toBe('hard'))
  })

  test('generateSessionPuzzles returns 10 unique puzzles', () => {
    const session = generateSessionPuzzles('easy', 10)
    expect(session.length).toBe(10)
    const seen = new Set()
    session.forEach(p => {
      const key = p.emojiClue + p.options.join('|')
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    })
  })

  test('generateSessionPuzzles no repeated correct answer in session', () => {
    const session = generateSessionPuzzles('medium', 10)
    const correctAnswers = session.map(p => p.options[p.correctIndex])
    const unique = new Set(correctAnswers)
    expect(unique.size).toBe(correctAnswers.length)
  })
})
