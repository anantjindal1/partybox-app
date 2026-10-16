import { PROMPTS } from './prompts'

export const MAX_SLOTS = 12
export const SPIN_MS = 3500

export const RATINGS = [
  { value: 5, key: 'tdGreat' },
  { value: 4, key: 'tdGood' },
  { value: 3, key: 'tdOkay' },
  { value: 2, key: 'tdSoSo' },
  { value: 0, key: 'tdBoo' },
]

const mod = (a, n) => ((a % n) + n) % n

// Prompts never repeat until that setting+type's deck has run out.
export function pickPrompt(setting, type, usedIds = [], rng = Math.random) {
  const pool = PROMPTS[setting]?.[type] ?? []
  if (pool.length === 0) return null
  const fresh = pool.filter(p => !usedIds.includes(p.id))
  const candidates = fresh.length > 0 ? fresh : pool
  return candidates[Math.floor(rng() * candidates.length)]
}

export function findPrompt(setting, type, id) {
  return (PROMPTS[setting]?.[type] ?? []).find(p => p.id === id) ?? null
}

// 'random' is a real bottle; 'cycle' gives everyone a turn before anyone repeats.
export function pickNextSlot(slotIds, mode, cycleDone = [], rng = Math.random) {
  if (slotIds.length === 0) return { id: null, cycleDone }
  if (mode !== 'cycle') {
    return { id: slotIds[Math.floor(rng() * slotIds.length)], cycleDone }
  }
  const remaining = slotIds.filter(id => !cycleDone.includes(id))
  const pool = remaining.length > 0 ? remaining : slotIds
  const id = pool[Math.floor(rng() * pool.length)]
  const base = remaining.length > 0 ? cycleDone.filter(d => slotIds.includes(d)) : []
  return { id, cycleDone: [...base, id] }
}

// Needle angle (degrees clockwise from 12 o'clock) after a spin that always
// moves forward at least 5 full turns and lands inside segment `index`.
export function spinRotation(prevRotation, index, count, rng = Math.random) {
  const seg = 360 / count
  const target = (index + 0.5) * seg + (rng() - 0.5) * seg * 0.7
  return prevRotation + 5 * 360 + mod(target - prevRotation, 360)
}

export function segmentAt(rotation, count) {
  return Math.floor(mod(rotation, 360) / (360 / count))
}

export function averageRating(values) {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function addTurnScore(scores, id, name, avg) {
  const prev = scores[id] ?? { sum: 0, turns: 0 }
  return { ...scores, [id]: { name, sum: prev.sum + avg, turns: prev.turns + 1 } }
}

export function leaderboard(scores) {
  return Object.entries(scores)
    .map(([id, s]) => ({ id, name: s.name, turns: s.turns, avg: s.sum / s.turns }))
    .sort((a, b) => b.avg - a.avg || b.turns - a.turns)
}
