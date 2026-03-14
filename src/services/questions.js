import allQuestionsRaw from '../data/questions.json'
import { getQuestions } from '../games/firstbell/questions'

// Log category counts once on module load
const categoryCounts = allQuestionsRaw.reduce((acc, q) => {
  acc[q.category] = (acc[q.category] ?? 0) + 1
  return acc
}, {})
console.log('[questions] Available per category:', categoryCounts)

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function normalizeQuestion(q) {
  const correct = q.correctAnswer
  const shuffled = shuffle([...q.options])
  return {
    ...q,
    options: shuffled,
    correctIdx: shuffled.indexOf(correct),
  }
}

export function fetchGameQuestions({ category, count = 7 }) {
  // Filter by category
  let pool = allQuestionsRaw.filter(q => q.category === category && !q.disabled)

  // If category is 'random' or pool is empty, use all active questions
  if (category === 'random' || pool.length === 0) {
    pool = allQuestionsRaw.filter(q => !q.disabled)
  }

  // Fall back to static firstbell questions if normalized.json has no coverage
  if (pool.length < count) {
    const staticQuestions = getQuestions(category === 'random' ? null : category, count * 3)
    const staticNormalized = staticQuestions.map(q => ({
      category: q.category,
      question: q.question,
      options: q.options,
      correctAnswer: q.options[q.correctIdx],
      explanation: '',
      difficulty: q.difficulty ?? 'medium',
      tags: [],
    }))
    pool = [...pool, ...staticNormalized]
  }

  // Separate by difficulty
  const easy   = pool.filter(q => q.difficulty === 'easy')
  const medium = pool.filter(q => q.difficulty === 'medium')
  const hard   = pool.filter(q => q.difficulty === 'hard')

  const pick = (arr, n) => shuffle([...arr]).slice(0, n)

  // Pick 3 easy, 3 medium, 1 hard
  let selected = [
    ...pick(easy, 3),
    ...pick(medium, 3),
    ...pick(hard, 1),
  ]

  // If we don't have enough, fill remainder from full pool
  if (selected.length < count) {
    const usedIds = new Set(selected.map(q => q.question))
    const remaining = shuffle(pool.filter(q => !usedIds.has(q.question)))
    selected = [...selected, ...remaining.slice(0, count - selected.length)]
  }

  // Shuffle final order and compute correctIdx from correctAnswer
  return shuffle(selected).map(q => normalizeQuestion(q))
}
