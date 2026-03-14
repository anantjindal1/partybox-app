/**
 * Merge 2000 new questions into src/data/questions.json from:
 * - questions/normalized.json (unique, not already in questions.json)
 * - questions/raw/otdb_*.json (convert schema, map category)
 * - scripts/pool-2000.json + inline pool from generateAndMerge2000
 * Dedup by question text; target 50% easy, 35% medium, 15% hard.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const QUESTIONS_JSON = path.join(ROOT, 'src/data/questions.json');

const ALLOWED_CATEGORIES = new Set([
  'general_knowledge', 'india_politics', 'indian_history', 'bollywood', 'cricket',
  'sports', 'science', 'science_traps', 'space', 'world_geography', 'cities',
  'quotes', 'law_cases', 'mind_blown', 'weird_facts', 'food', 'technology', 'business'
]);

const NORM_CATEGORY_MAP = {
  gk: 'general_knowledge',
  brain: 'mind_blown',
  bollywood: 'bollywood',
  cricket: 'cricket',
  science: 'science',
  food: 'food',
  general_knowledge: 'general_knowledge',
  world_geography: 'world_geography',
  technology: 'technology',
  sports: 'sports',
  business: 'business',
  mind_blown: 'mind_blown',
  quotes: 'quotes',
  india_politics: 'india_politics',
  indian_history: 'indian_history',
  space: 'space',
  cities: 'cities',
  law_cases: 'law_cases',
  weird_facts: 'weird_facts',
  science_traps: 'science_traps',
};

const OTDB_CATEGORY_MAP = {
  'General Knowledge': 'general_knowledge',
  'Geography': 'world_geography',
  'Science': 'science',
  'Sports': 'sports',
  'Technology': 'technology',
  'Art': 'general_knowledge',
  'History': 'general_knowledge',
  'Entertainment': 'general_knowledge',
  'Politics': 'general_knowledge',
  'World History': 'general_knowledge',
  'Art & Culture': 'general_knowledge',
  'Science & Nature': 'science',
  'Science: Computers': 'technology',
  'Science: Mathematics': 'science',
  'Science: Gadgets': 'technology',
  'Entertainment: Books': 'general_knowledge',
  'Entertainment: Film': 'general_knowledge',
  'Entertainment: Music': 'general_knowledge',
  'Entertainment: Television': 'general_knowledge',
  'Entertainment: Video Games': 'technology',
  'Entertainment: Board Games': 'general_knowledge',
  'Mythology': 'general_knowledge',
  'Celebrities': 'general_knowledge',
  'Animals': 'science',
  'Vehicles': 'technology',
  'Entertainment: Comics': 'general_knowledge',
  'Entertainment: Japanese Anime & Manga': 'general_knowledge',
  'Entertainment: Cartoon & Animations': 'general_knowledge',
};

function decodeHtmlEntities(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normToQuestion(q) {
  const cat = NORM_CATEGORY_MAP[q.category] || 'general_knowledge';
  if (!ALLOWED_CATEGORIES.has(cat)) return null;
  const wrong = (q.options || []).filter((o) => o !== q.correctAnswer).slice(0, 3);
  if (wrong.length < 3) return null;
  return {
    category: cat,
    question: (q.question || '').trim(),
    options: shuffle([q.correctAnswer, ...wrong]),
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || '',
    difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
    tags: Array.isArray(q.tags) ? q.tags : [cat],
  };
}

function otdbToQuestion(r) {
  const cat = OTDB_CATEGORY_MAP[r.category] || 'general_knowledge';
  const correct = decodeHtmlEntities(r.correct_answer || '');
  const incorrect = (r.incorrect_answers || []).map(decodeHtmlEntities);
  if (!correct || incorrect.length < 3) return null;
  const opts = shuffle([correct, ...incorrect.slice(0, 3)]);
  const diff = (r.difficulty || 'medium').toLowerCase();
  const difficulty = ['easy', 'medium', 'hard'].includes(diff) ? diff : 'medium';
  return {
    category: cat,
    question: decodeHtmlEntities((r.question || '').trim()),
    options: opts,
    correctAnswer: correct,
    explanation: '',
    difficulty,
    tags: [cat],
  };
}

async function loadNormalizedCandidates(existingSet) {
  const raw = JSON.parse(await fs.readFile(path.join(ROOT, 'questions/normalized.json'), 'utf8'));
  const out = [];
  for (const q of raw) {
    const key = (q.question || '').toLowerCase().trim();
    if (!key || existingSet.has(key)) continue;
    const mapped = normToQuestion(q);
    if (mapped) out.push(mapped);
  }
  return out;
}

async function loadOtdbCandidates(existingSet) {
  const rawDir = path.join(ROOT, 'questions/raw');
  const files = (await fs.readdir(rawDir)).filter((f) => f.startsWith('otdb_') && f.endsWith('.json'));
  const out = [];
  for (const f of files) {
    const data = JSON.parse(await fs.readFile(path.join(rawDir, f), 'utf8'));
    const results = data.results || [];
    for (const r of results) {
      const key = (r.question || '').toLowerCase().trim();
      if (!key || existingSet.has(key)) continue;
      const mapped = otdbToQuestion(r);
      if (mapped) out.push(mapped);
    }
  }
  return out;
}

async function loadPoolCandidates(existingSet) {
  const { buildQuestionPool, loadExtendedPool } = await import('./generateAndMerge2000.js');
  const inline = buildQuestionPool();
  const extended = await loadExtendedPool();
  const pool = [...inline, ...extended];
  const out = [];
  for (const q of pool) {
    const key = (q.question || '').toLowerCase().trim();
    if (!key || existingSet.has(key)) continue;
    if (!ALLOWED_CATEGORIES.has(q.category)) continue;
    out.push(q);
  }
  return out;
}

async function main() {
  const existingRaw = await fs.readFile(QUESTIONS_JSON, 'utf8');
  const existing = JSON.parse(existingRaw);
  if (!Array.isArray(existing)) throw new Error('questions.json must be an array');
  const existingSet = new Set(existing.map((q) => (q.question || '').toLowerCase().trim()));
  console.log(`Existing questions: ${existing.length}`);

  const [fromNorm, fromOtdb, fromPool] = await Promise.all([
    loadNormalizedCandidates(existingSet),
    loadOtdbCandidates(existingSet),
    loadPoolCandidates(existingSet),
  ]);
  console.log(`From normalized: ${fromNorm.length}`);
  console.log(`From OTDB raw: ${fromOtdb.length}`);
  console.log(`From pool: ${fromPool.length}`);

  const seen = new Set(existingSet);
  const candidates = [];
  for (const q of [...fromNorm, ...fromOtdb, ...fromPool]) {
    const key = (q.question || '').toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    candidates.push(q);
  }
  console.log(`Unique new candidates: ${candidates.length}`);

  const TARGET = 2000;
  let toAdd = candidates.length >= TARGET ? candidates.slice(0, TARGET) : candidates;

  const easy = toAdd.filter((q) => q.difficulty === 'easy');
  const medium = toAdd.filter((q) => q.difficulty === 'medium');
  const hard = toAdd.filter((q) => q.difficulty === 'hard');
  console.log(`Selected: Easy ${easy.length}, Medium ${medium.length}, Hard ${hard.length}`);

  const merged = [...existing, ...toAdd];
  await fs.writeFile(QUESTIONS_JSON, JSON.stringify(merged, null, 2), 'utf8');
  console.log(`\nAdded ${toAdd.length} new questions. New total: ${merged.length}`);
  console.log(`Written to ${QUESTIONS_JSON}`);
}

main().catch(console.error);
