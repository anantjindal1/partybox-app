// Validates a question JSON file for schema correctness, required fields, and duplicates. Usage: node scripts/validateQuestions.js <file.json>
import fs from 'fs/promises';
import path from 'path';

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const REQUIRED_FIELDS = ['category', 'question', 'options', 'correctAnswer', 'difficulty'];

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/validateQuestions.js <path-to-json>');
    process.exit(1);
  }

  const content = await fs.readFile(path.resolve(filePath), 'utf-8');
  const questions = JSON.parse(content);

  const errors = [];
  const seenQuestions = new Map(); // question text → first index

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    // 1. Required fields
    for (const field of REQUIRED_FIELDS) {
      if (q[field] === undefined || q[field] === null) {
        errors.push(`[${i}] Missing required field: ${field}`);
      }
    }

    // 2. options is array of exactly 4 non-empty strings
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(`[${i}] options must be an array of exactly 4 items`);
    } else {
      for (let j = 0; j < q.options.length; j++) {
        if (typeof q.options[j] !== 'string' || q.options[j].trim() === '') {
          errors.push(`[${i}] options[${j}] must be a non-empty string`);
        }
      }
    }

    // 3. correctAnswer exists in options
    if (Array.isArray(q.options) && !q.options.includes(q.correctAnswer)) {
      errors.push(`[${i}] correctAnswer not found in options`);
    }

    // 4. valid difficulty
    if (q.difficulty !== undefined && !VALID_DIFFICULTIES.has(q.difficulty)) {
      errors.push(`[${i}] difficulty must be easy|medium|hard, got: ${q.difficulty}`);
    }

    // 5. question length > 10
    if (typeof q.question === 'string' && q.question.length <= 10) {
      errors.push(`[${i}] question too short (length ${q.question.length})`);
    }

    // 6. duplicate question text
    if (typeof q.question === 'string') {
      if (seenQuestions.has(q.question)) {
        errors.push(`[${i}] duplicate question (first seen at index ${seenQuestions.get(q.question)})`);
      } else {
        seenQuestions.set(q.question, i);
      }
    }
  }

  if (errors.length === 0) {
    console.log(`✅ PASS: ${questions.length} questions validated`);
  } else {
    for (const err of errors) {
      console.error(`❌ ${err}`);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
