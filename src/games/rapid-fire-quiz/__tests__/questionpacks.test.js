/**
 * Tez Dimaag Challenge questionpacks tests.
 * 4 options per question, correctIndex valid, no duplicates, generateRoundQuestions returns 5 unique.
 */
import { getCategories, getQuestionsByCategory, generateRoundQuestions, ALL_QUESTIONS } from '../questionpacks'

describe('rapid-fire-quiz questionpacks', () => {
  test('getCategories returns 6 categories', () => {
    const cats = getCategories()
    expect(cats).toHaveLength(6)
    expect(cats).toContain('Bollywood & OTT')
    expect(cats).toContain('Cricket')
    expect(cats).toContain('India GK')
    expect(cats).toContain('Food & Daily Life')
    expect(cats).toContain('Modern India')
    expect(cats).toContain('Brain Teasers')
  })

  test('every question has exactly 4 options', () => {
    ALL_QUESTIONS.forEach(q => {
      expect(Array.isArray(q.options)).toBe(true)
      expect(q.options.length).toBe(4)
    })
  })

  test('correctIndex is valid (0-3)', () => {
    ALL_QUESTIONS.forEach(q => {
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(4)
      expect(q.options[q.correctIndex]).toBeDefined()
    })
  })

  test('no duplicate questions (unique question text)', () => {
    const texts = new Set()
    ALL_QUESTIONS.forEach(q => {
      expect(texts.has(q.question)).toBe(false)
      texts.add(q.question)
    })
  })

  test('getQuestionsByCategory returns questions for that category', () => {
    const cricket = getQuestionsByCategory('Cricket')
    expect(cricket.length).toBeGreaterThan(0)
    cricket.forEach(q => expect(q.category).toBe('Cricket'))
  })

  test('generateRoundQuestions returns 5 unique questions', () => {
    const round = generateRoundQuestions('India GK', 5)
    expect(round.length).toBe(5)
    const texts = new Set(round.map(q => q.question))
    expect(texts.size).toBe(5)
  })
})
