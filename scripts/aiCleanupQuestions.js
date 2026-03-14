/**
 * AI-powered cleanup of questions.json via Groq API.
 * Filters for quality and India-audience relevance in batches of 50.
 * Requires: GROQ_API_KEY in .env
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const QUESTIONS_PATH = path.join(ROOT, 'src/data/questions.json');
const REMOVED_PATH = path.join(ROOT, 'tools/ai_removed_questions.json');
const BATCH_SIZE = 50;
const DELAY_MS = 1000;
const RATE_LIMIT_WAIT_MS = 5000;
const MODEL = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `
You are reviewing a trivia question dataset for a 
multiplayer quiz game.

Target audience: India-based players aged 18–50, 
mostly low/middle income households. Questions should 
feel familiar, fun, and culturally relevant to 
Indian audiences.

Your tasks:

1. REMOVE questions that are not relevant, including:
   - US-centric politics, geography, or culture
   - Niche Western pop culture not known in India
   - Obscure scientific trivia casual players won't know
   - Questions too academic or technical
   - Unfamiliar foreign names/places unless globally famous
   - Questions unlikely to be recognized by Indian players

2. KEEP questions about:
   - India GK, Indian history, Bollywood, Cricket
   - Well-known sports (FIFA, Olympics, tennis)
   - World geography (major countries, rivers, mountains)
   - Science facts taught in Indian schools
   - Mind-blowing but widely known facts
   - Weird facts that are easy to understand
   - Famous global figures (Einstein, Gandhi, etc.)
   - Commonly known global trivia

3. REMOVE questions that:
   - Have weak or confusing options
   - Have obviously correct answers (too easy to guess)
   - Are poorly written or ambiguous
   - Contain factual uncertainty
   - Repeat the same concept as another question in the batch

4. If a question is good but wording is awkward, 
   improve the wording slightly.

5. Ensure options are:
   - Same category/type as each other
   - Similar length
   - Plausible distractors (not obviously wrong)

6. Ensure correctAnswer appears exactly in options.

7. Do NOT add new questions.

Return ONLY a valid JSON array of questions that should 
remain. No explanation, no markdown, no preamble.
Just the raw JSON array.
`;

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

function normalizeQuestionText(q) {
  return (q.question || '').toLowerCase().trim();
}

function findRemovedFromBatch(batch, keptFromApi) {
  const keptSet = new Set(keptFromApi.map((k) => normalizeQuestionText(k)));
  return batch.filter((b) => !keptSet.has(normalizeQuestionText(b)));
}

function parseJsonResponse(text) {
  const raw = text.trim();
  let cleaned = raw;
  const jsonStart = raw.indexOf('[');
  const jsonEnd = raw.lastIndexOf(']');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = raw.slice(jsonStart, jsonEnd + 1);
  }
  return JSON.parse(cleaned);
}

async function callGroq(batch, apiKey) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(batch) },
    ],
    temperature: 0.2,
    max_tokens: 16000,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (res.status === 429) {
    return { rateLimited: true };
  }
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
  let content;
  const result = await callGroq(batch, apiKey);
  if (result.rateLimited) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_WAIT_MS));
    const retry = await callGroq(batch, apiKey);
    if (retry.rateLimited) throw new Error('Rate limited after retry');
    content = retry.content;
  } else {
    content = result.content;
  }
  try {
    const kept = parseJsonResponse(content);
    if (!Array.isArray(kept)) throw new Error('Response is not an array');
    const removed = findRemovedFromBatch(batch, kept);
    return { kept, removed };
  } catch (e) {
    console.warn(`Batch ${batchIndex + 1}/${totalBatches}: JSON parse failed — keeping original batch. Error: ${e.message}`);
    return { kept: batch, removed: [] };
  }
}

function waitForContinue() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('Press Enter to continue (Ctrl+C to cancel)...', () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  await loadEnv();
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('Missing GROQ_API_KEY in .env');
    process.exit(1);
  }

  const raw = await fs.readFile(QUESTIONS_PATH, 'utf8');
  const questions = JSON.parse(raw);
  if (!Array.isArray(questions)) {
    console.error('questions.json must be an array');
    process.exit(1);
  }

  const batches = [];
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    batches.push(questions.slice(i, i + BATCH_SIZE));
  }
  const totalBatches = batches.length;

  console.log(`
Processing ${questions.length} questions in ${totalBatches} batches of ${BATCH_SIZE}
Estimated time: ~${totalBatches} minutes
Groq free tier — should cost $0

Press Enter to continue (Ctrl+C to cancel).`);
  try {
    await waitForContinue();
  } catch {
    process.exit(0);
  }

  const allKept = [];
  const allRemoved = [];
  const batchRemovedCounts = [];
  const startTime = Date.now();
  let failedAt = null;

  for (let i = 0; i < batches.length; i++) {
    try {
      const { kept, removed } = await processBatch(batches[i], apiKey, i, totalBatches);
      allKept.push(...kept);
      allRemoved.push(...removed);
      batchRemovedCounts.push(removed.length);
      console.log(`Batch ${i + 1}/${totalBatches} — kept ${kept.length} of ${batches[i].length}`);
    } catch (err) {
      console.error(`Batch ${i + 1} failed:`, err.message);
      console.error('Keeping unprocessed batches; saving partial results.');
      failedAt = i;
      for (let j = i; j < batches.length; j++) {
        allKept.push(...batches[j]);
      }
      break;
    }
    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  await fs.mkdir(path.dirname(REMOVED_PATH), { recursive: true });
  await fs.writeFile(QUESTIONS_PATH, JSON.stringify(allKept, null, 2), 'utf8');
  await fs.writeFile(REMOVED_PATH, JSON.stringify(allRemoved, null, 2), 'utf8');

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  if (failedAt != null) {
    console.log('\nPartial results saved. Re-run after fixing API/network.');
  }
  console.log(`
=== AI Cleanup report ===
Total input: ${questions.length}
Total kept: ${allKept.length}
Total removed: ${allRemoved.length}
Removed per batch: ${batchRemovedCounts.join(', ')}
Time taken: ${elapsed} minutes

Written: ${QUESTIONS_PATH}
Removed saved: ${REMOVED_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
