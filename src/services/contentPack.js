import { getDB } from './db'

export async function loadPack(slug) {
  const db = await getDB()
  const cached = await db.get('packs', slug)
  if (cached) return cached.data

  const res = await fetch(`/packs/${slug}.json`)
  if (!res.ok) throw new Error(`Pack not found: ${slug}`)
  const data = await res.json()
  await db.put('packs', { slug, data, cachedAt: Date.now() })
  return data
}
