/**
 * Offline A–Z categories dictionary. Case-insensitive lookups.
 * Pre-indexed for fast lookups (<50ms). Indian-focused words where relevant.
 */
const ALL_CATEGORIES = [
  'Name',
  'Place',
  'Animal',
  'Thing',
  'Bollywood Movie',
  'Indian Food',
  'Profession',
  'Festival',
  'Cricket Term',
  'Brand'
]

const DICTIONARY = {
  A: {
    Name: ['Amit', 'Anil', 'Arjun', 'Ayesha', 'Ananya', 'Aditya', 'Aarav', 'Anjali', 'Arun', 'Asha', 'Aman', 'Aarti'],
    Place: ['Agra', 'Ahmedabad', 'Amritsar', 'Allahabad', 'Aurangabad', 'Andaman', 'Assam', 'Ayodhya', 'Ajmer', 'Aligarh', 'Amritsar', 'Aizawl'],
    Animal: ['Ant', 'Antelope', 'Ape', 'Alligator', 'Alpaca', 'Anaconda', 'Albatross', 'Armadillo', 'Axolotl', 'Aardvark', 'Albatross', 'Anchovy'],
    Thing: ['Apple', 'Anchor', 'Arrow', 'Album', 'Ambulance', 'Apron', 'Antenna', 'Armchair', 'Aspirin', 'Atlas', 'Axe', 'Amber'],
    'Bollywood Movie': ['Andaz Apna Apna', 'Anand', 'Amar Akbar Anthony', 'Aashiqui', 'Agneepath', 'Anand', 'Aitraaz', 'Amar Prem', 'Awaara', 'Anari', 'Aradhana', 'Amar'],
    'Indian Food': ['Aloo', 'Aloo Gobi', 'Aloo Paratha', 'Appam', 'Aamras', 'Achari', 'Adai', 'Aloo Tikki', 'Aam Panna', 'Aloo Sabzi', 'Aviyal', 'Arhar Dal'],
    Profession: ['Actor', 'Accountant', 'Architect', 'Astronaut', 'Author', 'Artist', 'Analyst', 'Ambassador', 'Animator', 'Arbitrator', 'Archaeologist', 'Athlete'],
    Festival: ['Ayudha Pooja', 'Akshaya Tritiya', 'Anant Chaturdashi', 'Adelaide', 'Aadi', 'Ahoi Ashtami', 'Aadi Perukku', 'Avani Avittam', 'Aadi', 'Amavasya', 'Aashad', 'Aipasi'],
    'Cricket Term': ['All-out', 'Appeal', 'Arm ball', 'Ashes', 'Average', 'All-rounder', 'Attack', 'Approach', 'Away swing', 'Arm guard', 'Adelaide', 'Ankle guard'],
    Brand: ['Amul', 'Asian Paints', 'Airtel', 'Axis Bank', 'Ambuja', 'Apollo', 'Acer', 'Adidas', 'Apple', 'Amazon', 'Audi', 'Airtel']
  },
  B: {
    Name: ['Babloo', 'Bina', 'Bharat', 'Bindu', 'Bhavna', 'Brijesh', 'Babita', 'Baldev', 'Bobby', 'Barkha', 'Bikram', 'Bela'],
    Place: ['Bombay', 'Bangalore', 'Bhopal', 'Bihar', 'Bikaner', 'Baroda', 'Bharatpur', 'Bundi', 'Bhavnagar', 'Bareilly', 'Bhilai', 'Bhubaneswar'],
    Animal: ['Bear', 'Buffalo', 'Bat', 'Butterfly', 'Bee', 'Baboon', 'Badger', 'Barracuda', 'Beaver', 'Bison', 'Boar', 'Bull'],
    Thing: ['Ball', 'Book', 'Bottle', 'Basket', 'Belt', 'Brush', 'Bicycle', 'Blanket', 'Bridge', 'Boat', 'Bell', 'Bangle'],
    'Bollywood Movie': ['Bajrangi Bhaijaan', 'Baghban', 'Barfi', 'Bajirao Mastani', 'Bajrangi', 'Bobby', 'Black', 'Bunty Aur Babli', 'Border', 'Beta', 'Boss', 'Befikre'],
    'Indian Food': ['Biryani', 'Butter Chicken', 'Bhel', 'Bhatura', 'Baingan Bharta', 'Besan Ladoo', 'Bajra Roti', 'Bonda', 'Barfi', 'Bhajiya', 'Bisi Bele Bath', 'Bread'],
    Profession: ['Baker', 'Banker', 'Barber', 'Builder', 'Butcher', 'Biologist', 'Broker', 'Bouncer', 'Brewer', 'Biochemist', 'Botanist', 'Bailiff'],
    Festival: ['Baisakhi', 'Basant Panchami', 'Bihu', 'Buddha Purnima', 'Bakrid', 'Bhai Dooj', 'Brahmostav', 'Bathukamma', 'Bonalu', 'Buddha Jayanti', 'Baisakh', 'Bhadra'],
    'Cricket Term': ['Bouncer', 'Boundary', 'Batsman', 'Bowl', 'Bail', 'Bat', 'Backfoot', 'Bump ball', 'Bye', 'Bowler', 'Backward point', 'Block'],
    Brand: ['Bata', 'Bajaj', 'Britannia', 'Bharat Petroleum', 'Berger', 'Blue Star', 'Boat', 'BharatPe', 'Big Bazaar', 'Bata', 'Bajaj Finserv', 'Bharat Forge']
  },
  C: {
    Name: ['Chandan', 'Chitra', 'Chetan', 'Charu', 'Champa', 'Chandan', 'Chhavi', 'Chirag', 'Chitra', 'Chand', 'Chandni', 'Chintu'],
    Place: ['Chennai', 'Chandigarh', 'Coimbatore', 'Calcutta', 'Cuttack', 'Chittoor', 'Churu', 'Chamba', 'Churu', 'Chittorgarh', 'Coorg', 'Chikmagalur'],
    Animal: ['Cat', 'Camel', 'Cow', 'Crocodile', 'Crab', 'Crow', 'Cobra', 'Cheetah', 'Chimpanzee', 'Caterpillar', 'Cockroach', 'Crane'],
    Thing: ['Chair', 'Clock', 'Camera', 'Car', 'Cup', 'Comb', 'Candle', 'Curtain', 'Couch', 'Cable', 'Calculator', 'Cap'],
    'Bollywood Movie': ['Chak De India', 'Chennai Express', 'Dilwale Dulhania', 'Coolie', 'Chupke Chupke', 'Choti Si Baat', 'Chandni', 'Chandni Bar', 'Company', 'Chandni', 'Cheeni Kum', 'Chakravyuh'],
    'Indian Food': ['Chole', 'Chai', 'Chutney', 'Curry', 'Chicken Tikka', 'Chana Masala', 'Chapati', 'Chole Bhature', 'Curd', 'Chakli', 'Chikki', 'Chana Dal'],
    Profession: ['Chef', 'Carpenter', 'Chemist', 'Consultant', 'Coach', 'Clerk', 'Conductor', 'Curator', 'Cartographer', 'Choreographer', 'Composer', 'Critic'],
    Festival: ['Christmas', 'Chhath', 'Chaitra Navratri', 'Chandan Yatra', 'Chitra Pournami', 'Champakulam', 'Chitra', 'Chaitra', 'Chaitra', 'Chaitra', 'Chaitra', 'Chaitra'],
    'Cricket Term': ['Cover', 'Crease', 'Catch', 'Century', 'Captain', 'Cut', 'Cross bat', 'Close-in', 'Cover drive', 'Caught', 'Chinaman', 'Corner'],
    Brand: ['Colgate', 'Cadbury', 'Cipla', 'Crompton', 'Castrol', 'Coca-Cola', 'Canon', 'Croma', 'Citibank', 'Cafe Coffee Day', 'Capgemini', 'Cipla']
  }
}

// Fill D–Z with stub words (each starts with letter) so every letter works
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
LETTERS.forEach(letter => {
  if (DICTIONARY[letter]) return
  DICTIONARY[letter] = {}
  ALL_CATEGORIES.forEach(cat => {
    DICTIONARY[letter][cat] = Array.from({ length: 12 }, (_, i) => `${letter}word${i + 1}`)
  })
})

/** All category keys. */
export function getCategoriesPool() {
  return [...ALL_CATEGORIES]
}

/** Uniform random letter A–Z. */
export function getRandomLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)]
}

/** Words for a letter and category. Case-insensitive. Returns a copy. */
export function getWords(letter, category) {
  const L = (letter || '').toString().trim().toUpperCase()
  const cat = ALL_CATEGORIES.find(c => c.toLowerCase() === (category || '').toString().trim().toLowerCase()) || category
  const list = DICTIONARY[L] && DICTIONARY[L][cat]
  return Array.isArray(list) ? [...list] : []
}

/** Check if word exists for letter+category (case-insensitive). Optional fuzzy: ≤1 char difference. */
export function hasWord(letter, category, word, fuzzy = false) {
  const w = (word || '').toString().trim()
  if (!w) return false
  const L = (letter || '').toString().trim().toUpperCase()
  if (w[0].toUpperCase() !== L) return false
  const list = getWords(L, category)
  const lower = w.toLowerCase()
  const exact = list.some(entry => entry.toLowerCase() === lower)
  if (exact) return true
  if (!fuzzy) return false
  return list.some(entry => {
    const e = entry.toLowerCase()
    if (Math.abs(e.length - lower.length) > 1) return false
    let diff = 0
    const max = Math.max(e.length, lower.length)
    for (let i = 0; i < max && diff <= 1; i++) {
      if (e[i] !== lower[i]) diff++
    }
    return diff <= 1
  })
}
