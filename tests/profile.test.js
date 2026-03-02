// Mock the db module
const mockStore = {}
const mockDB = {
  get: jest.fn(async (store, key) => mockStore[`${store}:${key}`]),
  put: jest.fn(async (store, value) => {
    mockStore[`${store}:${value.id}`] = value
    return value
  }),
  delete: jest.fn(async (store, key) => {
    delete mockStore[`${store}:${key}`]
  })
}

jest.mock('../src/services/db', () => ({
  getDB: jest.fn(async () => mockDB)
}))

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} }
  }
})()
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

const mockRandomUUID = jest.fn(() => 'mock-uuid-1234')
Object.defineProperty(global, 'crypto', {
  value: { randomUUID: mockRandomUUID },
  writable: true,
  configurable: true
})

import { getProfile, saveProfile, awardBadge } from '../src/services/profile'

beforeEach(() => {
  Object.keys(mockStore).forEach(k => delete mockStore[k])
  mockDB.get.mockClear()
  mockDB.put.mockClear()
  mockDB.delete.mockClear()
  localStorageMock.clear()
  mockRandomUUID.mockClear()
  mockRandomUUID.mockReturnValue('mock-uuid-1234')
})

// ─── Device UUID ─────────────────────────────────────────────────────────────

test('getDeviceId: generates a UUID and stores it on first call', async () => {
  mockDB.get.mockResolvedValueOnce(undefined) // new UUID key
  mockDB.get.mockResolvedValueOnce(undefined) // no legacy 'guest' key

  await getProfile()

  expect(mockRandomUUID).toHaveBeenCalledTimes(1)
  expect(localStorage.getItem('partybox_device_id')).toBe('mock-uuid-1234')
})

test('getDeviceId: returns the same UUID on subsequent calls', async () => {
  localStorage.setItem('partybox_device_id', 'existing-uuid')
  mockDB.get.mockResolvedValueOnce({ id: 'existing-uuid', name: 'Player', avatar: '🎲', xp: 0, badges: [] })

  const profile = await getProfile()

  expect(mockRandomUUID).not.toHaveBeenCalled()
  expect(profile.id).toBe('existing-uuid')
})

// ─── Default profile creation ─────────────────────────────────────────────────

test('getProfile creates default profile when none exists', async () => {
  mockDB.get.mockResolvedValueOnce(undefined) // new UUID key
  mockDB.get.mockResolvedValueOnce(undefined) // legacy 'guest' key

  const profile = await getProfile()

  expect(profile).toMatchObject({
    id: 'mock-uuid-1234',
    name: 'Player',
    avatar: '🎲',
    xp: 0,
    badges: []
  })
  expect(mockDB.put).toHaveBeenCalledWith('profile', expect.objectContaining({ id: 'mock-uuid-1234' }))
})

test('getProfile returns existing profile by device UUID', async () => {
  const existing = { id: 'mock-uuid-1234', name: 'Alice', avatar: '🦊', xp: 150, badges: ['🏆'] }
  mockDB.get.mockResolvedValueOnce(existing)

  const profile = await getProfile()

  expect(profile).toEqual(existing)
  expect(mockDB.put).not.toHaveBeenCalled()
})

// ─── Legacy 'guest' migration ─────────────────────────────────────────────────

test('migrates legacy guest profile to device UUID key', async () => {
  const legacyProfile = { id: 'guest', name: 'OldUser', avatar: '🐯', xp: 500, badges: ['star'] }
  mockDB.get
    .mockResolvedValueOnce(undefined)      // UUID key not found
    .mockResolvedValueOnce(legacyProfile)  // 'guest' key found

  const profile = await getProfile()

  expect(profile.id).toBe('mock-uuid-1234')
  expect(profile.name).toBe('OldUser')
  expect(profile.xp).toBe(500)
  expect(mockDB.put).toHaveBeenCalledWith('profile', expect.objectContaining({ id: 'mock-uuid-1234' }))
  expect(mockDB.delete).toHaveBeenCalledWith('profile', 'guest')
})

// ─── saveProfile ──────────────────────────────────────────────────────────────

test('saveProfile merges updates with existing profile', async () => {
  const existing = { id: 'mock-uuid-1234', name: 'Player', avatar: '🎲', xp: 0, badges: [] }
  mockDB.get.mockResolvedValue(existing)

  const updated = await saveProfile({ name: 'Bob', xp: 50 })

  expect(updated).toMatchObject({
    id: 'mock-uuid-1234',
    name: 'Bob',
    avatar: '🎲',
    xp: 50,
    badges: []
  })
  expect(mockDB.put).toHaveBeenCalledWith('profile', updated)
})

test('saveProfile preserves fields not in updates', async () => {
  const existing = { id: 'mock-uuid-1234', name: 'Alice', avatar: '🦁', xp: 200, badges: ['🎯'] }
  mockDB.get.mockResolvedValue(existing)

  const updated = await saveProfile({ xp: 300 })

  expect(updated.name).toBe('Alice')
  expect(updated.avatar).toBe('🦁')
  expect(updated.badges).toEqual(['🎯'])
  expect(updated.xp).toBe(300)
})

// ─── awardBadge ───────────────────────────────────────────────────────────────

test('awardBadge appends badge to profile', async () => {
  const existing = { id: 'mock-uuid-1234', name: 'Player', avatar: '🎲', xp: 0, badges: [] }
  mockDB.get.mockResolvedValue(existing)

  const updated = await awardBadge('luckyGuesser')

  expect(updated.badges).toContain('luckyGuesser')
  expect(mockDB.put).toHaveBeenCalledWith('profile', expect.objectContaining({ badges: ['luckyGuesser'] }))
})

test('awardBadge deduplicates — does not add badge if already present', async () => {
  const existing = { id: 'mock-uuid-1234', name: 'Player', avatar: '🎲', xp: 0, badges: ['luckyGuesser'] }
  mockDB.get.mockResolvedValue(existing)

  const result = await awardBadge('luckyGuesser')

  expect(result.badges).toEqual(['luckyGuesser'])
  expect(mockDB.put).not.toHaveBeenCalled()
})

test('awardBadge can add multiple different badges', async () => {
  const existing = { id: 'mock-uuid-1234', name: 'Player', avatar: '🎲', xp: 0, badges: ['luckyGuesser'] }
  mockDB.get.mockResolvedValue(existing)

  const updated = await awardBadge('speedster')

  expect(updated.badges).toEqual(['luckyGuesser', 'speedster'])
})
