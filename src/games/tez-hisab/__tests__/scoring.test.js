/**
 * Tez Hisab scoring tests (TC-42, TC-43).
 */

import { calculateQuestionScore, calculateSessionXP } from '../scoring'

describe('scoring', () => {
  test('TC-42: base 10 + speed bonus correct', () => {
    expect(calculateQuestionScore(2000, 0)).toBe(10 + 5)
    expect(calculateQuestionScore(4000, 0)).toBe(10 + 3)
    expect(calculateQuestionScore(6000, 0)).toBe(10 + 1)
    expect(calculateQuestionScore(8000, 0)).toBe(10 + 0)
  })

  test('TC-43: streak bonus +5 for every 3 correct streak', () => {
    expect(calculateQuestionScore(2000, 0)).toBe(15)
    expect(calculateQuestionScore(2000, 1)).toBe(15)
    expect(calculateQuestionScore(2000, 2)).toBe(15 + 5)
    expect(calculateQuestionScore(2000, 3)).toBe(15)
    expect(calculateQuestionScore(2000, 4)).toBe(15)
    expect(calculateQuestionScore(2000, 5)).toBe(15 + 5)
  })

  test('XP: +2 per correct, +5 if 12+ correct', () => {
    expect(calculateSessionXP(0)).toBe(0)
    expect(calculateSessionXP(5)).toBe(10)
    expect(calculateSessionXP(11)).toBe(22)
    expect(calculateSessionXP(12)).toBe(24 + 5)
    expect(calculateSessionXP(15)).toBe(30 + 5)
  })
})
