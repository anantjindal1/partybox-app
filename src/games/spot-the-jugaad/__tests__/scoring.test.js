/**
 * Spot the Jugaad scoring tests.
 * - Speed bonus correct
 * - Streak bonus correct
 * - XP logic correct (totalScore > 80)
 */

import { calculatePuzzleScore, calculateSessionXP } from '../scoring'

describe('scoring', () => {
  test('base 10 + speed bonus: <3s +5, <6s +3, <9s +1', () => {
    expect(calculatePuzzleScore(2000, 0)).toBe(10 + 5)
    expect(calculatePuzzleScore(5000, 0)).toBe(10 + 3)
    expect(calculatePuzzleScore(8000, 0)).toBe(10 + 1)
    expect(calculatePuzzleScore(10000, 0)).toBe(10 + 0)
  })

  test('streak bonus +5 for every 3 consecutive correct', () => {
    expect(calculatePuzzleScore(2000, 0)).toBe(15)
    expect(calculatePuzzleScore(2000, 1)).toBe(15)
    expect(calculatePuzzleScore(2000, 2)).toBe(15 + 5)
    expect(calculatePuzzleScore(2000, 3)).toBe(15)
    expect(calculatePuzzleScore(2000, 5)).toBe(15 + 5)
  })

  test('XP: +2 per correct, +5 if totalScore > 80', () => {
    expect(calculateSessionXP(50, 5)).toBe(5 * 2)
    expect(calculateSessionXP(80, 8)).toBe(8 * 2)
    expect(calculateSessionXP(81, 8)).toBe(8 * 2 + 5)
    expect(calculateSessionXP(100, 10)).toBe(10 * 2 + 5)
  })
})
