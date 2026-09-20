const STORAGE_KEY = 'partybox_consent_v1'
const listeners = new Set()

/** 'granted' | 'denied' | null (not asked yet). */
export function getConsent() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

/** Pass null to forget the choice, so the banner asks again. */
export function setConsent(value) {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Storage blocked — the choice just won't persist past this page.
  }
  listeners.forEach(listener => listener())
}

export function subscribeConsent(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
