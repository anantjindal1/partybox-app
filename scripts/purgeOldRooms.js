/**
 * Deletes rooms (and their actions / reactions / voice sub-collections)
 * older than MAX_AGE_HOURS. Talks to Firestore over REST
 * with the public web API key, which works because the security rules
 * allow it — see .github/workflows/purge-rooms.yml, which runs this daily.
 *
 * Env: FIREBASE_PROJECT_ID, FIREBASE_API_KEY, MAX_AGE_HOURS (default 24),
 * DRY_RUN=1 to count without deleting.
 */
const SUBCOLLECTIONS = ['actions', 'reactions', 'voice']
const PAGE_SIZE = 300
const CONCURRENCY = 10

export function isOlderThan(createTime, cutoffMs) {
  return !!createTime && Date.parse(createTime) < cutoffMs
}

export async function purgeOldRooms({ fetchFn = fetch, projectId, apiKey, maxAgeHours = 24, dryRun = false, now = Date.now(), log = () => {} }) {
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
  const cutoffMs = now - maxAgeHours * 60 * 60 * 1000
  const stats = { rooms: 0, subDocs: 0, skipped: 0 }

  async function request(method, path, query = '') {
    const res = await fetchFn(`${base}/${path}?key=${apiKey}${query}`, { method })
    if (!res.ok) throw Object.assign(new Error(`${method} ${path} -> ${res.status}`), { status: res.status })
    return method === 'GET' ? res.json() : null
  }

  async function listAll(path) {
    const docs = []
    let pageToken = ''
    do {
      const page = await request('GET', path, `&pageSize=${PAGE_SIZE}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`)
      docs.push(...(page.documents ?? []))
      pageToken = page.nextPageToken ?? ''
    } while (pageToken)
    return docs
  }

  const relative = docName => docName.split('/documents/')[1]

  async function inBatches(items, worker) {
    for (let i = 0; i < items.length; i += CONCURRENCY) {
      await Promise.all(items.slice(i, i + CONCURRENCY).map(worker))
    }
  }

  async function purgeChildren(roomId) {
    for (const sub of SUBCOLLECTIONS) {
      let children
      try {
        children = await listAll(`rooms/${roomId}/${sub}`)
      } catch (err) {
        // A collection the deployed rules don't cover yet (403) is skipped, not fatal.
        stats.skipped++
        log(`skip rooms/${roomId}/${sub}: ${err.message}`)
        continue
      }
      stats.subDocs += children.length
      if (!dryRun) await inBatches(children, child => request('DELETE', relative(child.name)))
    }
  }

  const rooms = await listAll('rooms')
  await inBatches(rooms.filter(room => isOlderThan(room.createTime, cutoffMs)), async room => {
    const roomId = relative(room.name).split('/')[1]
    await purgeChildren(roomId)
    stats.rooms++
    if (!dryRun) await request('DELETE', `rooms/${roomId}`)
  })
  return stats
}

if (process.argv[1] && process.argv[1].endsWith('purgeOldRooms.js')) {
  const { FIREBASE_PROJECT_ID: projectId, FIREBASE_API_KEY: apiKey } = process.env
  if (!projectId || !apiKey) {
    console.error('Set FIREBASE_PROJECT_ID and FIREBASE_API_KEY')
    process.exit(1)
  }
  const dryRun = process.env.DRY_RUN === '1'
  const maxAgeHours = Number(process.env.MAX_AGE_HOURS ?? 24)
  purgeOldRooms({ projectId, apiKey, maxAgeHours, dryRun, log: console.warn })
    .then(stats => console.log(`${dryRun ? 'Would delete' : 'Deleted'}: ${stats.rooms} rooms, ${stats.subDocs} sub-collection docs (${stats.skipped} sub-collections skipped)`))
    .catch(err => { console.error(err); process.exit(1) })
}
