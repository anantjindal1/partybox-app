/**
 * Polish questions.json via Groq API.
 *
 * For each question, the model will:
 *  1. DISABLE trivial/boring/obscure questions (flag disabled: true)
 *  2. ADD or IMPROVE the explanation field — must be surprising, teach something
 *  3. REWRITE dull questions into fun/surprising versions where possible
 *
 * Run: node scripts/polishQuestions.js
 * Requires GROQ_API_KEY env var or pass via CLI: GROQ_API_KEY=... node scripts/polishQuestions.js
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const QUESTIONS_PATH = path.join(ROOT, 'src/data/questions.json')
const BACKUP_PATH = path.join(ROOT, 'src/data/questions.backup.json')
const PROGRESS_PATH = path.join(ROOT, 'src/data/questions.progress.json')

const BATCH_SIZE = 5
const DELAY_MS = 15000      // 15s between batches to stay under 6k TPM
const RATE_LIMIT_WAIT_MS = 60000
const MODEL = 'llama-3.1-8b-instant'

const SYSTEM_PROMPT = `You are editing a party trivia game for Indian adults aged 18-40.

Input: JSON array with fields: i (index), q (question), a (answer), exp (current explanation).

Output: JSON array, one object per input, always with ALL three fields: i, disabled, explanation.

DISABLED RULE — set disabled:true for questions that are:
(a) Embarrassingly obvious: every Indian knows the answer without thinking. Examples that MUST be disabled:
    "What is the capital of India?" → DISABLE
    "Which is the national bird of India?" → DISABLE
    "How many runs is a six worth?" → DISABLE
    "Which festival is known as the festival of lights?" → DISABLE
    "What is paneer made from?" → DISABLE
    "Who was the first Prime Minister of India?" → DISABLE
(b) Too specialist: only a professor or historian would know. Examples:
    "Which article of the constitution abolished untouchability?" → DISABLE
    "Who designed the Indian national flag?" → DISABLE

Set disabled:false for questions that are interesting, surprising, or require real thought.

EXPLANATION RULE — always write 1-2 sentences. Reveal something surprising or counterintuitive. Casual tone. Do NOT start with "Wow" or restate the answer.

Do NOT include a "question" field.`

async function callGroq(miniBatch, apiKey) {
  // Send only the fields the model needs — saves ~60% tokens
  const input = miniBatch.map((q, i) => ({
    i,
    q: q.question,
    a: q.correctAnswer,
    exp: q.explanation || ''
  }))

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(input) },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    }),
  })

  if (res.status === 429) return { rateLimited: true }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Groq ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty response from Groq')
  return { content }
}

function parseJsonArray(text) {
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON array found')
  return JSON.parse(text.slice(start, end + 1))
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function processBatch(batch, apiKey, idx, total) {
  let content

  const result = await callGroq(batch, apiKey)
  if (result.rateLimited) {
    console.log(`  Rate limited — waiting ${RATE_LIMIT_WAIT_MS / 1000}s...`)
    await sleep(RATE_LIMIT_WAIT_MS)
    const retry = await callGroq(batch, apiKey)
    if (retry.rateLimited) throw new Error('Rate limited on retry')
    content = retry.content
  } else {
    content = result.content
  }

  try {
    const deltas = parseJsonArray(content)
    if (!Array.isArray(deltas)) throw new Error('Not an array')
    // Merge deltas back into original batch — never touch question text
    const result = batch.map((q, i) => {
      const delta = deltas.find(d => d.i === i)
      if (!delta) return q
      return {
        ...q,
        ...(delta.disabled === true ? { disabled: true } : {}),
        ...(delta.explanation ? { explanation: delta.explanation } : {}),
      }
    })
    return result
  } catch (e) {
    console.warn(`  Batch ${idx + 1}/${total}: parse failed (${e.message}) — keeping originals`)
    return batch
  }
}

async function loadProgress() {
  try {
    const raw = await fs.readFile(PROGRESS_PATH, 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function main() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.error('Missing GROQ_API_KEY. Run: GROQ_API_KEY=your_key node scripts/polishQuestions.js')
    process.exit(1)
  }

  const raw = await fs.readFile(QUESTIONS_PATH, 'utf8')
  const questions = JSON.parse(raw)
  console.log(`Loaded ${questions.length} questions`)

  // Check for in-progress run
  const progress = await loadProgress()
  let startBatch = 0
  let results = []

  if (progress && progress.total === questions.length) {
    startBatch = progress.completedBatches
    results = progress.results
    console.log(`Resuming from batch ${startBatch + 1} (${results.length} questions already done)`)
  } else {
    // Fresh run — back up original
    await fs.writeFile(BACKUP_PATH, raw, 'utf8')
    console.log(`Backed up original to questions.backup.json`)
  }

  const batches = []
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    batches.push(questions.slice(i, i + BATCH_SIZE))
  }
  const total = batches.length
  const remaining = total - startBatch
  const estMins = Math.ceil((remaining * DELAY_MS) / 60000) + remaining

  console.log(`\n${total} batches of ${BATCH_SIZE} | ~${estMins} min remaining`)
  console.log(`Model: ${MODEL}\n`)

  for (let i = startBatch; i < batches.length; i++) {
    const batch = batches[i]
    process.stdout.write(`Batch ${i + 1}/${total}... `)

    try {
      const polished = await processBatch(batch, apiKey, i, total)
      const disabled = polished.filter(q => q.disabled).length
      const withExp = polished.filter(q => q.explanation?.trim().length > 10).length
      console.log(`done (${disabled} disabled, ${withExp}/${batch.length} have explanations)`)
      results.push(...polished)
    } catch (err) {
      console.error(`\nBatch ${i + 1} failed: ${err.message}`)
      console.log('Saving progress and stopping. Re-run to resume.')
      await fs.writeFile(PROGRESS_PATH, JSON.stringify({
        total: questions.length,
        completedBatches: i,
        results,
      }), 'utf8')
      process.exit(1)
    }

    // Save progress after every batch
    await fs.writeFile(PROGRESS_PATH, JSON.stringify({
      total: questions.length,
      completedBatches: i + 1,
      results,
    }), 'utf8')

    if (i < batches.length - 1) await sleep(DELAY_MS)
  }

  // Write final output
  await fs.writeFile(QUESTIONS_PATH, JSON.stringify(results, null, 2), 'utf8')

  // Clean up progress file
  await fs.unlink(PROGRESS_PATH).catch(() => {})

  const totalDisabled = results.filter(q => q.disabled).length
  const totalWithExp = results.filter(q => q.explanation?.trim().length > 10).length

  console.log(`
=== Done ===
Total questions: ${results.length}
Disabled (boring/obscure): ${totalDisabled}
With good explanations: ${totalWithExp}
Original backed up at: src/data/questions.backup.json`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
