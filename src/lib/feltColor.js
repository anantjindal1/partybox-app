import { useSyncExternalStore } from 'react'

// Table felt choices for the royal card table. Shades are precomputed
// rather than derived with CSS color-mix(), which older Android WebViews lack.
export const FELT_OPTIONS = [
  { id: 'teal', label: 'Teal', hex: '#1f6f6c' },
  { id: 'emerald', label: 'Emerald', hex: '#1d6b45' },
  { id: 'navy', label: 'Navy', hex: '#25336f' },
  { id: 'maroon', label: 'Maroon', hex: '#6e1f2c' },
  { id: 'charcoal', label: 'Charcoal', hex: '#363c42' }
]

const KEY = 'partybox_felt'
const listeners = new Set()

function mix(hex, target, amount) {
  const from = hex.match(/\w\w/g).map(h => parseInt(h, 16))
  const to = target.match(/\w\w/g).map(h => parseInt(h, 16))
  return `rgb(${from.map((c, i) => Math.round(c + (to[i] - c) * amount)).join(' ')})`
}

function find(id) {
  return FELT_OPTIONS.find(o => o.id === id) ?? FELT_OPTIONS[0]
}

let current = (() => {
  try { return find(localStorage.getItem(KEY)) } catch { return FELT_OPTIONS[0] }
})()

export function setFelt(id) {
  current = find(id)
  try { localStorage.setItem(KEY, current.id) } catch { /* storage unavailable */ }
  listeners.forEach(listener => listener())
}

export function useFelt() {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current
  )
}

export function feltVars(felt) {
  return {
    '--felt': felt.hex,
    '--felt-light': mix(felt.hex, '#c8fff6', 0.28),
    '--felt-shade': mix(felt.hex, '#000000', 0.55),
    '--felt-dark': mix(felt.hex, '#000000', 0.45),
    '--felt-deep': mix(felt.hex, '#000000', 0.72),
    '--felt-glow': mix(felt.hex, '#000000', 0.1).replace(')', ' / 0.45)')
  }
}
