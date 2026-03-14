/**
 * Fetch questions from Open Trivia DB API (https://opentdb.com) and write to
 * questions/raw/otdb_fetched.json. Merge script will pick these up.
 * Run: node scripts/fetchOtdb.js
 * Uses long delays and retries to avoid rate limits (429). Saves after each batch.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'questions/raw/otdb_fetched.json');

const CATEGORIES = [9, 10, 11, 17, 18, 21, 22, 23, 24, 25, 12, 14, 15, 20, 26, 27, 28, 19, 30, 16];
const PER_CATEGORY = 50;
const DELAY_MS = 5000;
const RETRY_DELAY_MS = 30000;

async function fetchPage(amount = 50, category) {
  const url = new URL('https://opentdb.com/api.php');
  url.searchParams.set('amount', amount);
  url.searchParams.set('category', category);
  url.searchParams.set('type', 'multiple');
  const res = await fetch(url.toString());
  if (res.status === 429) throw new Error('HTTP 429');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.response_code !== 0) return [];
  return data.results || [];
}

async function main() {
  let all = [];
  try {
    const existing = await fs.readFile(OUT, 'utf8').then((d) => JSON.parse(d).results || []).catch(() => []);
    all = existing;
  } catch {
    // start fresh
  }
  const seen = new Set(all.map((q) => (q.question || '').toLowerCase().trim()));
  const targetTotal = 1000;
  let requests = 0;
  while (all.length < targetTotal && requests < 40) {
    const category = CATEGORIES[requests % CATEGORIES.length];
    try {
      const batch = await fetchPage(PER_CATEGORY, category);
      for (const q of batch) {
        const key = (q.question || '').toLowerCase().trim();
        if (key && !seen.has(key)) {
          seen.add(key);
          all.push(q);
        }
      }
      console.log(`Fetched batch; total unique: ${all.length}`);
      await fs.writeFile(OUT, JSON.stringify({ results: all }, null, 2), 'utf8');
    } catch (e) {
      if (e.message === 'HTTP 429') {
        console.log('Rate limited; waiting 30s...');
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      throw e;
    }
    requests++;
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  console.log(`Done. ${all.length} questions in ${OUT}`);
}

main().catch(console.error);
