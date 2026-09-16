import { getLobbySeatPosition } from './seatLayout'

/**
 * Pre-game lobby player list, arranged as seats around an oval table
 * instead of a plain wrapped row — for games where players will end up
 * seated around a real table once play starts (see CardTable.jsx), so
 * the lobby previews the same mental model instead of a generic list.
 * Purely visual: same avatar/crown/kick affordances as the flat list it
 * replaces, just positioned via getLobbySeatPosition.
 */
export function LobbyTable({ players, hostId, isHost, onKick }) {
  return (
    <div
      className="relative w-full max-w-md mx-auto rounded-[50%] border-[3px] border-border shadow-inner bg-surfaceMuted"
      style={{ aspectRatio: '1.6 / 1', minHeight: 220 }}
    >
      {players.map((p, i) => {
        const pos = getLobbySeatPosition(i, players.length)
        return (
          <div
            key={p.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
            style={{ left: pos.left, top: pos.top }}
          >
            <div className="relative">
              <span className="text-4xl" style={{ minWidth: 48, display: 'inline-block', textAlign: 'center' }}>
                {p.avatar ?? '🎮'}
              </span>
              {p.id === hostId && (
                <span className="absolute -top-1 -right-1 text-xs">👑</span>
              )}
            </div>
            <span className="text-textSecondary text-xs font-medium max-w-[64px] truncate">{p.name}</span>
            {isHost && p.id !== hostId && (
              <button
                onClick={() => onKick(p.id)}
                className="text-xs text-textMuted hover:text-error"
                aria-label={`Remove ${p.name}`}
              >
                ✕
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
