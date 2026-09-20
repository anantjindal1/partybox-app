import { purgeOldRooms, isOlderThan } from '../scripts/purgeOldRooms'

const NOW = Date.parse('2026-09-21T12:00:00Z')
const hoursAgo = h => new Date(NOW - h * 3600 * 1000).toISOString()
const DOCS = '/documents/'

// Minimal in-memory Firestore REST: paths -> docs, GET lists, DELETE removes.
function fakeFirestore(docs) {
  const deleted = []
  const fetchFn = async (url, { method }) => {
    const path = decodeURIComponent(url.split(DOCS)[1].split('?')[0])
    if (method === 'DELETE') {
      deleted.push(path)
      return { ok: true }
    }
    const depth = path.split('/').length
    const listed = Object.entries(docs)
      .filter(([p]) => p.startsWith(path + '/') && p.split('/').length === depth + 1)
      .map(([p, createTime]) => ({ name: `projects/p/databases/(default)${DOCS}${p}`, ...(createTime ? { createTime } : {}) }))
    return { ok: true, json: async () => ({ documents: listed }) }
  }
  return { fetchFn, deleted }
}

const run = (docs, opts = {}) => {
  const fs = fakeFirestore(docs)
  return purgeOldRooms({ fetchFn: fs.fetchFn, projectId: 'p', apiKey: 'k', now: NOW, ...opts }).then(stats => ({ stats, deleted: fs.deleted.sort() }))
}

describe('isOlderThan', () => {
  test('compares an ISO time to a cutoff and treats a missing time as not older', () => {
    expect(isOlderThan(hoursAgo(30), NOW - 24 * 3600 * 1000)).toBe(true)
    expect(isOlderThan(hoursAgo(1), NOW - 24 * 3600 * 1000)).toBe(false)
    expect(isOlderThan(undefined, NOW)).toBe(false)
  })
})

describe('purgeOldRooms', () => {
  test('deletes an old room with its sub-collections and keeps a fresh room untouched', async () => {
    const { stats, deleted } = await run({
      'rooms/OLD1': hoursAgo(30),
      'rooms/OLD1/voice/a': hoursAgo(30),
      'rooms/OLD1/actions/b': hoursAgo(1),
      'rooms/NEW1': hoursAgo(2),
      'rooms/NEW1/voice/c': hoursAgo(2)
    })
    expect(deleted).toEqual(['rooms/OLD1', 'rooms/OLD1/actions/b', 'rooms/OLD1/voice/a'])
    expect(stats).toMatchObject({ rooms: 1, subDocs: 2 })
  })

  test('dry run counts but deletes nothing', async () => {
    const { stats, deleted } = await run({ 'rooms/OLD1': hoursAgo(30), 'rooms/OLD1/voice/a': hoursAgo(30) }, { dryRun: true })
    expect(deleted).toEqual([])
    expect(stats).toMatchObject({ rooms: 1, subDocs: 1 })
  })
})
