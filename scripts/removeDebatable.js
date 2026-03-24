/**
 * Remove debatable / scientifically-contested questions from questions.json via Groq API.
 * Processes in batches of 100. Returns flagged question texts → removes matches.
 * Requires: GROQ_API_KEY in .env
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const QUESTIONS_PATH = path.join(ROOT, 'src/data/questions.json');
const REMOVED_PATH = path.join(ROOT, 'tools/removed_debatable.json');
const BATCH_SIZE = 100;
const DELAY_MS = 1200;
const RATE_LIMIT_WAIT_MS = 6000;
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are reviewing trivia questions for a quiz game. \
Flag any question where the correct answer could be reasonably debated, \
disputed by mainstream science, depends on interpretation, or where multiple \
options could be argued as correct.

Return ONLY a JSON array of question texts that should be removed. \
No explanation, no markdown.`;

// ── Helpers ────────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  return fs.readFile(envPath, 'utf8').then((content) => {
    for (const line of content.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) {
        const v = m[2].trim().replace(/^["']|["']$/g, '');
        process.env[m[1].trim()] = v;
      }
    }
  }).catch(() => {});
}

function parseJsonArray(raw) {
  let cleaned = raw.trim();
  const jsonStart = cleaned.indexOf('[');
  const jsonEnd = cleaned.lastIndexOf(']');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
  }
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('Response is not a JSON array');
  return parsed;
}

async function callGroq(questionTexts, apiKey) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(questionTexts) },
    ],
    temperature: 0.1,
    max_tokens: 8000,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (res.status === 429) return { rateLimited: true };
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in Groq response');
  return { content };
}

async function processBatch(batch, apiKey, batchIndex, totalBatches) {
  const questionTexts = batch.map(q => q.question);

  let content;
  const result = await callGroq(questionTexts, apiKey);
  if (result.rateLimited) {
    console.log(`  Rate limited — waiting ${RATE_LIMIT_WAIT_MS / 1000}s...`);
    await new Promise(r => setTimeout(r, RATE_LIMIT_WAIT_MS));
    const retry = await callGroq(questionTexts, apiKey);
    if (retry.rateLimited) throw new Error('Rate limited after retry');
    content = retry.content;
  } else {
    content = result.content;
  }

  let flaggedTexts;
  try {
    flaggedTexts = parseJsonArray(content);
  } catch (e) {
    console.warn(`  Batch ${batchIndex + 1}/${totalBatches}: JSON parse failed — skipping. ${e.message}`);
    return { kept: batch, flagged: [] };
  }

  // Normalise to lowercase for matching
  const flaggedSet = new Set(flaggedTexts.map(t => (t || '').toLowerCase().trim()));

  const kept = [];
  const flagged = [];
  for (const q of batch) {
    const norm = (q.question || '').toLowerCase().trim();
    if (flaggedSet.has(norm)) {
      flagged.push(q);
    } else {
      kept.push(q);
    }
  }

  return { kept, flagged };
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  await loadEnv();
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) { console.error('Missing GROQ_API_KEY in .env'); process.exit(1); }

  const raw = await fs.readFile(QUESTIONS_PATH, 'utf8');
  const questions = JSON.parse(raw);
  if (!Array.isArray(questions)) { console.error('questions.json must be an array'); process.exit(1); }

  const totalBatches = Math.ceil(questions.length / BATCH_SIZE);
  console.log(`Reviewing ${questions.length} questions in ${totalBatches} batches of ${BATCH_SIZE}…`);

  const allKept = [];
  const allFlagged = [];
  const startTime = Date.now();

  for (let i = 0; i < totalBatches; i++) {
    const batch = questions.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    try {
      const { kept, flagged } = await processBatch(batch, apiKey, i, totalBatches);
      allKept.push(...kept);
      allFlagged.push(...flagged);
      console.log(`Batch ${i + 1}/${totalBatches} — flagged ${flagged.length} of ${batch.length}`);
    } catch (err) {
      console.error(`Batch ${i + 1} failed: ${err.message} — keeping batch as-is`);
      allKept.push(...batch);
    }
    if (i < totalBatches - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  await fs.writeFile(QUESTIONS_PATH, JSON.stringify(allKept, null, 2), 'utf8');
  await fs.writeFile(REMOVED_PATH, JSON.stringify(allFlagged, null, 2), 'utf8');

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`
=== removeDebatable report ===
Total reviewed:       ${questions.length}
Flagged and removed:  ${allFlagged.length}
Remaining:            ${allKept.length}
Time taken:           ${elapsed} min

Sample removed questions (first 10):`);
  allFlagged.slice(0, 10).forEach((q, i) => console.log(`  ${i + 1}. ${q.question}`));
  console.log(`\nWritten: ${QUESTIONS_PATH}\nRemoved saved: ${REMOVED_PATH}`);
}

main().catch(err => { console.error(err); process.exit(1); });
