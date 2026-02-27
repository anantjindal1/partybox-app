// Mock the db module
const mockStore = {}
const mockDB = {
  get: jest.fn(async (store, key) => mockStore[`${store}:${key}`]),
  put: jest.fn(async (store, value) => {
    mockStore[`${store}:${value.id}`] = value
    return value
  })
}

jest.mock('../src/services/db', () => ({
  getDB: jest.fn(async () => mockDB)
}))

import { getProfile, saveProfile } from '../src/services/profile'

beforeEach(() => {
  // Clear mock store and reset mock call counts
  Object.keys(mockStore).forEach(k => delete mockStore[k])
  mockDB.get.mockClear()
  mockDB.put.mockClear()
})

test('getProfile creates default profile when none exists', async () => {
  mockDB.get.mockResolvedValueOnce(undefined)

  const profile = await getProfile()

  expect(profile).toMatchObject({
    id: 'guest',
    name: 'Player',
    avatar: '🎲',
    xp: 0,
    badges: []
  })
  expect(mockDB.put).toHaveBeenCalledWith('profile', expect.objectContaining({ id: 'guest' }))
})

test('getProfile returns existing profile', async () => {
  const existing = { id: 'guest', name: 'Alice', avatar: '🦊', xp: 150, badges: ['🏆'] }
  mockDB.get.mockResolvedValueOnce(existing)

  const profile = await getProfile()

  expect(profile).toEqual(existing)
  expect(mockDB.put).not.toHaveBeenCalled()
})

test('saveProfile merges updates with existing profile', async () => {
  const existing = { id: 'guest', name: 'Player', avatar: '🎲', xp: 0, badges: [] }
  mockDB.get.mockResolvedValue(existing)

  const updated = await saveProfile({ name: 'Bob', xp: 50 })

  expect(updated).toMatchObject({
    id: 'guest',
    name: 'Bob',
    avatar: '🎲',
    xp: 50,
    badges: []
  })
  expect(mockDB.put).toHaveBeenCalledWith('profile', updated)
})

test('saveProfile preserves fields not in updates', async () => {
  const existing = { id: 'guest', name: 'Alice', avatar: '🦁', xp: 200, badges: ['🎯'] }
  mockDB.get.mockResolvedValue(existing)

  const updated = await saveProfile({ xp: 300 })

  expect(updated.name).toBe('Alice')
  expect(updated.avatar).toBe('🦁')
  expect(updated.badges).toEqual(['🎯'])
  expect(updated.xp).toBe(300)
})
