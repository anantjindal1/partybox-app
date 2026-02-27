import { useState, useEffect } from 'react'
import { getProfile, saveProfile } from '../services/profile'

export function useProfile() {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    getProfile().then(setProfile)
  }, [])

  const update = async (updates) => {
    const updated = await saveProfile(updates)
    setProfile(updated)
    return updated
  }

  return { profile, update }
}
