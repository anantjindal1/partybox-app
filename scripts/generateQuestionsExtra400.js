/**
 * Generate 400 extra trivia questions from existing local banks,
 * while aggressively filtering out "common pattern" prompts.
 *
 * Output: questions_extra.json (repo root)
 *
 * Notes / constraints (kept in code because this script is the contract):
 * - Avoid: capitals, chemical symbols, "produces the most", boilerplate trivia,
 *   and common IPL/cricket record questions.
 * - No "all of the above" / "none of the above"
 * - Options must be 4 unique strings and the correct answer must be present.
 * - Explanations must be informative (non-empty, non-trivial).
 * - Difficulty mix: 50% easy (200), 35% medium (140), 15% hard (60).
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUT_PATH = path.resolve(__dirname, '../questions_extra.json');
const SAMPLE_BANK_PATH = path.resolve(__dirname, '../SampleQuestions.js');

const EXISTING_TEXTS_PATHS = [
  path.resolve(__dirname, '../New500Batch.json'),
  path.resolve(__dirname, '../Batch500_v2.json'),
];

const DIFFICULTIES = /** @type {const} */ (['easy', 'medium', 'hard']);
const TARGET_COUNTS = { easy: 200, medium: 140, hard: 60 };

const ALLOWED_CATEGORIES = new Set([
  'general_knowledge',
  'india_politics',
  'indian_history',
  'bollywood',
  'cricket',
  'sports',
  'science',
  'science_traps',
  'space',
  'world_geography',
  'cities',
  'quotes',
  'law_cases',
  'mind_blown',
  'weird_facts',
  'food',
  'technology',
  'business',
]);

// "Common pattern" bans (case-insensitive). We intentionally go broad.
const BANNED_QUESTION_PATTERNS = [
  /\bwhat is the capital of\b/i,
  /\bcapital city of\b/i,
  /\bchemical symbol for\b/i,
  /\bwhich country produces the most\b/i,
  /\bwhich planet is closest to the sun\b/i,
  /\bboiling point of water\b/i,
  // Common trivia low-signal formats (not explicitly banned by user, but helps variety)
  /^\s*what does [a-z0-9\-]+ stand for\??\s*$/i,
  /^\s*who is known as\b/i,
];

// Avoid common IPL/cricket record prompt shapes.
const BANNED_CRICKET_PATTERNS = [
  /\bipl\b/i,
  /\bmost (runs|wickets|catches|centuries|sixes|fours)\b/i,
  /\bhighest (score|total)\b/i,
  /\bfastest (century|hundred|fifty|50)\b/i,
  /\brecord\b/i,
  /\binaugural\b/i,
  /\bworld cup\b/i,
];

const BANNED_OPTION_PATTERNS = [
  /\ball of the above\b/i,
  /\bnone of the above\b/i,
];

function normalizeText(s) {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function hasBannedOption(options) {
  return options.some(o => BANNED_OPTION_PATTERNS.some(rx => rx.test(o)));
}

function looksNumericLike(s) {
  // Accept years, numbers with commas, and simple units (keeps options "same type" check sane).
  const t = String(s ?? '').trim();
  if (t === '') return false;
  return /^-?\d[\d,]*(\.\d+)?(\s?(%|°c|°f|km|m|cm|mm|kg|g|years?|days?|hours?|mins?|minutes?|seconds?))?$/i.test(t);
}

function optionsAreSameType(options) {
  const numericFlags = options.map(looksNumericLike);
  const anyNumeric = numericFlags.some(Boolean);
  const allNumeric = numericFlags.every(Boolean);
  // If any option looks numeric-like, require all numeric-like (years, quantities, etc.)
  if (anyNumeric) return allNumeric;
  return true;
}

function uniqueOptions(options) {
  const seen = new Set();
  for (const o of options) {
    const k = normalizeText(o);
    if (seen.has(k)) return false;
    seen.add(k);
  }
  return true;
}

function isInformativeExplanation(expl) {
  const t = String(expl ?? '').trim();
  if (t.length < 25) return false;
  // Avoid placeholders.
  if (/^(n\/a|na|none|unknown|tbd)\.?$/i.test(t)) return false;
  return true;
}

function questionIsBanned(qText, category) {
  const qt = String(qText ?? '');
  if (BANNED_QUESTION_PATTERNS.some(rx => rx.test(qt))) return true;
  if (category === 'cricket' && BANNED_CRICKET_PATTERNS.some(rx => rx.test(qt))) return true;
  return false;
}

function sanitizeQuestion(raw) {
  // Keep only the requested schema fields.
  return {
    category: raw.category,
    question: raw.question,
    options: raw.options,
    correctAnswer: raw.correctAnswer,
    explanation: raw.explanation,
    difficulty: raw.difficulty,
    tags: Array.isArray(raw.tags) && raw.tags.length ? raw.tags : [raw.category],
  };
}

function isValidCandidate(q, existingQuestionSet) {
  if (!q || typeof q !== 'object') return false;

  if (!ALLOWED_CATEGORIES.has(q.category)) return false;
  if (!DIFFICULTIES.includes(q.difficulty)) return false;

  if (typeof q.question !== 'string' || q.question.trim().length < 12) return false;
  if (questionIsBanned(q.question, q.category)) return false;

  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  if (q.options.some(o => typeof o !== 'string' || o.trim() === '')) return false;
  if (!uniqueOptions(q.options)) return false;
  if (hasBannedOption(q.options)) return false;
  if (!optionsAreSameType(q.options)) return false;

  if (typeof q.correctAnswer !== 'string' || !q.options.includes(q.correctAnswer)) return false;
  if (!isInformativeExplanation(q.explanation)) return false;

  const normalized = normalizeText(q.question);
  if (existingQuestionSet.has(normalized)) return false;

  return true;
}

async function readJsonArrayMaybe(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function buildExistingQuestionTextSet() {
  const existing = new Set();

  // Existing shipped game questions (FirstBell bank).
  try {
    const modUrl = pathToFileURL(path.resolve(__dirname, '../src/games/firstbell/questions.js')).href;
    const mod = await import(modUrl);
    const bank = Array.isArray(mod.ALL_QUESTIONS) ? mod.ALL_QUESTIONS : [];
    for (const q of bank) {
      if (q && typeof q.question === 'string') existing.add(normalizeText(q.question));
    }
  } catch {
    // If import fails, we still proceed; we’ll rely on the other files.
  }

  // Existing generated batches (avoid duplicates with prior work).
  for (const p of EXISTING_TEXTS_PATHS) {
    const arr = await readJsonArrayMaybe(p);
    if (!arr) continue;
    for (const q of arr) {
      if (q && typeof q.question === 'string') existing.add(normalizeText(q.question));
    }
  }

  // Existing question text blacklist (these are known "too common").
  try {
    const content = await fs.readFile(path.resolve(__dirname, '../existing_questions.json'), 'utf-8');
    const arr = JSON.parse(content);
    if (Array.isArray(arr)) {
      for (const qText of arr) existing.add(normalizeText(qText));
    }
  } catch {
    // ignore
  }

  return existing;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function pickBalanced(candidates, targetCount) {
  const picked = [];
  const usedQuestions = new Set();
  const catCounts = Object.fromEntries([...ALLOWED_CATEGORIES].map(c => [c, 0]));

  // Pre-shuffle so we don't always bias early items.
  shuffleInPlace(candidates);

  while (picked.length < targetCount && candidates.length) {
    // Greedy: among the next window, pick the one whose category is currently least represented.
    const window = Math.min(250, candidates.length);
    let bestIdx = -1;
    let bestScore = Infinity;
    for (let i = 0; i < window; i++) {
      const q = candidates[i];
      const key = normalizeText(q.question);
      if (usedQuestions.has(key)) continue;
      const score = catCounts[q.category] ?? 0;
      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
        if (bestScore === 0) break;
      }
    }

    if (bestIdx === -1) break;

    const [chosen] = candidates.splice(bestIdx, 1);
    const key = normalizeText(chosen.question);
    usedQuestions.add(key);
    catCounts[chosen.category] = (catCounts[chosen.category] ?? 0) + 1;
    picked.push(chosen);
  }

  return picked;
}

async function main() {
  const existingSet = await buildExistingQuestionTextSet();

  const sampleContent = await fs.readFile(SAMPLE_BANK_PATH, 'utf-8');
  const sampleBank = JSON.parse(sampleContent);
  if (!Array.isArray(sampleBank)) {
    throw new Error(`SampleQuestions.js is not a JSON array: ${SAMPLE_BANK_PATH}`);
  }

  const sanitized = sampleBank.map(sanitizeQuestion);

  // Filter and partition.
  /** @type {Record<'easy'|'medium'|'hard', any[]>} */
  const buckets = { easy: [], medium: [], hard: [] };

  for (const q of sanitized) {
    if (isValidCandidate(q, existingSet)) buckets[q.difficulty].push(q);
  }

  // Pick with category balancing per difficulty.
  const pickedEasy = pickBalanced(buckets.easy, TARGET_COUNTS.easy);
  const pickedMedium = pickBalanced(buckets.medium, TARGET_COUNTS.medium);
  const pickedHard = pickBalanced(buckets.hard, TARGET_COUNTS.hard);

  const allPicked = [...pickedEasy, ...pickedMedium, ...pickedHard];

  if (allPicked.length !== (TARGET_COUNTS.easy + TARGET_COUNTS.medium + TARGET_COUNTS.hard)) {
    const counts = {
      easy: pickedEasy.length,
      medium: pickedMedium.length,
      hard: pickedHard.length,
      total: allPicked.length,
      available: {
        easy: buckets.easy.length,
        medium: buckets.medium.length,
        hard: buckets.hard.length,
      },
    };
    throw new Error(
      `Not enough candidates after filtering. Counts: ${JSON.stringify(counts, null, 2)}`
    );
  }

  // Final shuffle for gameplay variety.
  shuffleInPlace(allPicked);

  await fs.writeFile(OUT_PATH, JSON.stringify(allPicked, null, 2), 'utf-8');

  // Minimal summary for CLI usage.
  const diffCounts = { easy: 0, medium: 0, hard: 0 };
  for (const q of allPicked) diffCounts[q.difficulty]++;
  console.log(`Wrote ${allPicked.length} questions → ${OUT_PATH}`);
  console.log(`Difficulty counts: ${JSON.stringify(diffCounts)}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

