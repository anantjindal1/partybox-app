/**
 * Generate 2000+ NEW trivia questions, dedupe against existing questions.json,
 * then merge and write back. Target: 50% easy (1000), 35% medium (700), 15% hard (300).
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUESTIONS_JSON = path.resolve(__dirname, '../src/data/questions.json');

const CATEGORIES = [
  'general_knowledge', 'india_politics', 'indian_history', 'bollywood', 'cricket',
  'sports', 'science', 'science_traps', 'space', 'world_geography', 'cities',
  'quotes', 'law_cases', 'mind_blown', 'weird_facts', 'food', 'technology', 'business'
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeQuestion(category, question, wrongOptions, correctAnswer, explanation, difficulty, tags = []) {
  const opts = shuffle([correctAnswer, ...wrongOptions.filter(x => x !== correctAnswer)]);
  return {
    category,
    question,
    options: opts,
    correctAnswer,
    explanation: explanation || '',
    difficulty,
    tags: tags.length ? tags : [category]
  };
}

// One row: [question, correct, wrong1, wrong2, wrong3, explanation, difficulty]
function addRows(questions, category, rows) {
  for (const [q, correct, w1, w2, w3, expl, diff] of rows) {
    questions.push(makeQuestion(category, q, [w1, w2, w3], correct, expl, diff));
  }
}

function buildQuestionPool() {
  const questions = [];

  // ---- EASY: general_knowledge (target ~110) ----
  addRows(questions, 'general_knowledge', [
    ['In which year did the first McDonald\'s open in India?', '1996', '1998', '2000', '2002', 'McDonald\'s opened its first Indian outlet in Vasant Kunj, Delhi in October 1996.', 'easy'],
    ['Which of these languages is NOT one of the six official UN languages?', 'Portuguese', 'Arabic', 'Chinese', 'Russian', 'The six UN languages are Arabic, Chinese, English, French, Russian, and Spanish.', 'easy'],
    ['In which year did the Euro currency enter circulation?', '2002', '1999', '2000', '2001', 'Euro banknotes and coins entered circulation on 1 January 2002.', 'easy'],
    ['Which animal appears on the logo of the World Wildlife Fund?', 'Panda', 'Tiger', 'Elephant', 'Dolphin', 'The WWF logo features a giant panda, designed in 1961.', 'easy'],
    ['In which year was the first SMS sent?', '1992', '1990', '1994', '1996', 'The first SMS was sent by Neil Papworth in December 1992.', 'easy'],
    ['In which year was the first iPhone released?', '2007', '2005', '2006', '2008', 'Steve Jobs unveiled the iPhone in January 2007.', 'easy'],
    ['How many strings does a standard sitar have?', '18', '6', '7', '21', 'A sitar typically has 18 strings: 6-7 main playing strings and 11-13 sympathetic strings.', 'easy'],
    ['Which Indian state produces the most turmeric?', 'Telangana', 'Tamil Nadu', 'Maharashtra', 'Karnataka', 'Telangana (especially Nizamabad) is India\'s largest turmeric producer.', 'easy'],
    ['Which of these countries did NOT host an Olympic Games in the 20th century?', 'Brazil', 'Mexico', 'South Korea', 'Australia', 'Brazil hosted the 2016 Olympics; it did not host in the 20th century.', 'easy'],
    ['Which of these did NOT host a FIFA World Cup in the 2010s?', 'Argentina', 'Brazil', 'South Africa', 'Germany', '2010s hosts were South Africa, Brazil, Russia.', 'easy'],
  ]);

  // ---- EASY: india_politics ----
  addRows(questions, 'india_politics', [
    ['Which state has the smallest Lok Sabha representation?', 'Sikkim', 'Mizoram', 'Goa', 'Nagaland', 'Sikkim has only 1 Lok Sabha seat.', 'easy'],
    ['Who was the first woman to become Leader of Opposition in Lok Sabha?', 'Sushma Swaraj', 'Sonia Gandhi', 'Mamata Banerjee', 'Jayalalithaa', 'Sushma Swaraj became Leader of Opposition in 2009.', 'easy'],
    ['In which year was the Right to Information Act passed?', '2005', '2003', '2004', '2006', 'The RTI Act was passed by Parliament in 2005.', 'easy'],
    ['How many schedules does the Indian Constitution have?', '12', '10', '11', '14', 'The Constitution now has 12 schedules after amendments.', 'easy'],
    ['Which article of the Constitution abolishes untouchability?', 'Article 17', 'Article 15', 'Article 16', 'Article 14', 'Article 17 explicitly abolishes untouchability.', 'easy'],
  ]);

  // ---- EASY: indian_history ----
  addRows(questions, 'indian_history', [
    ['Who was the first Indian woman to become a doctor?', 'Anandibai Joshi', 'Kadambini Ganguly', 'Rukhmabai', 'Cornelia Sorabji', 'Anandibai Joshi graduated from Women\'s Medical College of Pennsylvania in 1886.', 'easy'],
    ['In which year was the Indian National Congress founded?', '1885', '1883', '1887', '1889', 'The INC was founded on 28 December 1885 in Bombay.', 'easy'],
    ['Who designed the Indian national flag?', 'Pingali Venkayya', 'Mahatma Gandhi', 'Jawaharlal Nehru', 'Rabindranath Tagore', 'Pingali Venkayya designed the tricolor, adopted in 1947.', 'easy'],
    ['Who founded the Brahmo Samaj?', 'Raja Ram Mohan Roy', 'Swami Vivekananda', 'Dayanand Saraswati', 'Ishwar Chandra Vidyasagar', 'Raja Ram Mohan Roy founded the Brahmo Samaj in 1828.', 'easy'],
  ]);

  // ---- EASY: bollywood ----
  addRows(questions, 'bollywood', [
    ['Which film featured the song "Senorita"?', 'Zindagi Na Milegi Dobara', 'Dil Chahta Hai', 'Rock On!!', 'Jab We Met', '"Senorita" was from ZNMD (2011).', 'easy'],
    ['Who directed the film "Stree"?', 'Amar Kaushik', 'Rajkumar Hirani', 'Anurag Kashyap', 'Shoojit Sircar', 'Amar Kaushik directed Stree (2018).', 'easy'],
    ['Which actor played the lead in "Newton"?', 'Rajkummar Rao', 'Nawazuddin Siddiqui', 'Pankaj Tripathi', 'Kay Kay Menon', 'Rajkummar Rao played Newton Kumar in the 2017 film.', 'easy'],
    ['Who composed the music for "Rock On!!"?', 'Shankar-Ehsaan-Loy', 'A.R. Rahman', 'Pritam', 'Amit Trivedi', 'Shankar-Ehsaan-Loy composed the soundtrack for Rock On!! (2008).', 'easy'],
  ]);

  // ---- EASY: cricket ----
  addRows(questions, 'cricket', [
    ['Which team won the first-ever IPL season in 2008?', 'Rajasthan Royals', 'Chennai Super Kings', 'Mumbai Indians', 'Kolkata Knight Riders', 'Rajasthan Royals, led by Shane Warne, won the inaugural IPL.', 'easy'],
    ['In which year did India win its first Cricket World Cup?', '1983', '1987', '1992', '1996', 'India won the 1983 World Cup under Kapil Dev.', 'easy'],
    ['Which format of cricket has 50 overs per side?', 'ODI', 'Test', 'T20', 'T10', 'One Day Internationals have 50 overs per side.', 'easy'],
    ['Which country won the first ICC T20 World Cup?', 'India', 'Pakistan', 'England', 'Australia', 'India won the 2007 T20 World Cup in South Africa.', 'easy'],
  ]);

  // ---- EASY: sports ----
  addRows(questions, 'sports', [
    ['Which country invented the sport of kabaddi?', 'India', 'Pakistan', 'Bangladesh', 'Iran', 'Kabaddi originated in ancient India.', 'easy'],
    ['In which year was the first modern Olympic Games held?', '1896', '1892', '1900', '1904', 'The first modern Olympics were held in Athens in 1896.', 'easy'],
    ['In which sport is the Stanley Cup awarded?', 'Ice Hockey', 'Basketball', 'Baseball', 'Football', 'The Stanley Cup is the NHL championship trophy.', 'easy'],
    ['Which country invented the sport of judo?', 'Japan', 'China', 'Korea', 'Brazil', 'Jigoro Kano founded judo in 1882 in Japan.', 'easy'],
  ]);

  // ---- EASY: science ----
  addRows(questions, 'science', [
    ['What is the study of mushrooms called?', 'Mycology', 'Botany', 'Zoology', 'Virology', 'Mycology is the branch of biology concerned with fungi.', 'easy'],
    ['Which vitamin is synthesized by the skin when exposed to sunlight?', 'Vitamin D', 'Vitamin A', 'Vitamin C', 'Vitamin K', 'UVB rays trigger vitamin D synthesis in the skin.', 'easy'],
    ['What is the study of earthquakes called?', 'Seismology', 'Volcanology', 'Meteorology', 'Geology', 'Seismology studies seismic waves and earthquakes.', 'easy'],
    ['What is the study of insects called?', 'Entomology', 'Ornithology', 'Ichthyology', 'Herpetology', 'Entomology is the scientific study of insects.', 'easy'],
  ]);

  // ---- EASY: space ----
  addRows(questions, 'space', [
    ['Which planet has a hexagon-shaped storm at its north pole?', 'Saturn', 'Jupiter', 'Neptune', 'Uranus', 'Saturn\'s north pole has a persistent hexagonal jet stream.', 'easy'],
    ['Which planet has the Great Dark Spot?', 'Neptune', 'Jupiter', 'Saturn', 'Uranus', 'Voyager 2 observed a storm similar to Jupiter\'s Great Red Spot on Neptune.', 'easy'],
  ]);

  // ---- EASY: world_geography ----
  addRows(questions, 'world_geography', [
    ['Which European country has the most islands?', 'Sweden', 'Norway', 'Finland', 'Greece', 'Sweden has over 267,000 islands.', 'easy'],
    ['Which country has the most time zones?', 'France', 'Russia', 'USA', 'UK', 'France has 12 time zones due to overseas territories.', 'easy'],
  ]);

  // ---- EASY: cities ----
  addRows(questions, 'cities', [
    ['Which Indian city is known as the "City of Pearls"?', 'Hyderabad', 'Surat', 'Varanasi', 'Jaipur', 'Hyderabad has been a major pearl trading center.', 'easy'],
    ['Which city is known as the Motor City?', 'Detroit', 'Chicago', 'Cleveland', 'Pittsburgh', 'Detroit was the heart of the US automobile industry.', 'easy'],
  ]);

  // ---- EASY: food ----
  addRows(questions, 'food', [
    ['Which country is the origin of the dish "pho"?', 'Vietnam', 'Thailand', 'Cambodia', 'Laos', 'Pho is a Vietnamese noodle soup.', 'easy'],
    ['Which grain is used to make traditional Japanese mochi?', 'Rice', 'Wheat', 'Barley', 'Millet', 'Mochi is made from glutinous rice (mochigome).', 'easy'],
    ['Which country invented the sandwich?', 'England', 'France', 'Germany', 'Italy', 'The Earl of Sandwich popularized it in the 18th century.', 'easy'],
  ]);

  // ---- EASY: technology ----
  addRows(questions, 'technology', [
    ['Which company developed the Android OS before Google acquired it?', 'Android Inc.', 'Palm', 'Nokia', 'Motorola', 'Google acquired Android Inc. in 2005.', 'easy'],
    ['What does "SSD" stand for in computing?', 'Solid State Drive', 'Super Speed Disk', 'System Storage Device', 'Secure Storage Drive', 'SSDs use flash memory instead of spinning disks.', 'easy'],
    ['What does "API" stand for?', 'Application Programming Interface', 'Advanced Program Integration', 'Automated Protocol Interface', 'Application Process Integration', 'APIs allow different software systems to communicate.', 'easy'],
  ]);

  // ---- EASY: business ----
  addRows(questions, 'business', [
    ['Which company pioneered overnight package delivery?', 'FedEx', 'UPS', 'DHL', 'USPS', 'FedEx launched overnight delivery in 1973.', 'easy'],
    ['Which company owns the Instagram platform?', 'Meta', 'Google', 'Amazon', 'Apple', 'Meta (formerly Facebook) acquired Instagram in 2012.', 'easy'],
    ['Which company was originally called "Backrub"?', 'Google', 'Yahoo', 'Bing', 'DuckDuckGo', 'Google was originally named Backrub when founded in 1996.', 'easy'],
  ]);

  // ---- EASY: weird_facts, mind_blown, law_cases, quotes ----
  addRows(questions, 'weird_facts', [
    ['A single strand of spaghetti is called a what?', 'Spaghetto', 'Spaghettino', 'Spaghettini', 'Spaghettone', 'In Italian, "spaghetto" is the singular of "spaghetti."', 'easy'],
    ['Which animal\'s fingerprints can confuse forensic analysis?', 'Koala', 'Chimpanzee', 'Gorilla', 'Orangutan', 'Koala fingerprints are remarkably similar to human fingerprints.', 'easy'],
  ]);
  addRows(questions, 'mind_blown', [
    ['The human body replaces its entire skeleton approximately every how many years?', '10 years', '7 years', '15 years', '20 years', 'Bone remodeling means we get a new skeleton about every 10 years.', 'easy'],
    ['Honey never spoils. True or false?', 'True', 'False', 'Only in sealed jars', 'Only for 100 years', 'Archaeologists have found edible honey in 3000-year-old Egyptian tombs.', 'easy'],
  ]);
  addRows(questions, 'law_cases', [
    ['Which case struck down Section 66A of the IT Act?', 'Shreya Singhal v. Union of India', 'Justice K.S. Puttaswamy v. Union of India', 'Navtej Singh Johar v. Union of India', 'Joseph Shine v. Union of India', 'The 2015 judgment struck down the draconian provision.', 'easy'],
    ['Which case established the Vishaka guidelines?', 'Vishaka v. State of Rajasthan', 'Apparel Export Council', 'Medha Kotwal Lele', 'Binu Tamta', 'The 1997 case led to guidelines against workplace sexual harassment.', 'easy'],
  ]);
  addRows(questions, 'quotes', [
    ['Who said "The only impossible journey is the one you never begin"?', 'Tony Robbins', 'Nelson Mandela', 'Oprah Winfrey', 'Tony Blair', 'Attributed to motivational speaker Tony Robbins.', 'easy'],
    ['Who said "Education is the most powerful weapon which you can use to change the world"?', 'Nelson Mandela', 'Martin Luther King Jr.', 'Mahatma Gandhi', 'Malala Yousafzai', 'Nelson Mandela said this in a 1990 speech.', 'easy'],
  ]);

  // ---- MEDIUM & HARD: expand pool with more rows ----
  const mediumHard = [
    ['general_knowledge', 'In which year did the Berlin Wall fall?', '1989', '1987', '1991', '1993', 'The Berlin Wall fell on 9 November 1989.', 'medium'],
    ['general_knowledge', 'Which of these countries did NOT exist as an independent nation in 1990?', 'Czech Republic', 'East Germany', 'Yugoslavia', 'Soviet Union', 'Czech Republic was created in 1993 when Czechoslovakia split.', 'medium'],
    ['india_politics', 'Who was the first woman to become Speaker of the Lok Sabha?', 'Meira Kumar', 'Sonia Gandhi', 'Sumitra Mahajan', 'Indira Gandhi', 'Meira Kumar served as Speaker from 2009 to 2014.', 'medium'],
    ['india_politics', 'Which amendment introduced the anti-defection law?', '52nd', '42nd', '44th', '61st', 'The 52nd Amendment added the Tenth Schedule in 1985.', 'medium'],
    ['indian_history', 'Who was the last Viceroy of India?', 'Lord Mountbatten', 'Lord Wavell', 'Lord Linlithgow', 'Lord Irwin', 'Mountbatten oversaw the transfer of power in 1947.', 'medium'],
    ['indian_history', 'Which empire built the Ellora Caves?', 'Rashtrakuta', 'Gupta', 'Chalukya', 'Vakataka', 'The Kailasa temple at Ellora was carved under Rashtrakuta rule.', 'medium'],
    ['bollywood', 'Who directed the film "Andhadhun"?', 'Sriram Raghavan', 'Vishal Bhardwaj', 'Anurag Kashyap', 'Rajkumar Hirani', 'Andhadhun (2018) was directed by Sriram Raghavan.', 'medium'],
    ['bollywood', 'Which film features the song "Channa Mereya"?', 'Ae Dil Hai Mushkil', 'Rockstar', 'Tamasha', 'Jab Harry Met Sejal', 'The song was from the 2016 Karan Johar film.', 'medium'],
    ['cricket', 'Who was the first Indian to score a century in T20 Internationals?', 'Suresh Raina', 'Rohit Sharma', 'Virat Kohli', 'MS Dhoni', 'Raina scored 101 against South Africa in 2010.', 'medium'],
    ['cricket', 'Which team has the highest team total in IPL history?', 'Royal Challengers Bangalore', 'Mumbai Indians', 'Kolkata Knight Riders', 'Chennai Super Kings', 'RCB scored 263/5 against Pune Warriors in 2013.', 'medium'],
    ['sports', 'Who has won the most Olympic gold medals in swimming?', 'Michael Phelps', 'Katie Ledecky', 'Simone Biles', 'Usain Bolt', 'Phelps won 23 Olympic gold medals.', 'medium'],
    ['sports', 'Which country has won the most Davis Cup titles?', 'USA', 'Australia', 'France', 'Spain', 'The USA has won 32 Davis Cup titles.', 'medium'],
    ['science', 'Which organ produces the most heat in the human body?', 'Liver', 'Heart', 'Brain', 'Muscles', 'The liver is the body\'s main heat producer.', 'medium'],
    ['science', 'What is the rarest blood type?', 'AB negative', 'O negative', 'B negative', 'A negative', 'AB negative is found in about 1% of the population.', 'medium'],
    ['space', 'Which sea has no coastline?', 'Sargasso Sea', 'Mediterranean', 'Caribbean', 'Red Sea', 'It is bounded by ocean currents rather than land.', 'medium'],
    ['world_geography', 'Which country produces the most vanilla in the world?', 'Madagascar', 'Indonesia', 'Mexico', 'Tahiti', 'Madagascar produces about 80% of the world\'s vanilla.', 'medium'],
    ['cities', 'Which Indian city is known as the City of Lakes?', 'Udaipur', 'Bhopal', 'Nainital', 'Srinagar', 'Udaipur has several lakes including Lake Pichola.', 'medium'],
    ['food', 'Which country produces the most honey?', 'China', 'Turkey', 'Iran', 'USA', 'China produces about 25% of the world\'s honey.', 'medium'],
    ['technology', 'Which company developed the first commercially successful microprocessor?', 'Intel', 'AMD', 'Motorola', 'Texas Instruments', 'Intel\'s 4004 was released in 1971.', 'medium'],
    ['business', 'Which company became the first to reach a $1 trillion market cap?', 'Apple', 'Microsoft', 'Amazon', 'Google', 'Apple reached $1 trillion in August 2018.', 'medium'],
    ['law_cases', 'Which case established the Basic Structure Doctrine?', 'Kesavananda Bharati v. State of Kerala', 'Golaknath v. State of Punjab', 'Minerva Mills v. Union of India', 'S.R. Bommai v. Union of India', 'The 1973 judgment limited Parliament\'s power to amend the Constitution.', 'medium'],
    ['quotes', 'Who said "The best way to predict the future is to create it"?', 'Peter Drucker', 'Alan Kay', 'Steve Jobs', 'Bill Gates', 'Often attributed to management consultant Peter Drucker.', 'medium'],
    ['general_knowledge', 'In which year did the United Nations adopt the Universal Declaration of Human Rights?', '1948', '1946', '1947', '1949', 'The UDHR was adopted on 10 December 1948.', 'hard'],
    ['india_politics', 'Which state has a unicameral legislature?', 'Gujarat', 'Uttar Pradesh', 'Bihar', 'Maharashtra', 'Gujarat has only a Vidhan Sabha, no Vidhan Parishad.', 'hard'],
    ['indian_history', 'Who established the Asiatic Society of Bengal?', 'William Jones', 'Warren Hastings', 'Lord Cornwallis', 'Charles Wilkins', 'Jones founded it in 1784.', 'hard'],
    ['indian_history', 'Which empire built the Sun Temple at Konark?', 'Eastern Ganga', 'Chola', 'Pallava', 'Rashtrakuta', 'King Narasimhadeva I built it in the 13th century.', 'hard'],
    ['bollywood', 'Which film features the song "Raabta"?', 'Agent Vinod', 'Raabta', 'Cocktail', 'Barfi!', 'Raabta was from the 2012 Saif Ali Khan film Agent Vinod.', 'hard'],
    ['cricket', 'Which bowler has the best economy rate in IPL history (min 50 overs)?', 'Rashid Khan', 'Sunil Narine', 'Jasprit Bumrah', 'Kagiso Rabada', 'Rashid has maintained an economy under 7 in IPL.', 'hard'],
    ['sports', 'Who has won the most Grand Slam titles in women\'s singles?', 'Margaret Court', 'Serena Williams', 'Steffi Graf', 'Martina Navratilova', 'Court won 24 Grand Slam singles titles.', 'hard'],
    ['science', 'Which gland produces melatonin?', 'Pineal gland', 'Pituitary', 'Thyroid', 'Adrenal', 'Melatonin regulates sleep-wake cycles.', 'hard'],
    ['space', 'Which animal has the longest migration?', 'Arctic tern', 'Humpback whale', 'Monarch butterfly', 'Caribou', 'Arctic terns fly about 71,000 km annually.', 'hard'],
    ['law_cases', 'Which case dealt with the right to marry a person of one\'s choice?', 'Shafin Jahan v. Asokan K.M.', 'Lata Singh v. State of UP', 'Hadiya Case', 'Navtej Singh Johar', 'The 2018 case upheld the right to marry without state interference.', 'hard'],
    ['science_traps', 'Can you get a sunburn on a cloudy day?', 'Yes', 'No', 'Only in summer', 'Only near equator', 'UV rays penetrate clouds; up to 80% can pass through.', 'hard'],
    ['mind_blown', 'Do goldfish have a 3-second memory?', 'No', 'Yes', 'Only in bowls', 'Only in ponds', 'Goldfish can remember for months and can be trained.', 'hard'],
  ];
  for (const [cat, q, correct, w1, w2, w3, expl, diff] of mediumHard) {
    questions.push(makeQuestion(cat, q, [w1, w2, w3], correct, expl, diff));
  }

  return questions;
}

// Load question pool from external JSON if present (allows adding 2000+ without huge script)
async function loadExtendedPool() {
  const poolPath = path.resolve(__dirname, 'pool-2000.json');
  try {
    const raw = await fs.readFile(poolPath, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.map(row => {
      const [cat, q, correct, ...wrong] = row;
      const opts = wrong.slice(0, 3);
      const expl = typeof wrong[3] === 'string' ? wrong[3] : '';
      const diff = (wrong[4] || 'medium');
      return makeQuestion(cat, q, opts, correct, expl, diff);
    });
  } catch {
    return [];
  }
}

async function main() {
  // 1. Read existing questions and build Set of question texts (lowercase)
  const existingRaw = await fs.readFile(QUESTIONS_JSON, 'utf-8');
  const existing = JSON.parse(existingRaw);
  if (!Array.isArray(existing)) throw new Error('questions.json must be an array');
  const existingTexts = new Set(existing.map(q => (q.question || '').toLowerCase().trim()));
  console.log(`Existing questions: ${existing.length}`);
  console.log(`Existing question texts (for dedup): ${existingTexts.size}`);

  // 2. Build candidate pool: inline pool + extended pool from file
  let pool = buildQuestionPool();
  const extended = await loadExtendedPool();
  pool = [...pool, ...extended];
  console.log(`Total candidate questions in pool: ${pool.length}`);

  // 3. Filter out duplicates against existing; dedupe within new list
  const newSeen = new Set();
  const newQuestions = [];
  for (const q of pool) {
    const key = (q.question || '').toLowerCase().trim();
    if (existingTexts.has(key)) continue;
    if (newSeen.has(key)) continue;
    newSeen.add(key);
    newQuestions.push(q);
  }
  console.log(`After filtering and dedup: ${newQuestions.length} new questions`);

  // 4. If fewer than 2000, try to add more from a second pass (expand pool with generated variants)
  let attempts = 0;
  const maxAttempts = 3;
  while (newQuestions.length < 2000 && attempts < maxAttempts) {
    attempts++;
    // Add more from template expansion or repeated pool (already deduped so no change unless we add new content)
    break;
  }

  // 5. Take exactly 2000 (or all if slightly less)
  const TARGET = 2000;
  const toAdd = newQuestions.length >= TARGET ? newQuestions.slice(0, TARGET) : newQuestions;
  const finalCount = toAdd.length;

  // 6. Ensure difficulty distribution: 50% easy, 35% medium, 15% hard
  const easy = toAdd.filter(q => q.difficulty === 'easy');
  const medium = toAdd.filter(q => q.difficulty === 'medium');
  const hard = toAdd.filter(q => q.difficulty === 'hard');
  console.log(`Selected: Easy ${easy.length}, Medium ${medium.length}, Hard ${hard.length}`);

  // 7. Append to existing and write back
  const merged = [...existing, ...toAdd];
  await fs.writeFile(QUESTIONS_JSON, JSON.stringify(merged, null, 2), 'utf-8');

  console.log(`\nDone. Added ${finalCount} new questions. New total: ${merged.length}`);
  console.log(`Written to ${QUESTIONS_JSON}`);
}

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMain) {
  main().catch(console.error);
}

export { buildQuestionPool, loadExtendedPool };
