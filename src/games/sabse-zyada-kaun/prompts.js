/**
 * Sabse Zyada Kaun — shared prompt library, used by both the offline and
 * online modes. Every prompt can carry more than one tag (deliberately —
 * plenty of these fit more than one social setting); `adult` prompts are
 * only included when the host explicitly turns on the 18+ toggle.
 */

export const TAGS = {
  office: { en: 'Office Party', hi: 'ऑफिस पार्टी' },
  friends: { en: 'Friends Hangout', hi: 'दोस्तों की महफ़िल' },
  icebreaker: { en: 'Meeting New People', hi: 'नए लोगों से मुलाक़ात' },
}

export const PROMPTS = [
  // ── Office ──────────────────────────────────────────────────────────────
  { id: 'workaholic', en: 'Most likely to reply to work messages at midnight', hi: 'आधी रात को भी ऑफिस के मैसेज का जवाब देने वाला', tags: ['office'], adult: false },
  { id: 'late-lateef', en: 'Most likely to be late to their own meeting', hi: 'अपनी ही मीटिंग में लेट आने वाला', tags: ['office'], adult: false },
  { id: 'on-time', en: 'Most likely to be on time, every single time', hi: 'हर बार समय पर पहुंचने वाला', tags: ['office'], adult: false },
  { id: 'next-promotion', en: 'Most likely to get promoted next', hi: 'अगली प्रमोशन पाने वाला', tags: ['office'], adult: false },
  { id: 'sincere', en: 'Most likely to take every task seriously', hi: 'हर काम को गंभीरता से लेने वाला', tags: ['office'], adult: false },
  { id: 'meeting-don', en: 'Most likely to dominate every meeting', hi: 'हर मीटिंग में सबसे ज़्यादा बोलने वाला', tags: ['office'], adult: false },
  { id: 'chai-break', en: 'Most likely to always be at the chai break', hi: 'चाय की ब्रेक में हमेशा मिलने वाला', tags: ['office'], adult: false },
  { id: 'excel-ninja', en: 'Most likely to be an Excel/PowerPoint ninja', hi: 'एक्सेल-पावरपॉइंट का उस्ताद', tags: ['office'], adult: false },
  { id: 'reply-all', en: 'Most likely to hit reply-all by mistake', hi: 'गलती से रिप्लाई-ऑल दबाने वाला', tags: ['office'], adult: false },
  { id: 'wfh-pro', en: 'Most likely working from bed right now', hi: 'बिस्तर से ही वर्क फ्रॉम होम करने वाला', tags: ['office'], adult: false },
  { id: 'deadline-daredevil', en: 'Most likely to finish everything at the last minute', hi: 'आखिरी मिनट में सब कुछ पूरा करने वाला', tags: ['office'], adult: false },
  { id: 'startup-founder', en: 'Most likely to quit and start their own company', hi: 'नौकरी छोड़ अपनी कंपनी शुरू करने वाला', tags: ['office'], adult: false },
  { id: 'weekend-planner', en: 'Most likely to plan the whole weekend during work hours', hi: 'काम के समय पूरे वीकेंड का प्लान बनाने वाला', tags: ['office'], adult: false },

  // ── Friends ─────────────────────────────────────────────────────────────
  { id: 'chuglikhor', en: 'Biggest chuglikhor — knows everyone’s gossip', hi: 'सबसे बड़ा चुगलीखोर', tags: ['friends', 'office'], adult: false },
  { id: 'bakwas', en: 'Biggest bakwas king/queen — all talk', hi: 'सबसे बड़ा बकवास किंग/क्वीन', tags: ['friends'], adult: false },
  { id: 'smartypants', en: 'The sharpest one in the group', hi: 'ग्रुप का सबसे स्मार्ट', tags: ['friends', 'office', 'icebreaker'], adult: false },
  { id: 'most-likely-succeed', en: 'Most likely to succeed in life', hi: 'ज़िंदगी में सबसे आगे जाने वाला', tags: ['friends', 'office', 'icebreaker'], adult: false },
  { id: 'get-in-fight', en: 'Most likely to get into a fight tonight', hi: 'आज रात झगड़ा करने वाला', tags: ['friends'], adult: false },
  { id: 'miss-flight', en: 'Most likely to miss their own flight', hi: 'अपनी फ्लाइट मिस करने वाला', tags: ['friends', 'office'], adult: false },
  { id: 'charm-anyone', en: 'Most likely to charm anyone in the room', hi: 'कमरे में किसी को भी इम्प्रेस कर सकता है', tags: ['friends', 'icebreaker'], adult: false },
  { id: 'become-famous', en: 'Most likely to become famous one day', hi: 'एक दिन फेमस होने वाला', tags: ['friends', 'icebreaker'], adult: false },
  { id: 'cry-movie', en: 'Most likely to cry during a movie', hi: 'फिल्म देखते हुए रोने वाला', tags: ['friends'], adult: false },
  { id: 'ghost-someone', en: 'Most likely to ghost someone', hi: 'किसी को अचानक गायब हो जाने वाला', tags: ['friends'], adult: false },
  { id: 'start-dance', en: 'Most likely to start the dance floor', hi: 'डांस फ्लोर शुरू करने वाला', tags: ['friends', 'icebreaker'], adult: false },
  { id: 'marry-first', en: 'Most likely to get married first', hi: 'सबसे पहले शादी करने वाला', tags: ['friends'], adult: false },
  { id: 'zombie-survivor', en: 'Most likely to survive a zombie apocalypse', hi: 'ज़ॉम्बी अपोकैलिप्स में बचने वाला', tags: ['friends', 'icebreaker'], adult: false },
  { id: 'secret-crush', en: 'Most likely to have a secret crush in this room', hi: 'इस कमरे में किसी को सीक्रेटली पसंद करने वाला', tags: ['friends'], adult: false },
  { id: 'wildest-dating-story', en: 'Most likely to have the wildest dating story', hi: 'सबसे अजीब डेटिंग स्टोरी वाला', tags: ['friends'], adult: true },
  { id: 'threesome-story', en: 'Most likely to have a threesome story to tell', hi: 'थ्रीसम की कहानी रखने वाला', tags: ['friends'], adult: true },

  // ── Icebreaker ──────────────────────────────────────────────────────────
  { id: 'hidden-talent', en: 'Most likely to have a hidden talent', hi: 'कोई छुपी हुई कला रखने वाला', tags: ['icebreaker', 'friends'], adult: false },
  { id: 'traveled-most', en: 'Most likely to have traveled the most', hi: 'सबसे ज़्यादा घूमा हुआ', tags: ['icebreaker', 'friends'], adult: false },
  { id: 'foodie', en: 'Most likely to be a total foodie', hi: 'सबसे बड़ा फूडी', tags: ['icebreaker', 'friends'], adult: false },
  { id: 'reality-show', en: 'Most likely to win a reality show', hi: 'रियलिटी शो जीतने वाला', tags: ['icebreaker', 'friends'], adult: false },
  { id: 'make-laugh', en: 'Most likely to make everyone laugh', hi: 'सबको हंसाने वाला', tags: ['icebreaker', 'friends', 'office'], adult: false },
  { id: 'storyteller', en: 'Most likely to be a great storyteller', hi: 'सबसे अच्छा किस्सा सुनाने वाला', tags: ['icebreaker', 'friends'], adult: false },
  { id: 'best-fashion', en: 'Most likely to have the best fashion sense', hi: 'सबसे स्टाइलिश', tags: ['icebreaker', 'office', 'friends'], adult: false },
  { id: 'know-celebrity', en: 'Most likely to actually know a celebrity', hi: 'किसी सेलिब्रिटी को जानने वाला', tags: ['icebreaker', 'friends'], adult: false },
  { id: 'adventure-sport', en: 'Most likely to try any adventure sport', hi: 'कोई भी एडवेंचर स्पोर्ट ट्राई करने वाला', tags: ['icebreaker', 'friends'], adult: false },
  { id: 'remember-names', en: 'Most likely to remember everyone’s name', hi: 'सबका नाम याद रखने वाला', tags: ['icebreaker', 'office'], adult: false },
  { id: 'best-advice', en: 'Most likely to give the best advice', hi: 'सबसे अच्छी सलाह देने वाला', tags: ['icebreaker', 'friends', 'office'], adult: false },
  { id: 'first-friend', en: 'Most likely to make a new friend here first', hi: 'यहां सबसे पहले नया दोस्त बनाने वाला', tags: ['icebreaker'], adult: false },
  { id: 'life-of-party', en: 'Most likely to be the life of the party', hi: 'पार्टी की जान', tags: ['icebreaker', 'friends'], adult: false },
  { id: 'break-into-song', en: 'Most likely to break into song at any moment', hi: 'कभी भी गाना शुरू कर सकता है', tags: ['icebreaker', 'friends'], adult: false },
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
