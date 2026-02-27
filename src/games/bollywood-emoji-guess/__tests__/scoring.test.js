/**
 * Bollywood Emoji Guess scoring tests.
 * Speed bonus, streak bonus, XP logic.
 */
import { calculateQuestionScore, calculateSessionXP } from '../scoring'

describe('bollywood-emoji-guess scoring', () => {
  test('base correct = 10', () => {
    expect(calculateQuestionScore(15000, 0)).toBe(10)
  })

  test('speed bonus < 5s = +5', () => {
    expect(calculateQuestionScore(4000, 0)).toBe(10 + 5)
  })

  test('speed bonus < 8s = +3', () => {
    expect(calculateQuestionScore(6000, 0)).toBe(10 + 3)
  })

  test('speed bonus < 12s = +1', () => {
    expect(calculateQuestionScore(10000, 0)).toBe(10 + 1)
  })

  test('speed bonus >= 12s = 0', () => {
    expect(calculateQuestionScore(12000, 0)).toBe(10)
    expect(calculateQuestionScore(15000, 0)).toBe(10)
  })

  test('streak bonus: 3 consecutive correct = +5', () => {
    expect(calculateQuestionScore(4000, 2)).toBe(10 + 5 + 5)
  })

  test('streak bonus: 2 consecutive correct = 0', () => {
    expect(calculateQuestionScore(4000, 1)).toBe(10 + 5)
  })

  test('XP: +2 per correct', () => {
    expect(calculateSessionXP(50, 5)).toBe(5 * 2)
  })

  test('XP: +5 if session score > 80', () => {
    expect(calculateSessionXP(85, 8)).toBe(8 * 2 + 5)
  })

  test('XP: no bonus if score <= 80', () => {
    expect(calculateSessionXP(80, 8)).toBe(8 * 2)
    expect(calculateSessionXP(79, 8)).toBe(8 * 2)
  })
})
