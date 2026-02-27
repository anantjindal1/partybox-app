/**
 * Desi Memory Master scoring tests.
 * Score calculation, bonuses, XP logic.
 */
import { calculateFinalScore, calculateXP } from '../scoring'

describe('desi-memory-master scoring', () => {
  test('Score calculation: base 100 - (time + mistakes*2)', () => {
    const { score } = calculateFinalScore(0, 0)
    expect(score).toBe(100 + 20 + 30) // base 100 + under 30s bonus 20 + zero mistakes 30
  })

  test('Score with time and mistakes only, no bonuses', () => {
    const { score, timeBonus, zeroMistakesBonus } = calculateFinalScore(40, 5)
    expect(timeBonus).toBe(false)
    expect(zeroMistakesBonus).toBe(false)
    expect(score).toBe(Math.max(0, 100 - (40 + 5 * 2))) // 100 - 50 = 50
  })

  test('Time bonus applied when under 30 sec', () => {
    const { score, timeBonus } = calculateFinalScore(25, 0)
    expect(timeBonus).toBe(true)
    expect(score).toBe(100 - 25 + 20 + 30) // base 75 + time 20 + zero 30 = 125
  })

  test('Zero mistakes bonus applied', () => {
    const { score, zeroMistakesBonus } = calculateFinalScore(35, 0)
    expect(zeroMistakesBonus).toBe(true)
    expect(score).toBe(Math.max(0, 100 - 35) + 30) // 65 + 30 = 95
  })

  test('Score never negative', () => {
    const { score } = calculateFinalScore(200, 50)
    expect(score).toBeGreaterThanOrEqual(0)
  })

  test('calculateXP: +5 completion, +10 personal best', () => {
    expect(calculateXP(false)).toBe(5)
    expect(calculateXP(true)).toBe(15)
  })
})
