// Fetches raw trivia questions from Open Trivia DB API and saves to questions/raw/. Run once to seed raw data.
import fetch from 'node-fetch';
import he from 'he';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.resolve(__dirname, '../questions/raw');

const CATEGORIES = [
  { id: 9,  name: 'general_knowledge' },
  { id: 17, name: 'science' },
  { id: 18, name: 'technology' },
  { id: 22, name: 'geography' },
  { id: 23, name: 'world_history' },
  { id: 21, name: 'sports' },
  { id: 11, name: 'art_culture' },
  { id: 12, name: 'art_culture' },
  { id: 20, name: 'art_culture' },
  { id: 24, name: 'politics' },
  { id: 19, name: 'mathematics' },
];

const DIFFICULTIES = ['easy', 'medium', 'hard'];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function decodeQuestion(q) {
  return {
    ...q,
    question: he.decode(q.question),
    correct_answer: he.decode(q.correct_answer),
    incorrect_answers: q.incorrect_answers.map(a => he.decode(a)),
  };
}

async function getToken() {
  const res = await fetch('https://opentdb.com/api_token.php?command=request');
  const data = await res.json();
  return data.token;
}

async function resetToken(token) {
  const res = await fetch(`https://opentdb.com/api_token.php?command=reset&token=${token}`);
  await res.json();
}

async function fetchQuestions(categoryId, difficulty, token) {
  const url = `https://opentdb.com/api.php?amount=50&category=${categoryId}&difficulty=${difficulty}&type=multiple&token=${token}`;
  const res = await fetch(url);
  return res.json();
}

async function readExistingRaw(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function mergeAndWrite(filePath, newResults) {
  const existing = await readExistingRaw(filePath);
  let merged = newResults;

  if (existing && Array.isArray(existing.results)) {
    const seen = new Set(existing.results.map(q => q.question));
    const deduped = newResults.filter(q => !seen.has(q.question));
    merged = [...existing.results, ...deduped];
  }

  await fs.writeFile(filePath, JSON.stringify({ results: merged }, null, 2));
  return merged.length;
}

async function main() {
  await fs.mkdir(RAW_DIR, { recursive: true });

  let token = await getToken();
  console.log('Got session token.');

  const requests = [];
  for (const cat of CATEGORIES) {
    for (const diff of DIFFICULTIES) {
      requests.push({ cat, diff });
    }
  }

  for (let i = 0; i < requests.length; i++) {
    const { cat, diff } = requests[i];
    const filePath = path.join(RAW_DIR, `otdb_${cat.name}_${diff}.json`);

    let data = await fetchQuestions(cat.id, diff, token);

    if (data.response_code === 4) {
      console.log(`Token exhausted for ${cat.name}/${diff}, resetting...`);
      await resetToken(token);
      data = await fetchQuestions(cat.id, diff, token);
    }

    if (data.response_code === 1) {
      console.warn(`No results for ${cat.name}/${diff}, skipping.`);
    } else if (data.response_code === 0) {
      const decoded = data.results.map(decodeQuestion);
      const total = await mergeAndWrite(filePath, decoded);
      console.log(`Fetched ${decoded.length} questions: ${cat.name}/${diff} (file total: ${total})`);
    } else {
      console.warn(`Unexpected response_code ${data.response_code} for ${cat.name}/${diff}`);
    }

    if (i < requests.length - 1) {
      await sleep(5000);
    }
  }

  console.log('Done fetching.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
