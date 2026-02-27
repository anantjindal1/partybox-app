// Mock firebase/firestore — define fns inside factory (hoisting-safe)
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, collection, id) => ({ collection, id })),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  onSnapshot: jest.fn(),
  arrayUnion: jest.fn(val => ({ __arrayUnion: val })),
  serverTimestamp: jest.fn(() => ({ __serverTimestamp: true }))
}))

jest.mock('../src/firebase', () => ({ db: {} }))

import { doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { createRoom, joinRoom, subscribeToRoom, sendRoomAction } from '../src/services/room'

beforeEach(() => {
  setDoc.mockReset()
  updateDoc.mockReset()
  onSnapshot.mockReset()
  doc.mockClear()
})

test('createRoom calls setDoc with correct shape', async () => {
  setDoc.mockResolvedValueOnce(undefined)

  const code = await createRoom('host-123', 'Alice', 'lucky-number')

  expect(setDoc).toHaveBeenCalledTimes(1)
  const [, docData] = setDoc.mock.calls[0]
  expect(docData).toMatchObject({
    hostId: 'host-123',
    gameSlug: 'lucky-number',
    players: [{ id: 'host-123', name: 'Alice' }],
    status: 'waiting',
    state: {}
  })
  expect(typeof docData.code).toBe('string')
  expect(docData.code).toHaveLength(4)
  expect(code).toBe(docData.code)
})

test('createRoom generates uppercase alphanumeric code', async () => {
  setDoc.mockResolvedValue(undefined)

  const codes = new Set()
  for (let i = 0; i < 10; i++) {
    const code = await createRoom('h', 'H', 'g')
    codes.add(code)
    expect(code).toMatch(/^[A-Z0-9]{4}$/)
  }
  expect(codes.size).toBeGreaterThan(1)
})

test('joinRoom calls updateDoc with arrayUnion', async () => {
  updateDoc.mockResolvedValueOnce(undefined)

  await joinRoom('ABCD', 'player-456', 'Bob')

  expect(updateDoc).toHaveBeenCalledTimes(1)
  const [, updates] = updateDoc.mock.calls[0]
  expect(updates.players).toEqual({ __arrayUnion: { id: 'player-456', name: 'Bob' } })
})

test('subscribeToRoom calls onSnapshot and invokes callback with room data', () => {
  const fakeRoom = { code: 'WXYZ', status: 'waiting', players: [] }
  onSnapshot.mockImplementation((ref, cb) => {
    cb({ exists: () => true, data: () => fakeRoom })
    return jest.fn() // unsubscribe
  })

  const callback = jest.fn()
  const unsub = subscribeToRoom('WXYZ', callback)

  expect(onSnapshot).toHaveBeenCalledTimes(1)
  expect(callback).toHaveBeenCalledWith(fakeRoom)
  expect(typeof unsub).toBe('function')
})

test('sendRoomAction calls updateDoc with action as state', async () => {
  updateDoc.mockResolvedValueOnce(undefined)

  await sendRoomAction('ABCD', { target: 7, guesses: {} })

  expect(updateDoc).toHaveBeenCalledWith(
    expect.anything(),
    { state: { target: 7, guesses: {} } }
  )
})
