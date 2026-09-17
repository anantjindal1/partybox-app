import { getDB } from './db'

const DEVICE_ID_KEY = 'partybox_device_id'
const TEST_DEVICE_ID_KEY = 'partybox_test_device_id'
const LEGACY_ID = 'guest'

// Solo multi-tab testing (see /test-lab): a `?testAs=<id>` URL param pins this
// TAB's identity via sessionStorage (tab-scoped, unlike the real device id
// below which is localStorage and shared across every tab of this origin).
// Once set, it sticks for the tab's lifetime even after the param drops off
// the URL on later navigations.
function getTestOverrideId() {
  if (typeof window === 'undefined') return null
  const fromUrl = new URLSearchParams(window.location.search).get('testAs')
  if (fromUrl) {
    sessionStorage.setItem(TEST_DEVICE_ID_KEY, fromUrl)
    return fromUrl
  }
  return sessionStorage.getItem(TEST_DEVICE_ID_KEY)
}

export function getDeviceId() {
  const testId = getTestOverrideId()
  if (testId) return testId
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

export async function getProfile() {
  const db = await getDB()
  const deviceId = getDeviceId()

  let profile = await db.get('profile', deviceId)
  if (!profile) {
    // Migrate legacy 'guest' profile if it exists
    const legacy = await db.get('profile', LEGACY_ID)
    if (legacy) {
      profile = { ...legacy, id: deviceId }
      await db.put('profile', profile)
      await db.delete('profile', LEGACY_ID).catch(() => {})
    } else {
      profile = { id: deviceId, name: 'Player', avatar: '🎲', xp: 0, badges: [] }
      await db.put('profile', profile)
    }
  }
  return profile
}

export async function saveProfile(updates) {
  const db = await getDB()
  const profile = await getProfile()
  const updated = { ...profile, ...updates }
  await db.put('profile', updated)
  return updated
}

export async function awardBadge(badgeId) {
  const db = await getDB()
  const profile = await getProfile()
  if (profile.badges.includes(badgeId)) return profile
  const updated = { ...profile, badges: [...profile.badges, badgeId] }
  await db.put('profile', updated)
  return updated
}
