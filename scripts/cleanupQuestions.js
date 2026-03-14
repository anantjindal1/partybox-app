/**
 * Filter src/data/questions.json for Indian audience (18–50, Hindi/English).
 * Keyword-based only — no AI/LLM. Removed questions written to tools/removed_questions.json.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const QUESTIONS_PATH = path.join(ROOT, 'src/data/questions.json');
const REMOVED_PATH = path.join(ROOT, 'tools/removed_questions.json');

// ─── REMOVE_KEYWORDS by category (for reporting) ───────────────────────────
const REMOVE_CATEGORIES = {
  'US geography': [
    'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
    'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
    'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana',
    'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota',
    'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
    'new hampshire', 'new jersey', 'new mexico', 'north carolina',
    'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania',
    'rhode island', 'south carolina', 'south dakota', 'tennessee',
    'texas', 'utah', 'vermont', 'virginia', 'west virginia',
    'wisconsin', 'wyoming', 'washington state', 'dallas',
    'capital of texas', 'capital of california', 'capital of florida',
    'iowa caucus', 'which us state', 'how many electoral votes',
  ],
  'US sports': [
    'nfl', 'nba', 'mlb', 'nhl', 'super bowl', 'nba finals', 'world series',
    'stanley cup', 'march madness', 'ncaa', 'american football',
    'baseball', 'ice hockey', 'lebron james', 'michael jordan',
    'tom brady', 'nfl draft', 'nba draft', 'mlb draft', 'nhl draft',
    'super bowl mvp', 'nba mvp', 'nfl mvp', 'derek jeter', 'babe ruth',
    'yankees', 'red sox', 'lakers', 'celtics', 'bulls', 'cowboys',
    'patriots', 'packers', 'bears', 'chiefs',
  ],
  'US politics': [
    'electoral college', 'us senate', 'us congress', 'us amendment',
    'us constitution article', 'house of representatives', 'us midterm',
    'electoral votes', 'senate term', 'congressional', 'speaker of the house',
    'vice president of the united states', 'potus', 'florida electoral',
  ],
  'US history': [
    'civil war general', 'confederate', 'gettysburg', 'american revolution',
    'boston tea party', 'us founding father', 'confederacy',
    'abraham lincoln assassination', 'declaration of independence signer',
  ],
  'British royals': [
    'prince william', 'prince harry', 'kate middleton', 'meghan markle',
    'king charles', 'buckingham palace', 'royal family', 'british monarch',
    'duke of cambridge', 'duke of sussex', 'princess diana',
    'queen elizabeth ii', 'coronation of charles', 'royal wedding',
  ],
  'K-pop/anime': [
    'bts', 'blackpink', 'kpop', 'k-pop', 'exo', 'stray kids',
    'anime', 'manga', 'naruto', 'dragon ball', 'one piece',
    'pokemon episode', 'attack on titan', 'death note', 'bleach',
  ],
  'European politics': [
    'european parliament', 'eu commissioner', 'brexit vote',
    'angela merkel', 'french election', 'german chancellor',
    'eurozone', 'schengen', 'eu council', 'brexit deal',
  ],
  'Wall Street/finance': [
    'dow jones', 'nasdaq index', 's&p 500', 'wall street', 'nyse',
    'federal reserve rate', 'subway locations', 'ohio locations',
  ],
};

// Flatten: list of { keyword, category }
const REMOVE_KEYWORDS = [];
for (const [category, keywords] of Object.entries(REMOVE_CATEGORIES)) {
  for (const k of keywords) {
    REMOVE_KEYWORDS.push({ keyword: k, category });
  }
}

// Override: if any of these appear, KEEP even if a remove keyword matches
const KEEP_OVERRIDE_KEYWORDS = [
  'new york city', 'nyc', 'united nations', 'un headquarters',
  'statue of liberty', 'hollywood film', 'oscar award', 'academy award',
  'martin luther king', 'obama', 'trump', 'kennedy assassination',
  'moon landing', 'nasa', 'silicon valley', 'google', 'apple',
  'microsoft', 'facebook', 'world war', 'hiroshima', 'pearl harbor',
  'gangnam style', 'michael jackson', 'beatles', 'titanic', 'avatar',
  'game of thrones', 'breaking bad', 'stranger things', 'leonardo dicaprio',
  // World geography / science (avoid false positives from US place names)
  'longest river', 'nile', 'amazon river', 'which river flows',
  'texas instruments', 'microprocessor', 'intel', 'first commercially',
  // India national symbols / country national X (keep)
  'national flower of india', 'national sport of india', 'national animal of india',
  'national bird of india', 'national sport of japan', 'national flower',
  'national animal', 'national bird',
  // Law / dignity / food (avoid false positives)
  'right to die', 'which case dealt', 'tahini', 'main ingredient',
  // Bollywood (avoid "maine" = US state matching film titles)
  'ae mere', 'film features the song', 'maine pyar kiya', 'bollywood',
  // World geography (Georgia country, Mongolia, etc.)
  'georgia (country)', 'capital of georgia', 'capital of mongolia',
  'sunflower', 'produces the most',
  // Music / rock (avoid anime "bleach" removing Nirvana etc.)
  'nirvana', 'album had', 'album cover',
];

function getSearchText(q) {
  const parts = [q.question || '', ...(q.options || [])];
  return parts.join(' ').toLowerCase();
}

function matchesKeepOverride(text) {
  return KEEP_OVERRIDE_KEYWORDS.some((k) => text.includes(k));
}

// Keywords that must match as whole words (avoid "manga" matching "manganese", etc.)
const WORD_BOUNDARY_KEYWORDS = new Set(['manga', 'exo', 'bts']);

function textMatchesKeyword(text, keyword) {
  if (WORD_BOUNDARY_KEYWORDS.has(keyword)) {
    return new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
  }
  return text.includes(keyword);
}

function findRemovalMatch(text) {
  for (const { keyword, category } of REMOVE_KEYWORDS) {
    if (textMatchesKeyword(text, keyword)) return { keyword, category };
  }
  return null;
}

async function main() {
  const raw = await fs.readFile(QUESTIONS_PATH, 'utf8');
  const questions = JSON.parse(raw);
  if (!Array.isArray(questions)) throw new Error('questions.json must be an array');

  const kept = [];
  const removed = [];
  const removalReasons = {};

  for (const q of questions) {
    const text = getSearchText(q);
    if (matchesKeepOverride(text)) {
      kept.push(q);
      continue;
    }
    const match = findRemovalMatch(text);
    if (match) {
      removed.push({
        ...q,
        _removalReason: match.category,
        _matchedKeyword: match.keyword,
      });
      removalReasons[match.category] = (removalReasons[match.category] || 0) + 1;
      continue;
    }
    kept.push(q);
  }

  await fs.mkdir(path.dirname(REMOVED_PATH), { recursive: true });
  await fs.writeFile(QUESTIONS_PATH, JSON.stringify(kept, null, 2), 'utf8');
  await fs.writeFile(
    REMOVED_PATH,
    JSON.stringify(removed.map(({ _removalReason, _matchedKeyword, ...q }) => ({ ...q, removalReason: _removalReason, matchedKeyword: _matchedKeyword })), null, 2),
    'utf8'
  );

  // Report
  console.log('\n=== Cleanup report ===');
  console.log(`Total input: ${questions.length}`);
  console.log(`Kept: ${kept.length}`);
  console.log(`Removed: ${removed.length}`);
  console.log('\nRemoval reason breakdown:');
  const categories = Object.keys(REMOVE_CATEGORIES);
  for (const cat of categories) {
    console.log(`  ${cat}: ${removalReasons[cat] || 0}`);
  }
  const otherCount = removed.length - Object.values(removalReasons).reduce((a, b) => a + b, 0);
  if (otherCount > 0) console.log(`  Other: ${otherCount}`);
  console.log('\nSample of removed questions (first 10):');
  removed.slice(0, 10).forEach((r, i) => {
    const reason = r._removalReason || '?';
    const kw = r._matchedKeyword || '?';
    console.log(`  ${i + 1}. [${reason}] "${(r.question || '').slice(0, 70)}..." (matched: "${kw}")`);
  });
  console.log(`\nFiltered questions written to ${QUESTIONS_PATH}`);
  console.log(`Removed questions written to ${REMOVED_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
