/**
 * Tez Hisab question generator tests (TC-39, TC-40, TC-41).
 */

import { generateQuestion, generateSessionQuestions } from '../questionGenerator'

describe('questionGenerator', () => {
  test('TC-39: generateQuestion produces valid arithmetic with 4 options and correctIndex', () => {
    const q = generateQuestion('easy')
    expect(q).toBeDefined()
    expect(typeof q.question).toBe('string')
    expect(q.question.length).toBeGreaterThan(0)
    expect(Array.isArray(q.options)).toBe(true)
    expect(q.options.length).toBe(4)
    expect(Number.isInteger(q.correctIndex)).toBe(true)
    expect(q.correctIndex).toBeGreaterThanOrEqual(0)
    expect(q.correctIndex).toBeLessThan(4)
    expect(q.options[q.correctIndex]).toBeDefined()
  })

  test('TC-40: division never produces decimals', () => {
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion('easy')
      if (!q.question.includes('÷')) continue
      const correctAnswer = q.options[q.correctIndex]
      expect(Number.isInteger(correctAnswer)).toBe(true)
    }
  })

  test('TC-41: no repeated question within session', () => {
    const questions = generateSessionQuestions('easy', 15)
    expect(questions.length).toBe(15)
    const keys = questions.map(q => `${q.question}|${q.options.join(',')}`)
    const unique = new Set(keys)
    expect(unique.size).toBe(questions.length)
  })

  test('options length === 4 and correctIndex in range', () => {
    for (const diff of ['easy', 'medium', 'hard']) {
      const q = generateQuestion(diff)
      expect(q.options.length).toBe(4)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(4)
    }
  })
})
