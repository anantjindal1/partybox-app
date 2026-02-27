import { getDB } from './db'

const PROFILE_ID = 'guest'

export async function getProfile() {
  const db = await getDB()
  let profile = await db.get('profile', PROFILE_ID)
  if (!profile) {
    profile = { id: PROFILE_ID, name: 'Player', avatar: '🎲', xp: 0, badges: [] }
    await db.put('profile', profile)
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
