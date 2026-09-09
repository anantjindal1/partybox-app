/**
 * Bakwaas — fill-in-the-blank prompt library. Every prompt can carry more
 * than one tag; `adult` prompts are only included when the host explicitly
 * turns on the 18+ toggle. Shape and helper functions mirror Sabse Zyada
 * Kaun's prompts.js exactly.
 */

export const TAGS = {
  office: { en: 'Office Party', hi: 'ऑफिस पार्टी' },
  friends: { en: 'Friends Hangout', hi: 'दोस्तों की महफ़िल' },
  icebreaker: { en: 'Meeting New People', hi: 'नए लोगों से मुलाक़ात' },
}

export const PROMPTS = [
  // ── Office ──────────────────────────────────────────────────────────────
  { id: 'late-excuse', en: 'The real reason my coworker was late today: ___', hi: 'मेरे सहकर्मी के आज लेट आने की असली वजह: ___', tags: ['office'], adult: false },
  { id: 'ooo-reply', en: 'My out-of-office reply secretly says: ___', hi: 'मेरे ऑटो-रिप्लाई में असल में लिखा है: ___', tags: ['office'], adult: false },
  { id: 'honest-title', en: 'My honest job title should be: ___', hi: 'मेरी असली जॉब टाइटल होनी चाहिए: ___', tags: ['office'], adult: false },
  { id: 'mic-muted', en: 'The thing I do the second I mute my mic on a call: ___', hi: 'कॉल पर माइक म्यूट करते ही मैं सबसे पहले करता/करती हूं: ___', tags: ['office'], adult: false },
  { id: 'resignation-line', en: 'My resignation letter would open with: ___', hi: 'मेरे इस्तीफे की चिट्ठी की पहली लाइन होगी: ___', tags: ['office'], adult: false },
  { id: 'boss-secret', en: "My boss's secret talent nobody talks about: ___", hi: 'मेरे बॉस की छुपी हुई कला जिसके बारे में कोई बात नहीं करता: ___', tags: ['office'], adult: false },
  { id: 'meeting-invented', en: 'This meeting could have been: ___', hi: 'यह मीटिंग असल में यह हो सकती थी: ___', tags: ['office'], adult: false },
  { id: 'password-hint', en: 'My work laptop password is a tribute to ___', hi: 'मेरे ऑफिस लैपटॉप का पासवर्ड ___ को समर्पित है', tags: ['office'], adult: false },
  { id: 'appraisal-line', en: 'My honest self-appraisal this year: ___', hi: 'इस साल की मेरी ईमानदार सेल्फ-अप्रेज़ल: ___', tags: ['office'], adult: false },
  { id: 'linkedin-brag', en: 'The most exaggerated thing on my LinkedIn: ___', hi: 'मेरी लिंक्डइन पर सबसे बढ़ा-चढ़ाकर लिखी बात: ___', tags: ['office'], adult: false },
  { id: 'coffee-machine', en: "What the office coffee machine has secretly seen: ___", hi: 'ऑफिस की कॉफी मशीन ने चुपके से जो देखा है: ___', tags: ['office'], adult: false },
  { id: 'wfh-outfit', en: "Below the camera, I'm wearing ___", hi: 'कैमरे के नीचे, मैंने पहना है ___', tags: ['office'], adult: false },

  // ── Friends ─────────────────────────────────────────────────────────────
  { id: 'worst-gift', en: 'The worst gift I ever received was ___', hi: 'मुझे मिला सबसे बुरा तोहफ़ा था ___', tags: ['friends'], adult: false },
  { id: 'secret-talent', en: 'My secret talent is ___', hi: 'मेरी छुपी हुई कला है ___', tags: ['friends', 'icebreaker'], adult: false },
  { id: 'mother-quote', en: 'The most Indian thing my mother has ever said: ___', hi: 'मेरी मां की कही सबसे "देसी" बात: ___', tags: ['friends'], adult: false },
  { id: 'group-chat-name', en: 'Our group chat should really be renamed: ___', hi: 'हमारी ग्रुप चैट का नाम असल में यह होना चाहिए: ___', tags: ['friends'], adult: false },
  { id: 'auto-reply-life', en: "If life had an out-of-office reply, mine would say: ___", hi: 'अगर ज़िंदगी का भी ऑटो-रिप्लाई होता, तो मेरा कहता: ___', tags: ['friends'], adult: false },
  { id: 'wedding-toast', en: "The wedding toast nobody asked for: ___", hi: 'शादी में वह टोस्ट जो किसी ने नहीं मांगा: ___', tags: ['friends'], adult: false },
  { id: 'family-wedding', en: 'The one relative who always asks: ___', hi: 'वह रिश्तेदार जो हमेशा पूछता है: ___', tags: ['friends'], adult: false },
  { id: 'exit-plan', en: 'My exit plan from a boring party: ___', hi: 'किसी बोरिंग पार्टी से निकलने का मेरा प्लान: ___', tags: ['friends'], adult: false },
  { id: 'roommate-rule', en: 'The one house rule nobody follows: ___', hi: 'वह एक घर का नियम जिसे कोई नहीं मानता: ___', tags: ['friends'], adult: false },
  { id: 'red-flag', en: "The real red flag nobody warns you about: ___", hi: 'वह असली रेड फ़्लैग जिसके बारे में कोई नहीं बताता: ___', tags: ['friends'], adult: false },
  { id: 'group-trip-chaos', en: 'On every group trip, someone always forgets: ___', hi: 'हर ग्रुप ट्रिप में कोई न कोई हमेशा भूल जाता है: ___', tags: ['friends'], adult: false },
  { id: 'life-hack-fake', en: "My completely made-up life hack: ___", hi: 'मेरी पूरी तरह बनाई हुई लाइफ हैक: ___', tags: ['friends', 'icebreaker'], adult: false },

  // ── Icebreaker ──────────────────────────────────────────────────────────
  { id: 'dino-extinct', en: 'The real reason dinosaurs went extinct: ___', hi: 'डायनासोर के विलुप्त होने की असली वजह: ___', tags: ['icebreaker'], adult: false },
  { id: 'bollywood-title', en: 'If my life were a Bollywood movie, the title would be: ___', hi: 'अगर मेरी ज़िंदगी एक बॉलीवुड फिल्म होती, तो उसका नाम होता: ___', tags: ['icebreaker', 'friends'], adult: false },
  { id: 'superpower-useless', en: 'My completely useless superpower: ___', hi: 'मेरी पूरी तरह बेकार सुपरपावर: ___', tags: ['icebreaker'], adult: false },
  { id: 'alien-first-word', en: "If aliens landed today, the first thing they'd say is: ___", hi: 'अगर आज एलियन उतरें, तो सबसे पहले वे कहेंगे: ___', tags: ['icebreaker'], adult: false },
  { id: 'time-machine', en: 'With a time machine, my first stop would be: ___', hi: 'टाइम मशीन मिलने पर, मेरा पहला पड़ाव होगा: ___', tags: ['icebreaker'], adult: false },
  { id: 'museum-exhibit', en: 'The museum exhibit dedicated entirely to me would show: ___', hi: 'मेरे नाम पर बना म्यूज़ियम प्रदर्शनी दिखाएगी: ___', tags: ['icebreaker'], adult: false },
  { id: 'new-olympic-sport', en: 'The new Olympic sport I would definitely win: ___', hi: 'वह नया ओलंपिक खेल जो मैं ज़रूर जीतूंगा/जीतूंगी: ___', tags: ['icebreaker'], adult: false },
  { id: 'robot-replace', en: "The one chore I wish a robot would do forever: ___", hi: 'वह एक काम जो मैं चाहता/चाहती हूं कोई रोबोट हमेशा के लिए कर दे: ___', tags: ['icebreaker'], adult: false },
  { id: 'ghost-haunt', en: 'If I became a ghost, I would spend eternity haunting: ___', hi: 'अगर मैं भूत बन जाऊं, तो हमेशा के लिए डराऊंगा/डराऊंगी: ___', tags: ['icebreaker'], adult: false },
  { id: 'app-nobody-needs', en: 'The app nobody asked for but I would still build: ___', hi: 'वह ऐप जो किसी ने नहीं मांगा पर मैं फिर भी बनाऊंगा/बनाऊंगी: ___', tags: ['icebreaker', 'office'], adult: false },
  { id: 'animal-reincarnate', en: 'In my next life, I want to come back as ___', hi: 'अगले जन्म में, मैं बनना चाहता/चाहती हूं ___', tags: ['icebreaker', 'friends'], adult: false },
  { id: 'conspiracy-theory', en: 'My completely made-up conspiracy theory: ___', hi: 'मेरी पूरी तरह बनाई हुई साज़िश की थ्योरी: ___', tags: ['icebreaker'], adult: false },

  // ── Adult (18+ toggle only) ──────────────────────────────────────────────
  { id: 'date-ended-early', en: 'The real reason my last date ended early: ___', hi: 'मेरी पिछली डेट जल्दी खत्म होने की असली वजह: ___', tags: ['friends'], adult: true },
  { id: 'work-trip', en: 'What actually happens on a "work trip": ___', hi: '"वर्क ट्रिप" पर असल में क्या होता है: ___', tags: ['office'], adult: true },
  { id: 'honest-bio', en: 'My honest dating app bio would say: ___', hi: 'अगर मैं ईमानदार रहूं तो मेरी डेटिंग ऐप बायो कहेगी: ___', tags: ['icebreaker'], adult: true },
  { id: 'walk-of-shame', en: "The most awkward walk of shame story I know: ___", hi: 'सबसे शर्मिंदगी भरी सुबह की कहानी जो मैं जानता/जानती हूं: ___', tags: ['friends'], adult: true },
  { id: 'ex-text', en: "The text I still haven't sent my ex: ___", hi: 'वह मैसेज जो मैंने अभी तक अपने एक्स को नहीं भेजा: ___', tags: ['friends'], adult: true },
  { id: 'office-crush', en: "The unspoken office crush situation: ___", hi: 'वह ऑफिस क्रश की बिना कही बात: ___', tags: ['office'], adult: true },
  { id: 'one-night-regret', en: "My biggest one-night regret wasn't the night, it was: ___", hi: 'मेरा सबसे बड़ा पछतावा उस रात का नहीं, बल्कि यह था: ___', tags: ['friends'], adult: true },
  { id: 'tinder-opener', en: 'The worst opening line I ever received: ___', hi: 'सबसे बुरी ओपनिंग लाइन जो मुझे कभी मिली: ___', tags: ['icebreaker'], adult: true },
  { id: 'awkward-hookup', en: "The most awkward moment during a hookup: ___", hi: 'किसी हुकअप के दौरान सबसे अजीब पल: ___', tags: ['friends'], adult: true },
]

/**
 * Prompts matching any of the selected tags, respecting the adult toggle.
 * @param {string[]} selectedTags
 * @param {boolean} includeAdult
 */
export function filterPrompts(selectedTags, includeAdult = false) {
  const tags = selectedTags && selectedTags.length > 0 ? selectedTags : Object.keys(TAGS)
  return PROMPTS.filter(
    (p) => (includeAdult || !p.adult) && p.tags.some((t) => tags.includes(t))
  )
}

/**
 * Picks a random prompt from `pool`, avoiding ids already in `usedIds` where
 * possible. Resets (allows repeats) once the pool is exhausted rather than
 * returning null, so a long game never runs dry.
 * @param {{id:string}[]} pool
 * @param {string[]} usedIds
 * @param {() => number} rng
 */
export function pickRandomPrompt(pool, usedIds = [], rng = Math.random) {
  if (!pool || pool.length === 0) return null
  const fresh = pool.filter((p) => !usedIds.includes(p.id))
  const candidates = fresh.length > 0 ? fresh : pool
  return candidates[Math.floor(rng() * candidates.length)]
}
