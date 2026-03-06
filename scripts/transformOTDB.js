// Transforms raw OTDB JSON files into normalized format and writes to questions/transformed/otdb_transformed.json.
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.resolve(__dirname, '../questions/raw');
const OUT_DIR = path.resolve(__dirname, '../questions/transformed');
const OUT_FILE = path.join(OUT_DIR, 'otdb_transformed.json');

function shuffleOptions(correct, incorrects) {
  const arr = [correct, ...incorrects];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function categoryFromFilename(filename) {
  // otdb_general_knowledge_easy.json → general_knowledge
  const base = path.basename(filename, '.json');          // otdb_general_knowledge_easy
  const withoutPrefix = base.replace(/^otdb_/, '');       // general_knowledge_easy
  const withoutDifficulty = withoutPrefix.replace(/_(easy|medium|hard)$/, '');
  return withoutDifficulty;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const files = await fs.readdir(RAW_DIR);
  const rawFiles = files.filter(f => f.startsWith('otdb_') && f.endsWith('.json'));

  const allQuestions = [];
  const seenQuestions = new Set();

  for (const file of rawFiles) {
    const filePath = path.join(RAW_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const { results } = JSON.parse(content);
    const category = categoryFromFilename(file);

    for (const q of results) {
      if (seenQuestions.has(q.question)) continue;
      seenQuestions.add(q.question);
      allQuestions.push({
        category,
        question: q.question,
        options: shuffleOptions(q.correct_answer, q.incorrect_answers),
        correctAnswer: q.correct_answer,
        explanation: '',
        difficulty: q.difficulty,
        tags: [category],
        source: 'opentdb',
        verified: false,
      });
    }
  }

  await fs.writeFile(OUT_FILE, JSON.stringify(allQuestions, null, 2));

  // Summary by category
  const counts = {};
  for (const q of allQuestions) {
    counts[q.category] = (counts[q.category] ?? 0) + 1;
  }

  console.log(`\nTransformed ${allQuestions.length} questions total`);
  console.log('\nBreakdown by category:');
  for (const [cat, count] of Object.entries(counts).sort()) {
    console.log(`  ${cat}: ${count}`);
  }
  console.log(`\nWrote: ${OUT_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
