/**
 * scripts/mergeAllQuestions.js
 *
 * Merges all question sources into questions/master.json.
 * Run: node scripts/mergeAllQuestions.js
 */

import { readFile, mkdir, writeFile } from 'fs/promises';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── Normalizers ─────────────────────────────────────────────────────────────

function normalizeFirstbell(q) {
  return {
    category: q.category,
    question: q.question,
    options: q.options,
    correctAnswer: q.options[q.correctIdx],
    explanation: '',
    difficulty: q.difficulty,
    tags: [q.category],
    source: 'manual',
    verified: true,
  };
}

function normalizeCorrectAnswer(q, source) {
  return {
    category: q.category,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation ?? '',
    difficulty: q.difficulty,
    tags: q.tags ?? [q.category],
    source,
    verified: false,
  };
}

function normalizeOtdb(q) {
  return { ...q, explanation: q.explanation ?? '' };
}

// ─── Dedup ────────────────────────────────────────────────────────────────────

const seen = new Set();
let dupesRemoved = 0;
const out = [];

function tryAdd(q) {
  const key = q.question.trim().toLowerCase();
  if (seen.has(key)) { dupesRemoved++; return; }
  seen.add(key);
  out.push(q);
}

// ─── Load helpers ─────────────────────────────────────────────────────────────

async function readJSON(filePath) {
  const text = await readFile(filePath, 'utf8');
  return JSON.parse(text);
}

async function readRawJSArray(filePath) {
  // SampleQuestions.js contains a raw JSON array (no export keyword).
  // Strip any leading/trailing non-JSON content and parse.
  const text = await readFile(filePath, 'utf8');
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error(`No JSON array found in ${filePath}`);
  return JSON.parse(text.slice(start, end + 1));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. FirstBell (verified: true, source: manual) — dynamic import
  try {
    const { ALL_QUESTIONS } = await import(
      path.join(ROOT, 'src/games/firstbell/questions.js')
    );
    let count = 0;
    for (const q of ALL_QUESTIONS) {
      tryAdd(normalizeFirstbell(q));
      count++;
    }
    console.log(`FirstBell: loaded ${count} questions.`);
  } catch (e) {
    console.error('Failed to load firstbell/questions.js:', e.message);
  }

  // 2. SampleQuestions.js (source: ai-generated)
  try {
    const questions = await readRawJSArray(path.join(ROOT, 'SampleQuestions.js'));
    let count = 0;
    for (const q of questions) {
      tryAdd(normalizeCorrectAnswer(q, 'ai-generated'));
      count++;
    }
    console.log(`SampleQuestions.js: loaded ${count} questions.`);
  } catch (e) {
    console.error('Failed to load SampleQuestions.js:', e.message);
  }

  // 3. Batch500_v2.json (source: ai-generated)
  try {
    const questions = await readJSON(path.join(ROOT, 'Batch500_v2.json'));
    let count = 0;
    for (const q of questions) {
      tryAdd(normalizeCorrectAnswer(q, 'ai-generated'));
      count++;
    }
    console.log(`Batch500_v2.json: loaded ${count} questions.`);
  } catch (e) {
    console.error('Failed to load Batch500_v2.json:', e.message);
  }

  // 4. New500Batch.json (source: ai-generated)
  try {
    const questions = await readJSON(path.join(ROOT, 'New500Batch.json'));
    let count = 0;
    for (const q of questions) {
      tryAdd(normalizeCorrectAnswer(q, 'ai-generated'));
      count++;
    }
    console.log(`New500Batch.json: loaded ${count} questions.`);
  } catch (e) {
    console.error('Failed to load New500Batch.json:', e.message);
  }

  // 5. otdb_transformed.json (already canonical)
  try {
    const questions = await readJSON(
      path.join(ROOT, 'questions/transformed/otdb_transformed.json')
    );
    let count = 0;
    for (const q of questions) {
      tryAdd(normalizeOtdb(q));
      count++;
    }
    console.log(`otdb_transformed.json: loaded ${count} questions.`);
  } catch (e) {
    console.warn('otdb_transformed.json not found or invalid — skipping.');
  }

  // ─── Write output ────────────────────────────────────────────────────────
  const outDir = path.join(ROOT, 'questions');
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, 'master.json');
  await writeFile(outPath, JSON.stringify(out, null, 2), 'utf8');

  // ─── Report ──────────────────────────────────────────────────────────────
  const byCategory = {};
  const byDifficulty = { easy: 0, medium: 0, hard: 0 };
  const bySource = {};
  let missingExplanation = 0;

  for (const q of out) {
    byCategory[q.category] = (byCategory[q.category] ?? 0) + 1;
    if (q.difficulty in byDifficulty) byDifficulty[q.difficulty]++;
    bySource[q.source] = (bySource[q.source] ?? 0) + 1;
    if (!q.explanation) missingExplanation++;
  }

  const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  console.log('\n=== Merge Report ===');
  console.log(`Total questions:      ${out.length}`);
  console.log(`Duplicates removed:   ${dupesRemoved}  (includes pre-seeded existing_questions.json)`);

  console.log('\nBy category (sorted by count desc):');
  for (const [cat, count] of sortedCats) {
    console.log(`  ${cat.padEnd(25)} ${count}`);
  }

  console.log('\nBy difficulty:');
  for (const [diff, count] of Object.entries(byDifficulty)) {
    console.log(`  ${diff.padEnd(10)} ${count}`);
  }

  console.log('\nBy source:');
  for (const [src, count] of Object.entries(bySource)) {
    console.log(`  ${src.padEnd(15)} ${count}`);
  }

  console.log(`\nQuestions missing explanation: ${missingExplanation}`);
  console.log(`\nWritten to: ${outPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
