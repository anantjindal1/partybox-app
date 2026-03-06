/**
 * Tez Dimaag Challenge — question packs.
 * Thin adapter over the shared FirstBell question bank.
 *
 * Remaps:
 *   correctIdx  → correctIndex
 *   short category key → display category string
 *
 * Original format: { category, difficulty, question, options[4], correctIdx }
 * Adapted format:  { category, difficulty, question, options[4], correctIndex }
 */

import { ALL_QUESTIONS } from '../firstbell/questions.js'

const CATEGORY_MAP = {
  gk:       'India GK',
  bollywood:'Bollywood & OTT',
  cricket:  'Cricket',
  science:  'Science',
  food:     'Food & Daily Life',
  modern:   'Modern India',
  brain:    'Brain Teasers',
}

const CATEGORIES = [
  'Bollywood & OTT',
  'Cricket',
  'India GK',
  'Food & Daily Life',
  'Modern India',
  'Brain Teasers',
]

// Adapted questions with Tez Dimaag field names
const ADAPTED_QUESTIONS = ALL_QUESTIONS.map(q => ({
  ...q,
  category: CATEGORY_MAP[q.category] ?? q.category,
  correctIndex: q.correctIdx,
}))

function shuffleArray(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function byCategory(cat) {
  return ADAPTED_QUESTIONS.filter(q => q.category === cat)
}

export function getCategories() {
  return [...CATEGORIES]
}

export function getQuestionsByCategory(category) {
  return byCategory(category)
}

/**
 * Generate `count` unique shuffled questions for a round in the given category.
 */
export function generateRoundQuestions(category, count = 5) {
  const pool = byCategory(category)
  return shuffleArray(pool).slice(0, count)
}

export { ADAPTED_QUESTIONS as ALL_QUESTIONS }
