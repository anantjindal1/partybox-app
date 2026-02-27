/**
 * Dynamic math question generation for Tez Hisab.
 * Division always integer; 4 options; correct randomly positioned; no repeat in session.
 * Target: generation < 20ms.
 */

const DIFFICULTY_RANGES = {
  easy: { add: [1, 20], sub: [1, 20], mul: [2, 9], div: [2, 5], pct: [10, 50] },
  medium: { add: [1, 50], sub: [1, 50], mul: [2, 12], div: [2, 10], pct: [5, 75] },
  hard: { add: [1, 100], sub: [1, 100], mul: [3, 15], div: [3, 12], pct: [1, 99] }
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffleArray(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Plausible wrong options: correct ± offsets, no duplicates, include correct */
function makeOptions(correct, count = 4) {
  const opts = [correct]
  const used = new Set([correct])
  const offsets = [-10, -5, -2, -1, 1, 2, 5, 10]
  while (opts.length < count) {
    const o = offsets[Math.floor(Math.random() * offsets.length)]
    const v = correct + o
    if (Number.isInteger(v) && v >= 0 && !used.has(v)) {
      used.add(v)
      opts.push(v)
    }
  }
  const shuffled = shuffleArray(opts)
  const correctIndex = shuffled.indexOf(correct)
  return { options: shuffled, correctIndex }
}

function generateAddition(difficulty) {
  const [min, max] = DIFFICULTY_RANGES[difficulty].add
  const a = randInt(min, max)
  const b = randInt(min, max)
  const answer = a + b
  return { question: `${a} + ${b} = ?`, answer, a, b }
}

function generateSubtraction(difficulty) {
  const [min, max] = DIFFICULTY_RANGES[difficulty].sub
  const a = randInt(min, max)
  const b = randInt(min, max)
  const [x, y] = a >= b ? [a, b] : [b, a]
  const answer = x - y
  return { question: `${x} − ${y} = ?`, answer, x, y }
}

function generateMultiplication(difficulty) {
  const [min, max] = DIFFICULTY_RANGES[difficulty].mul
  const a = randInt(min, max)
  const b = randInt(min, max)
  const answer = a * b
  return { question: `${a} × ${b} = ?`, answer, a, b }
}

/** Division: divisor and quotient chosen so dividend = divisor * quotient (integer result) */
function generateDivision(difficulty) {
  const [min, max] = DIFFICULTY_RANGES[difficulty].div
  const divisor = randInt(min, max)
  const quotient = randInt(1, Math.min(12, Math.floor(100 / divisor)))
  const dividend = divisor * quotient
  const answer = quotient
  return { question: `${dividend} ÷ ${divisor} = ?`, answer, dividend, divisor }
}

function generatePercentage(difficulty) {
  const [min, max] = DIFFICULTY_RANGES[difficulty].pct
  const pct = randInt(min, max)
  const of = randInt(2, difficulty === 'easy' ? 20 : difficulty === 'medium' ? 50 : 100)
  const answer = Math.round((pct / 100) * of)
  return { question: `${pct}% of ${of} = ?`, answer, pct, of }
}

/** Short word problem: e.g. "3 baskets, 5 apples each" */
function generateWordProblem(difficulty) {
  const types = [
    () => {
      const n = randInt(2, 9)
      const each = randInt(2, 10)
      const answer = n * each
      return { question: `${n} baskets, ${each} apples each. Total apples?`, answer }
    },
    () => {
      const total = randInt(10, 50)
      const people = randInt(2, 5)
      const answer = Math.floor(total / people)
      return { question: `${total} sweets shared among ${people} friends. Each gets?`, answer }
    },
    () => {
      const a = randInt(5, 30)
      const b = randInt(5, 30)
      return { question: `Ravi has ${a} marbles. Priya has ${b}. Together?`, answer: a + b }
    }
  ]
  const fn = types[Math.floor(Math.random() * types.length)]
  return fn()
}

const GENERATORS = [
  generateAddition,
  generateSubtraction,
  generateMultiplication,
  generateDivision,
  generatePercentage,
  generateWordProblem
]

/**
 * Generate a single question. Returns { question, options, correctIndex }.
 * @param {'easy'|'medium'|'hard'} difficulty
 */
export function generateQuestion(difficulty) {
  const gen = GENERATORS[Math.floor(Math.random() * GENERATORS.length)]
  const { question, answer } = gen(difficulty)
  const { options, correctIndex } = makeOptions(answer, 4)
  return { question, options, correctIndex }
}

/**
 * Generate a session of unique questions (no two identical).
 * @param {'easy'|'medium'|'hard'} difficulty
 * @param {number} count default 15
 */
export function generateSessionQuestions(difficulty, count = 15) {
  const seen = new Set()
  const out = []
  let attempts = 0
  const maxAttempts = count * 50
  while (out.length < count && attempts < maxAttempts) {
    attempts++
    const q = generateQuestion(difficulty)
    const key = `${q.question}|${q.options.join(',')}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(q)
  }
  if (out.length < count) {
    while (out.length < count) {
      const q = generateQuestion(difficulty)
      out.push(q)
    }
  }
  return out
}
