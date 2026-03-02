// Mock firebase/firestore — define fns inside factory (hoisting-safe)
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, ...parts) => ({ path: parts.join('/') })),
  collection: jest.fn((db, ...parts) => ({ path: parts.join('/') })),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
  arrayUnion: jest.fn(val => ({ __arrayUnion: val })),
  arrayRemove: jest.fn(val => ({ __arrayRemove: val })),
  getDocs: jest.fn(),
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(() => ({ __serverTimestamp: true }))
}))

jest.mock('../src/firebase', () => ({ db: {} }))

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayRemove,
  getDocs,
  writeBatch
} from 'firebase/firestore'

import {
  createRoom,
  joinRoom,
  subscribeToRoom,
  subscribeToActions,
  sendRoomAction,
  updateRoomState,
  deleteRoom,
  kickPlayer,
  writeAction,
  clearActions,
  isRoomExpired
} from '../src/services/room'

beforeEach(() => {
  setDoc.mockReset()
  getDoc.mockReset()
  updateDoc.mockReset()
  deleteDoc.mockReset()
  onSnapshot.mockReset()
  getDocs.mockReset()
  writeBatch.mockReset()
  doc.mockClear()
})

// ─── isRoomExpired ────────────────────────────────────────────────────────────

test('isRoomExpired returns false for a fresh room', () => {
  const room = { createdAt: { toMillis: () => Date.now() - 60_000 } } // 1 min ago
  expect(isRoomExpired(room)).toBe(false)
})

test('isRoomExpired returns true for a room older than 2 hours', () => {
  const room = { createdAt: { toMillis: () => Date.now() - 3 * 60 * 60 * 1000 } } // 3h ago
  expect(isRoomExpired(room)).toBe(true)
})

test('isRoomExpired returns false if createdAt has no toMillis (e.g. pending serverTimestamp)', () => {
  expect(isRoomExpired({ createdAt: null })).toBe(false)
  expect(isRoomExpired({})).toBe(false)
})

// ─── createRoom ───────────────────────────────────────────────────────────────

test('createRoom calls setDoc with correct shape', async () => {
  setDoc.mockResolvedValueOnce(undefined)

  const code = await createRoom('host-123', 'Alice', 'lucky-number', '🦊')

  expect(setDoc).toHaveBeenCalledTimes(1)
  const [, docData] = setDoc.mock.calls[0]
  expect(docData).toMatchObject({
    hostId: 'host-123',
    gameSlug: 'lucky-number',
    roomType: 'casual',
    players: [{ id: 'host-123', name: 'Alice', avatar: '🦊' }],
    status: 'waiting',
    state: {}
  })
  expect(typeof docData.code).toBe('string')
  expect(docData.code).toHaveLength(4)
  expect(code).toBe(docData.code)
})

test('createRoom stores roomType when provided', async () => {
  setDoc.mockResolvedValueOnce(undefined)

  await createRoom('host-123', 'Alice', 'lucky-number', '🦊', 'ranked')

  const [, docData] = setDoc.mock.calls[0]
  expect(docData.roomType).toBe('ranked')
})

test('createRoom generates uppercase alphanumeric code', async () => {
  setDoc.mockResolvedValue(undefined)

  const codes = new Set()
  for (let i = 0; i < 10; i++) {
    const code = await createRoom('h', 'H', 'g', '🎲')
    codes.add(code)
    expect(code).toMatch(/^[A-Z0-9]{4}$/)
  }
  expect(codes.size).toBeGreaterThan(1)
})

// ─── joinRoom ─────────────────────────────────────────────────────────────────

test('joinRoom calls updateDoc with arrayUnion for fresh room', async () => {
  const freshRoom = { createdAt: { toMillis: () => Date.now() - 30_000 } }
  getDoc.mockResolvedValueOnce({ exists: () => true, data: () => freshRoom })
  updateDoc.mockResolvedValueOnce(undefined)

  await joinRoom('ABCD', 'player-456', 'Bob', '🐯')

  expect(updateDoc).toHaveBeenCalledTimes(1)
  const [, updates] = updateDoc.mock.calls[0]
  expect(updates.players).toEqual({ __arrayUnion: { id: 'player-456', name: 'Bob', avatar: '🐯' } })
})

test('joinRoom throws room-expired for stale rooms', async () => {
  const staleRoom = { createdAt: { toMillis: () => Date.now() - 3 * 60 * 60 * 1000 } }
  getDoc.mockResolvedValueOnce({ exists: () => true, data: () => staleRoom })

  await expect(joinRoom('OLD1', 'p', 'X', '🎲')).rejects.toThrow('room-expired')
  expect(updateDoc).not.toHaveBeenCalled()
})

test('joinRoom throws room-not-found if doc does not exist', async () => {
  getDoc.mockResolvedValueOnce({ exists: () => false })

  await expect(joinRoom('NONE', 'p', 'X', '🎲')).rejects.toThrow('room-not-found')
})

// ─── subscribeToRoom ──────────────────────────────────────────────────────────

test('subscribeToRoom calls onSnapshot and invokes callback with room data', () => {
  const fakeRoom = { code: 'WXYZ', status: 'waiting', players: [] }
  onSnapshot.mockImplementation((ref, cb) => {
    cb({ exists: () => true, data: () => fakeRoom })
    return jest.fn()
  })

  const callback = jest.fn()
  const unsub = subscribeToRoom('WXYZ', callback)

  expect(onSnapshot).toHaveBeenCalledTimes(1)
  expect(callback).toHaveBeenCalledWith(fakeRoom)
  expect(typeof unsub).toBe('function')
})

// ─── subscribeToActions ───────────────────────────────────────────────────────

test('subscribeToActions calls onSnapshot on actions subcollection', () => {
  const fakeActions = [
    { playerId: 'p1', type: 'GUESS', payload: 7, createdAt: {} }
  ]
  onSnapshot.mockImplementation((ref, cb) => {
    cb({ docs: fakeActions.map(a => ({ data: () => a })) })
    return jest.fn()
  })

  const callback = jest.fn()
  subscribeToActions('ABCD', callback)

  expect(onSnapshot).toHaveBeenCalledTimes(1)
  expect(callback).toHaveBeenCalledWith(fakeActions)
})

// ─── writeAction ──────────────────────────────────────────────────────────────

test('writeAction calls setDoc on actions subcollection doc with flat schema', async () => {
  setDoc.mockResolvedValueOnce(undefined)

  await writeAction('ABCD', 'player-1', { type: 'GUESS', payload: 5 })

  expect(setDoc).toHaveBeenCalledTimes(1)
  const [ref, data] = setDoc.mock.calls[0]
  expect(ref.path).toBe('rooms/ABCD/actions/player-1')
  expect(data).toMatchObject({
    playerId: 'player-1',
    type: 'GUESS',
    payload: 5
  })
  // Ensure old nested shape is gone
  expect(data.action).toBeUndefined()
  expect(data.ts).toBeUndefined()
})

// ─── clearActions ─────────────────────────────────────────────────────────────

test('clearActions batch-deletes all action docs', async () => {
  const mockDelete = jest.fn()
  const mockCommit = jest.fn().mockResolvedValueOnce(undefined)
  writeBatch.mockReturnValueOnce({ delete: mockDelete, commit: mockCommit })

  const fakeDoc = { ref: { id: 'p1' } }
  getDocs.mockResolvedValueOnce({ empty: false, docs: [fakeDoc] })

  await clearActions('ABCD')

  expect(getDocs).toHaveBeenCalledTimes(1)
  expect(mockDelete).toHaveBeenCalledWith(fakeDoc.ref)
  expect(mockCommit).toHaveBeenCalledTimes(1)
})

test('clearActions skips batch commit when there are no action docs', async () => {
  getDocs.mockResolvedValueOnce({ empty: true, docs: [] })

  await clearActions('ABCD')

  expect(writeBatch).not.toHaveBeenCalled()
})

// ─── updateRoomState ──────────────────────────────────────────────────────────

test('updateRoomState calls updateDoc with state', async () => {
  updateDoc.mockResolvedValueOnce(undefined)

  await updateRoomState('ABCD', { target: 7, guesses: {} })

  expect(updateDoc).toHaveBeenCalledWith(
    expect.anything(),
    { state: { target: 7, guesses: {} } }
  )
})

// ─── sendRoomAction (deprecated alias) ────────────────────────────────────────

test('sendRoomAction calls updateDoc with action as state', async () => {
  updateDoc.mockResolvedValueOnce(undefined)

  await sendRoomAction('ABCD', { target: 7, guesses: {} })

  expect(updateDoc).toHaveBeenCalledWith(
    expect.anything(),
    { state: { target: 7, guesses: {} } }
  )
})

// ─── deleteRoom ───────────────────────────────────────────────────────────────

test('deleteRoom calls deleteDoc on room document', async () => {
  deleteDoc.mockResolvedValueOnce(undefined)

  await deleteRoom('ABCD')

  expect(deleteDoc).toHaveBeenCalledTimes(1)
  const [ref] = deleteDoc.mock.calls[0]
  expect(ref.path).toBe('rooms/ABCD')
})

// ─── kickPlayer ───────────────────────────────────────────────────────────────

test('kickPlayer removes player via arrayRemove', async () => {
  const room = { players: [{ id: 'host', name: 'H', avatar: '🎲' }, { id: 'p1', name: 'Bob', avatar: '🐯' }] }
  getDoc.mockResolvedValueOnce({ exists: () => true, data: () => room })
  updateDoc.mockResolvedValueOnce(undefined)

  await kickPlayer('ABCD', 'p1')

  expect(updateDoc).toHaveBeenCalledTimes(1)
  const [, updates] = updateDoc.mock.calls[0]
  expect(updates.players).toEqual({ __arrayRemove: { id: 'p1', name: 'Bob', avatar: '🐯' } })
})

test('kickPlayer does nothing if player not found', async () => {
  const room = { players: [{ id: 'host', name: 'H', avatar: '🎲' }] }
  getDoc.mockResolvedValueOnce({ exists: () => true, data: () => room })

  await kickPlayer('ABCD', 'nonexistent')

  expect(updateDoc).not.toHaveBeenCalled()
})
