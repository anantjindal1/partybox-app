jest.mock('firebase/firestore', () => ({
  doc: jest.fn(), collection: jest.fn(), setDoc: jest.fn(), getDoc: jest.fn(), updateDoc: jest.fn(),
  deleteDoc: jest.fn(), onSnapshot: jest.fn(), arrayUnion: jest.fn(), arrayRemove: jest.fn(),
  getDocs: jest.fn(), writeBatch: jest.fn(), serverTimestamp: jest.fn(),
  query: jest.fn(), where: jest.fn(), orderBy: jest.fn(), limit: jest.fn(),
  Timestamp: { fromMillis: jest.fn() }
}))
jest.mock('../src/firebase', () => ({ db: {} }))

import { describeOpenTable } from '../src/services/openTables'

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

describe('describeOpenTable', () => {
  test('lists a lobby with free seats, naming the host and counting seats', () => {
    expect(describeOpenTable(room(), game)).toMatchObject({
      code: 'ABCD', hostName: 'Host', playerCount: 2, openSeats: 2, inLobby: true
    })
  })

  test('skips a full lobby', () => {
    const players = ['a', 'b', 'c', 'd'].map(id => ({ id, name: id }))
    expect(describeOpenTable(room({ players, hostId: 'a' }), game)).toBeNull()
  })

  test('skips a table the host hid', () => {
    expect(describeOpenTable(room({ isPublic: false }), game)).toBeNull()
  })

  test('skips an expired table', () => {
    const old = { toMillis: () => Date.now() - 3 * 60 * 60 * 1000 }
    expect(describeOpenTable(room({ createdAt: old }), game)).toBeNull()
  })

  test('skips an underway game with no vacated seat', () => {
    expect(describeOpenTable(room({ state: { phase: 'playing' } }), game)).toBeNull()
  })

  test('lists an underway game that has a vacated seat', () => {
    expect(describeOpenTable(room({ state: { phase: 'playing' }, openSeats: ['p3'] }), game)).toMatchObject({
      openSeats: 1, inLobby: false
    })
  })

  test('skips unknown games and empty rooms', () => {
    expect(describeOpenTable(room(), undefined)).toBeNull()
    expect(describeOpenTable(room({ players: [] }), game)).toBeNull()
  })
})
