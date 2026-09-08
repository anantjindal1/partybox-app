/**
 * Bhed (Jasoos) — secret word bank. Everyday/pop-culture nouns, easy to
 * give a one-word spoken clue about without needing an image.
 */

export const CATEGORIES = {
  bollywood: { en: 'Bollywood & Entertainment', hi: 'बॉलीवुड और मनोरंजन' },
  places: { en: 'Indian Places', hi: 'भारतीय स्थान' },
  objects: { en: 'Everyday Objects', hi: 'रोज़मर्रा की चीज़ें' },
  food: { en: 'Food & Drink', hi: 'खाना-पीना' },
  professions: { en: 'Professions', hi: 'पेशे' }
}

export const WORDS = [
  { id: 'srk', word: { en: 'Shah Rukh Khan', hi: 'शाहरुख़ खान' }, category: 'bollywood' },
  { id: 'amitabh', word: { en: 'Amitabh Bachchan', hi: 'अमिताभ बच्चन' }, category: 'bollywood' },
  { id: 'lagaan', word: { en: 'Lagaan', hi: 'लगान' }, category: 'bollywood' },
  { id: 'sholay', word: { en: 'Sholay', hi: 'शोले' }, category: 'bollywood' },
  { id: 'item-song', word: { en: 'Item Song', hi: 'आइटम सॉन्ग' }, category: 'bollywood' },
  { id: 'multiplex', word: { en: 'Multiplex', hi: 'मल्टीप्लेक्स' }, category: 'bollywood' },
  { id: 'ipl', word: { en: 'IPL', hi: 'आईपीएल' }, category: 'bollywood' },
  { id: 'cwc', word: { en: 'Cricket World Cup', hi: 'क्रिकेट विश्व कप' }, category: 'bollywood' },
  { id: 'playback-singer', word: { en: 'Playback Singer', hi: 'पार्श्व गायक' }, category: 'bollywood' },
  { id: 'reality-show', word: { en: 'Reality Show', hi: 'रियलिटी शो' }, category: 'bollywood' },

  { id: 'taj-mahal', word: { en: 'Taj Mahal', hi: 'ताज महल' }, category: 'places' },
  { id: 'goa', word: { en: 'Goa', hi: 'गोवा' }, category: 'places' },
  { id: 'kashmir', word: { en: 'Kashmir', hi: 'कश्मीर' }, category: 'places' },
  { id: 'mumbai-local', word: { en: 'Mumbai Local Train', hi: 'मुंबई लोकल ट्रेन' }, category: 'places' },
  { id: 'red-fort', word: { en: 'Red Fort', hi: 'लाल किला' }, category: 'places' },
  { id: 'ganga', word: { en: 'Ganga River', hi: 'गंगा नदी' }, category: 'places' },
  { id: 'rajasthan-fort', word: { en: 'Rajasthan Fort', hi: 'राजस्थान का किला' }, category: 'places' },
  { id: 'kerala-backwaters', word: { en: 'Kerala Backwaters', hi: 'केरल के बैकवाटर' }, category: 'places' },
  { id: 'delhi-metro', word: { en: 'Delhi Metro', hi: 'दिल्ली मेट्रो' }, category: 'places' },
  { id: 'himalayas', word: { en: 'Himalayas', hi: 'हिमालय' }, category: 'places' },

  { id: 'umbrella', word: { en: 'Umbrella', hi: 'छाता' }, category: 'objects' },
  { id: 'ceiling-fan', word: { en: 'Ceiling Fan', hi: 'पंखा' }, category: 'objects' },
  { id: 'steel-tiffin', word: { en: 'Steel Tiffin', hi: 'स्टील का टिफ़िन' }, category: 'objects' },
  { id: 'mobile-charger', word: { en: 'Mobile Charger', hi: 'मोबाइल चार्जर' }, category: 'objects' },
  { id: 'chappal', word: { en: 'Chappal (Slippers)', hi: 'चप्पल' }, category: 'objects' },
  { id: 'pressure-cooker', word: { en: 'Pressure Cooker', hi: 'प्रेशर कुकर' }, category: 'objects' },
  { id: 'rickshaw', word: { en: 'Rickshaw', hi: 'रिक्शा' }, category: 'objects' },
  { id: 'sunglasses', word: { en: 'Sunglasses', hi: 'धूप का चश्मा' }, category: 'objects' },
  { id: 'wristwatch', word: { en: 'Wristwatch', hi: 'कलाई घड़ी' }, category: 'objects' },
  { id: 'bicycle', word: { en: 'Bicycle', hi: 'साइकिल' }, category: 'objects' },

  { id: 'biryani', word: { en: 'Biryani', hi: 'बिरयानी' }, category: 'food' },
  { id: 'samosa', word: { en: 'Samosa', hi: 'समोसा' }, category: 'food' },
  { id: 'masala-chai', word: { en: 'Masala Chai', hi: 'मसाला चाय' }, category: 'food' },
  { id: 'golgappa', word: { en: 'Golgappa', hi: 'गोलगप्पा' }, category: 'food' },
  { id: 'mango', word: { en: 'Mango', hi: 'आम' }, category: 'food' },
  { id: 'butter-chicken', word: { en: 'Butter Chicken', hi: 'बटर चिकन' }, category: 'food' },
  { id: 'rasgulla', word: { en: 'Rasgulla', hi: 'रसगुल्ला' }, category: 'food' },
  { id: 'vada-pav', word: { en: 'Vada Pav', hi: 'वड़ा पाव' }, category: 'food' },
  { id: 'filter-coffee', word: { en: 'Filter Coffee', hi: 'फ़िल्टर कॉफ़ी' }, category: 'food' },
  { id: 'ice-cream', word: { en: 'Ice Cream', hi: 'आइसक्रीम' }, category: 'food' },

  { id: 'doctor', word: { en: 'Doctor', hi: 'डॉक्टर' }, category: 'professions' },
  { id: 'teacher', word: { en: 'Teacher', hi: 'शिक्षक' }, category: 'professions' },
  { id: 'cricketer', word: { en: 'Cricketer', hi: 'क्रिकेटर' }, category: 'professions' },
  { id: 'police-officer', word: { en: 'Police Officer', hi: 'पुलिस अधिकारी' }, category: 'professions' },
  { id: 'chef', word: { en: 'Chef', hi: 'शेफ़' }, category: 'professions' },
  { id: 'farmer', word: { en: 'Farmer', hi: 'किसान' }, category: 'professions' },
  { id: 'pilot', word: { en: 'Pilot', hi: 'पायलट' }, category: 'professions' },
  { id: 'politician', word: { en: 'Politician', hi: 'राजनेता' }, category: 'professions' },
  { id: 'auto-driver', word: { en: 'Auto Driver', hi: 'ऑटो चालक' }, category: 'professions' },
  { id: 'software-engineer', word: { en: 'Software Engineer', hi: 'सॉफ्टवेयर इंजीनियर' }, category: 'professions' }
]

function shuffle(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function filterWords(selectedCategories) {
  if (!selectedCategories || selectedCategories.length === 0) return WORDS
  return WORDS.filter(w => selectedCategories.includes(w.category))
}

export function pickSecretWord(pool, usedIds = [], rng = Math.random) {
  if (!pool || pool.length === 0) return null
  const unused = pool.filter(w => !usedIds.includes(w.id))
  const candidates = unused.length > 0 ? unused : pool
  const idx = Math.floor(rng() * candidates.length)
  return candidates[idx]
}

export function pickGuessOptions(correctWord, pool, count = 5, rng = Math.random) {
  if (!correctWord) return []
  const distractors = pool.filter(w => w.id !== correctWord.id)
  const shuffled = shuffle(distractors, rng).slice(0, Math.max(0, count - 1))
  return shuffle([correctWord, ...shuffled], rng)
}
