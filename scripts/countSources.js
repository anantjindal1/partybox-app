import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const questionsPath = path.join(__dirname, '../src/data/questions.json');
const existing = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
const existingSet = new Set(existing.map((q) => (q.question || '').toLowerCase().trim()));
console.log('questions.json total:', existing.length);

// Normalized
const norm = JSON.parse(fs.readFileSync(path.join(__dirname, '../questions/normalized.json'), 'utf8'));
const fromNorm = norm.filter((x) => {
  const t = (x.question || '').toLowerCase().trim();
  return t && !existingSet.has(t) && Array.isArray(x.options) && x.options.length === 4 && x.correctAnswer;
});
console.log('From normalized (new):', fromNorm.length);

// SampleQuestions - it's JSON array in a .js file
const samplePath = path.join(__dirname, '../SampleQuestions.js');
const sampleRaw = fs.readFileSync(samplePath, 'utf8');
let sampleArr;
try {
  sampleArr = JSON.parse(sampleRaw);
} catch (_) {
  const stripped = sampleRaw.replace(/\/\/[^\n]*/g, '').replace(/,(\s*[}\]])/g, '$1');
  sampleArr = JSON.parse(stripped);
}
const fromSample = sampleArr.filter((x) => {
  const t = (x.question || '').toLowerCase().trim();
  return t && !existingSet.has(t) && Array.isArray(x.options) && x.options.length === 4 && x.correctAnswer;
});
console.log('From SampleQuestions.js (new):', fromSample.length);

// Combined unique
const combinedSet = new Set(existingSet);
const combined = [];
for (const x of fromNorm) {
  const t = (x.question || '').toLowerCase().trim();
  if (!combinedSet.has(t)) {
    combinedSet.add(t);
    combined.push(x);
  }
}
for (const x of fromSample) {
  const t = (x.question || '').toLowerCase().trim();
  if (!combinedSet.has(t)) {
    combinedSet.add(t);
    combined.push(x);
  }
}
console.log('Combined unique new (normalized + sample):', combined.length);
