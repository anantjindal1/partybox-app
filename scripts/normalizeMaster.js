// Remaps category names and validates questions/master.json, writing clean output to questions/normalized.json.
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const CATEGORY_MAP = {
  // → gk
  gk:                'gk',
  general_knowledge: 'gk',
  india_gk:          'gk',
  indian_history:    'gk',
  india_politics:    'gk',
  modern:            'gk',
  world_geography:   'gk',
  cities:            'gk',
  business:          'gk',
  law_cases:         'gk',
  world_history:     'gk',
  geography:         'gk',
  religion:          'gk',
  india_economy:     'gk',
  europe:            'gk',
  world:             'gk',

  // → bollywood
  bollywood:         'bollywood',
  cinema:            'bollywood',
  cinema_india:      'bollywood',

  // → cricket (includes all sports)
  cricket:           'cricket',
  sports:            'cricket',

  // → science
  science:           'science',
  technology:        'science',
  space:             'science',
  health:            'science',
  science_traps:     'science',

  // → food
  food:              'food',
  weird_facts:       'food',

  // → brain
  brain:             'brain',
  mind_blown:        'brain',
  quotes:            'brain',
  art_culture:       'brain',
}

const VALID_CATEGORIES = new Set(['gk', 'bollywood', 'cricket', 'science', 'food', 'modern', 'brain'])

async function main() {
  // 1. Load
  const raw = JSON.parse(await readFile(path.join(ROOT, 'questions', 'master.json'), 'utf8'))
  console.log(`Loaded ${raw.length} questions from master.json`)

  // 2. Process
  const seen = new Set()
  const skipped = {
    wrong_option_count:    [],
    answer_not_in_options: [],
    question_too_short:    [],
    duplicate:             [],
  }
  const normalized = []

  for (const q of raw) {
    const category = CATEGORY_MAP[q.category] ?? q.category

    if (!Array.isArray(q.options) || q.options.length !== 4) {
      skipped.wrong_option_count.push(q.question)
      continue
    }
    if (!q.options.includes(q.correctAnswer)) {
      skipped.answer_not_in_options.push(q.question)
      continue
    }
    if (!q.question || q.question.trim().length < 10) {
      skipped.question_too_short.push(q.question)
      continue
    }
    const key = q.question.trim().toLowerCase()
    if (seen.has(key)) {
      skipped.duplicate.push(q.question)
      continue
    }
    seen.add(key)

    normalized.push({
      category,
      question:     q.question.trim(),
      options:      q.options,
      correctAnswer: q.correctAnswer,
      explanation:  q.explanation ?? '',
      difficulty:   ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
      tags:         Array.isArray(q.tags) ? q.tags : [],
    })
  }

  // 3. Write
  await writeFile(
    path.join(ROOT, 'questions', 'normalized.json'),
    JSON.stringify(normalized, null, 2)
  )

  // 4. Report
  const totalSkipped = Object.values(skipped).reduce((s, a) => s + a.length, 0)

  console.log('\n=== Normalize Report ===')
  console.log(`Input:   ${raw.length}`)
  console.log(`Output:  ${normalized.length}  (passed validation)`)
  console.log(`Skipped: ${totalSkipped}`)

  console.log('\nSkip reasons:')
  const maxKeyLen = Math.max(...Object.keys(skipped).map(k => k.length))
  for (const [reason, items] of Object.entries(skipped)) {
    console.log(`  ${reason.padEnd(maxKeyLen)}  ${items.length}`)
  }

  // By category
  const byCat = {}
  for (const q of normalized) {
    if (!byCat[q.category]) byCat[q.category] = { total: 0, easy: 0, medium: 0, hard: 0 }
    byCat[q.category].total++
    byCat[q.category][q.difficulty]++
  }

  const sortedCats = Object.entries(byCat).sort((a, b) => b[1].total - a[1].total)
  const maxCatLen = Math.max(...sortedCats.map(([c]) => c.length))

  console.log('\nBy category (sorted by count):')
  for (const [cat, counts] of sortedCats) {
    const flag = VALID_CATEGORIES.has(cat) ? '' : ' ⚠ unknown'
    console.log(`  ${cat.padEnd(maxCatLen)}  ${String(counts.total).padStart(4)}${flag}`)
  }

  console.log('\nDifficulty breakdown:')
  for (const [cat, counts] of sortedCats) {
    console.log(
      `  ${cat.padEnd(maxCatLen)}  easy: ${String(counts.easy).padStart(3)}  medium: ${String(counts.medium).padStart(3)}  hard: ${String(counts.hard).padStart(3)}`
    )
  }

  // Warn about any unknown categories that slipped through
  const unknownCats = sortedCats.filter(([c]) => !VALID_CATEGORIES.has(c))
  if (unknownCats.length > 0) {
    console.log('\n⚠  Unknown categories in output (not in CATEGORY_MAP):')
    for (const [cat, counts] of unknownCats) {
      console.log(`  ${cat}  (${counts.total} questions)`)
    }
  }

  console.log('\nDone. Output written to questions/normalized.json')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
