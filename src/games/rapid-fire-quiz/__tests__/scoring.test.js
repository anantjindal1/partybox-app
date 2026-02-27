/**
 * Tez Dimaag Challenge scoring tests.
 * Speed bonus, streak bonus, tie breaker, calculatePlayerXP.
 */
import { calculateQuestionScore, calculateWinner, calculatePlayerXP } from '../scoring'

describe('rapid-fire-quiz scoring', () => {
  test('base correct = 10', () => {
    expect(calculateQuestionScore(10000, 0)).toBe(10)
  })

  test('speed bonus < 3s = +5', () => {
    expect(calculateQuestionScore(2000, 0)).toBe(15)
  })

  test('speed bonus < 5s = +3', () => {
    expect(calculateQuestionScore(4000, 0)).toBe(13)
  })

  test('speed bonus < 8s = +1', () => {
    expect(calculateQuestionScore(7000, 0)).toBe(11)
  })

  test('speed bonus >= 8s = 0', () => {
    expect(calculateQuestionScore(8000, 0)).toBe(10)
  })

  test('streak bonus: 3 consecutive correct = +5', () => {
    expect(calculateQuestionScore(2000, 2)).toBe(15 + 5)
  })

  test('calculateWinner: higher score wins', () => {
    const players = [
      { id: '1', name: 'A', score: 30, correctCount: 3, responseTimes: [1000, 2000, 3000] },
      { id: '2', name: 'B', score: 50, correctCount: 5, responseTimes: [1000, 2000, 3000, 4000, 5000] }
    ]
    expect(calculateWinner(players)).toBe(1)
  })

  test('calculateWinner: tie breaker correctCount', () => {
    const players = [
      { id: '1', name: 'A', score: 40, correctCount: 3, responseTimes: [1000, 2000, 3000] },
      { id: '2', name: 'B', score: 40, correctCount: 4, responseTimes: [1000, 2000, 3000, 4000] }
    ]
    expect(calculateWinner(players)).toBe(1)
  })

  test('calculateWinner: tie breaker avg response time', () => {
    const players = [
      { id: '1', name: 'A', score: 30, correctCount: 3, responseTimes: [5000, 5000, 5000] },
      { id: '2', name: 'B', score: 30, correctCount: 3, responseTimes: [1000, 2000, 3000] }
    ]
    expect(calculateWinner(players)).toBe(1)
  })

  test('calculatePlayerXP: +2 per correct, +3 winner', () => {
    expect(calculatePlayerXP(5, true)).toBe(5 * 2 + 3)
    expect(calculatePlayerXP(3, false)).toBe(3 * 2)
  })
})
