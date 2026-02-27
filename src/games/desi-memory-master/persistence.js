/**
 * Local persistence for Desi Memory Master best time and least mistakes per difficulty.
 * Uses localStorage only (no Firestore).
 */
const STORAGE_KEY = 'partybox_desi_memory_master_bests'

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function write(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (_) {}
}

/**
 * @param {string} difficulty - 'easy' | 'medium' | 'hard'
 * @returns {{ bestTime: number | null, leastMistakes: number | null }}
 */
export function getBests(difficulty) {
  const data = read()
  const d = data[difficulty] || {}
  return {
    bestTime: typeof d.bestTime === 'number' ? d.bestTime : null,
    leastMistakes: typeof d.leastMistakes === 'number' ? d.leastMistakes : null
  }
}

/**
 * Update best time and/or least mistakes for a difficulty if current is better.
 * @param {string} difficulty
 * @param {number} timeSeconds
 * @param {number} mistakes
 */
export function updateBests(difficulty, timeSeconds, mistakes) {
  const data = read()
  const current = data[difficulty] || {}
  let bestTime = current.bestTime
  let leastMistakes = current.leastMistakes
  if (bestTime == null || timeSeconds < bestTime) bestTime = timeSeconds
  if (leastMistakes == null || mistakes < leastMistakes) leastMistakes = mistakes
  data[difficulty] = { bestTime, leastMistakes }
  write(data)
  return { bestTime, leastMistakes }
}
