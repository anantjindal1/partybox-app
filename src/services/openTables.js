import { db } from '../firebase'
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore'
import { ROOM_TTL_MS, LOBBY_PHASES, isRoomExpired } from './room'

const MAX_TABLES = 50

/**
 * A room as a row on the Open Tables page, or null if nobody new could
 * enter it: hidden by its host, expired, full, or underway with no
 * vacated seat. In the lobby every unfilled seat is open; once underway,
 * only seats a player gave up mid-series (`openSeats`) are.
 */
export function describeOpenTable(room, game) {
  if (!room || !game || room.isPublic === false || isRoomExpired(room)) return null
  const players = room.players ?? []
  if (players.length === 0) return null
  const inLobby = LOBBY_PHASES.has(room.state?.phase)
  const openSeats = inLobby ? game.maxPlayers - players.length : (room.openSeats?.length ?? 0)
  if (openSeats <= 0) return null
  const host = players.find(p => p.id === room.hostId) ?? players[0]
  return {
    code: room.code,
    slug: room.gameSlug,
    hostName: host.name,
    hostAvatar: host.avatar,
    playerCount: players.length,
    openSeats,
    inLobby,
    createdAtMs: room.createdAt?.toMillis?.() ?? null
  }
}

export function subscribeToOpenTables(callback, onError) {
  const cutoff = Timestamp.fromMillis(Date.now() - ROOM_TTL_MS)
  const openTablesQuery = query(
    collection(db, 'rooms'),
    where('createdAt', '>', cutoff),
    orderBy('createdAt', 'desc'),
    limit(MAX_TABLES)
  )
  return onSnapshot(openTablesQuery, snap => callback(snap.docs.map(d => d.data())), onError)
}
