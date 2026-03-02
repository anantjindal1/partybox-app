import { getDB } from './db'

const DEVICE_ID_KEY = 'partybox_device_id'
const LEGACY_ID = 'guest'

function getDeviceId() {
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
