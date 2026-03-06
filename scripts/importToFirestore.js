/**
 * scripts/importToFirestore.js
 *
 * Imports questions/master.json into Firestore at /questions/{auto-id}.
 * Options are Fisher-Yates shuffled per document; correctAnswer string is preserved.
 * Already-imported questions (matched by question text) are skipped.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json node scripts/importToFirestore.js
 *
 * Requires:
 *   npm install --save-dev firebase-admin
 *   Service account JSON from Firebase Console → Project Settings → Service Accounts
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ─── Init ─────────────────────────────────────────────────────────────────────

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS env var not set.');
  console.error('Example: GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json node scripts/importToFirestore.js');
  process.exit(1);
}

initializeApp({ credential: cert(credPath) });
const db = getFirestore();

// ─── Shuffle ──────────────────────────────────────────────────────────────────

function shuffleOptions(q) {
  const options = [...q.options];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  // correctAnswer string stays the same; its position in options has shifted
  return { ...q, options };
}

// ─── Load existing questions (dedup) ─────────────────────────────────────────

async function loadExistingQuestions() {
  console.log('Fetching existing questions from Firestore...');
  const snap = await db.collection('questions').select('question').get();
  const seen = new Set();
  for (const doc of snap.docs) {
    const text = doc.data().question;
    if (text) seen.add(text.trim().toLowerCase());
  }
  console.log(`Found ${seen.size} existing questions in Firestore.`);
  return seen;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const masterPath = path.join(ROOT, 'questions', 'master.json');
  const questions = JSON.parse(await readFile(masterPath, 'utf8'));
  console.log(`Loaded ${questions.length} questions from master.json.`);

  const existingKeys = await loadExistingQuestions();

  const BATCH_SIZE = 500;
  let batch = db.batch();
  let batchCount = 0;
  let imported = 0;
  let skipped = 0;
  const byCategory = {};

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const key = q.question.trim().toLowerCase();

    if (existingKeys.has(key)) {
      skipped++;
      continue;
    }

    const shuffled = shuffleOptions(q);
    const ref = db.collection('questions').doc();
    batch.set(ref, {
      ...shuffled,
      timesShown: 0,
      timesCorrect: 0,
      createdAt: Timestamp.now(),
    });

    byCategory[q.category] = (byCategory[q.category] ?? 0) + 1;
    batchCount++;
    imported++;

    if (imported % 100 === 0) {
      console.log(`Progress: ${i + 1}/${questions.length} processed — ${imported} imported, ${skipped} skipped`);
    }

    if (batchCount === BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
  }

  // ─── Report ────────────────────────────────────────────────────────────────
  const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  console.log('\n=== Import Report ===');
  console.log(`Total imported:  ${imported}`);
  console.log(`Total skipped:   ${skipped}  (duplicates already in Firestore)`);
  console.log('\nBy category:');
  for (const [cat, count] of sortedCats) {
    console.log(`  ${cat.padEnd(25)} ${count}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
