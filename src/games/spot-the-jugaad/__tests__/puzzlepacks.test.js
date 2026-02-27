/**
 * Spot the Jugaad puzzlepacks tests.
 * - 4 items per puzzle
 * - correctIndex valid (0-3)
 * - No duplicate puzzles in session
 */

import { getPuzzlesByDifficulty, generateSessionPuzzles, ALL_PUZZLES } from '../puzzlepacks'

describe('puzzlepacks', () => {
  test('every puzzle has exactly 4 items', () => {
    ALL_PUZZLES.forEach(p => {
      expect(Array.isArray(p.items)).toBe(true)
      expect(p.items.length).toBe(4)
    })
  })

  test('correctIndex is valid (0-3)', () => {
    ALL_PUZZLES.forEach(p => {
      expect(Number.isInteger(p.correctIndex)).toBe(true)
      expect(p.correctIndex).toBeGreaterThanOrEqual(0)
      expect(p.correctIndex).toBeLessThan(4)
    })
  })

  test('no duplicate puzzles in session', () => {
    for (const diff of ['easy', 'medium', 'hard']) {
      const puzzles = generateSessionPuzzles(diff, 10)
      expect(puzzles.length).toBe(10)
      const keys = new Set(puzzles.map(p => p.items.join('|') + '|' + p.correctIndex))
      expect(keys.size).toBe(puzzles.length)
    }
  })

  test('getPuzzlesByDifficulty returns only that difficulty', () => {
    const easy = getPuzzlesByDifficulty('easy')
    const medium = getPuzzlesByDifficulty('medium')
    const hard = getPuzzlesByDifficulty('hard')
    expect(easy.every(p => p.difficulty === 'easy')).toBe(true)
    expect(medium.every(p => p.difficulty === 'medium')).toBe(true)
    expect(hard.every(p => p.difficulty === 'hard')).toBe(true)
  })

  test('at least 150 puzzles total', () => {
    expect(ALL_PUZZLES.length).toBeGreaterThanOrEqual(150)
  })
})
