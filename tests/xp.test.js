// Mock utils/id to avoid crypto.randomUUID not available in jsdom
jest.mock('../src/utils/id', () => ({
  generateId: jest.fn(() => 'test-id-' + Math.random())
}))

// Mock db
const mockSyncQueue = {}
const mockDB = {
  put: jest.fn(async (store, value) => {
    if (store === 'syncQueue') mockSyncQueue[value.id] = value
  }),
  getAll: jest.fn(async (store) => {
    if (store === 'syncQueue') return Object.values(mockSyncQueue)
    return []
  }),
  delete: jest.fn(async (store, id) => {
    if (store === 'syncQueue') delete mockSyncQueue[id]
  })
}
jest.mock('../src/services/db', () => ({ getDB: jest.fn(async () => mockDB) }))

// Mock profile service
const mockProfile = { id: 'guest', name: 'Player', avatar: '🎲', xp: 0, badges: [] }
jest.mock('../src/services/profile', () => ({
  getProfile: jest.fn(async () => ({ ...mockProfile })),
  saveProfile: jest.fn(async (updates) => {
    Object.assign(mockProfile, updates)
    return { ...mockProfile }
  })
}))

// Mock firebase — define fn inside factory (hoisting-safe)
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn()
}))
jest.mock('../src/firebase', () => ({ db: {} }))

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  configurable: true,
  get: jest.fn(() => false)
})

import { setDoc } from 'firebase/firestore'
import { awardXP, syncXP } from '../src/services/xp'

beforeEach(() => {
  mockProfile.xp = 0
  Object.keys(mockSyncQueue).forEach(k => delete mockSyncQueue[k])
  mockDB.put.mockClear()
  mockDB.getAll.mockClear()
  mockDB.delete.mockClear()
  setDoc.mockReset()
  jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
})

test('awardXP increments profile xp locally', async () => {
  const { saveProfile } = await import('../src/services/profile')

  const newXp = await awardXP(50)

  expect(newXp).toBe(50)
  expect(saveProfile).toHaveBeenCalledWith({ xp: 50 })
})

test('awardXP queues sync entry in idb', async () => {
  await awardXP(100)

  expect(mockDB.put).toHaveBeenCalledWith(
    'syncQueue',
    expect.objectContaining({ userId: 'guest', xp: 100 })
  )
})

test('awardXP does not sync when offline', async () => {
  jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)

  await awardXP(25)

  expect(setDoc).not.toHaveBeenCalled()
})

test('awardXP syncs to Firebase when online', async () => {
  jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
  setDoc.mockResolvedValueOnce(undefined)
  mockDB.getAll.mockResolvedValueOnce([{ id: 'q1', userId: 'guest', xp: 75 }])

  await awardXP(75)

  expect(setDoc).toHaveBeenCalled()
})

test('syncXP clears queue after successful sync', async () => {
  mockDB.getAll.mockResolvedValueOnce([
    { id: 'item-1', userId: 'guest', xp: 50 },
    { id: 'item-2', userId: 'guest', xp: 100 }
  ])
  setDoc.mockResolvedValueOnce(undefined)

  await syncXP()

  expect(mockDB.delete).toHaveBeenCalledWith('syncQueue', 'item-1')
  expect(mockDB.delete).toHaveBeenCalledWith('syncQueue', 'item-2')
})

test('syncXP silently fails and keeps queue when Firebase errors', async () => {
  mockDB.getAll.mockResolvedValueOnce([{ id: 'q1', userId: 'guest', xp: 50 }])
  setDoc.mockRejectedValueOnce(new Error('Network error'))

  await expect(syncXP()).resolves.not.toThrow()
  expect(mockDB.delete).not.toHaveBeenCalled()
})

test('syncXP does nothing when queue is empty', async () => {
  mockDB.getAll.mockResolvedValueOnce([])

  await syncXP()

  expect(setDoc).not.toHaveBeenCalled()
})
