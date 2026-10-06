jest.mock('firebase/firestore', () => ({
  doc: jest.fn(), collection: jest.fn(), setDoc: jest.fn(), getDoc: jest.fn(), updateDoc: jest.fn(),
  deleteDoc: jest.fn(), onSnapshot: jest.fn(), arrayUnion: jest.fn(), arrayRemove: jest.fn(),
  getDocs: jest.fn(), writeBatch: jest.fn(), serverTimestamp: jest.fn(),
  query: jest.fn(), where: jest.fn(), orderBy: jest.fn(), limit: jest.fn(),
  Timestamp: { fromMillis: jest.fn() }
}))
jest.mock('../src/firebase', () => ({ db: {} }))

import { describeTable } from '../src/services/openTables'

const game = { maxPlayers: 4 }
const fresh = { toMillis: () => Date.now() - 60_000 }
const room = (overrides = {}) => ({
  code: 'ABCD',
  gameSlug: 'teri',
  hostId: 'h',
  createdAt: fresh,
  players: [{ id: 'h', name: 'Host', avatar: 'H' }, { id: 'p2', name: 'Two', avatar: 'T' }],
  state: {},
  ...overrides
})

describe('describeTable', () => {
  test('lists a lobby with free seats, naming the host and counting seats', () => {
    expect(describeTable(room(), game)).toMatchObject({
      code: 'ABCD', hostName: 'Host', playerCount: 2, openSeats: 2, inLobby: true
    })
  })

  test('lists a full lobby with no open seats', () => {
    const players = ['a', 'b', 'c', 'd'].map(id => ({ id, name: id }))
    expect(describeTable(room({ players, hostId: 'a' }), game)).toMatchObject({ openSeats: 0, playerIds: ['a', 'b', 'c', 'd'] })
  })

  test('flags a table the host hid', () => {
    expect(describeTable(room({ isPublic: false }), game)).toMatchObject({ isPublic: false })
  })

  test('skips a finished game', () => {
    expect(describeTable(room({ state: { phase: 'results' } }), game)).toBeNull()
  })

  test('skips an expired table', () => {
    const old = { toMillis: () => Date.now() - 3 * 60 * 60 * 1000 }
    expect(describeTable(room({ createdAt: old }), game)).toBeNull()
  })

  test('lists an underway game with no vacated seat as watch-only', () => {
    expect(describeTable(room({ state: { phase: 'playing' } }), game)).toMatchObject({ openSeats: 0, inLobby: false })
  })

  test('lists an underway game that has a vacated seat', () => {
    expect(describeTable(room({ state: { phase: 'playing' }, openSeats: ['p3'] }), game)).toMatchObject({
      openSeats: 1, inLobby: false
    })
  })

  test('skips unknown games and empty rooms', () => {
    expect(describeTable(room(), undefined)).toBeNull()
    expect(describeTable(room({ players: [] }), game)).toBeNull()
  })
})
