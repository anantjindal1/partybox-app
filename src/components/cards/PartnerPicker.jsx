import { CARD_GAME_ACCENT_CLASSES } from '../cardGameAccent'

/**
 * Host-only "pick your partner" UI for a fixed 2v2 partnership game.
 * Dumb/controlled — the caller owns pendingPartnerId (synced through
 * room state) and turns a selection into a turnOrder via
 * buildTurnOrderFromPartner at Start time. Every non-host player sees
 * the same team preview read-only, once the host has picked.
 */
export function PartnerPicker({ players, hostId, myId, pendingPartnerId, onSelectPartner, accent = 'maroon' }) {
  const accentClasses = CARD_GAME_ACCENT_CLASSES[accent] ?? CARD_GAME_ACCENT_CLASSES.maroon
  const isHostViewer = myId === hostId
  const hostPlayer = players.find(p => p.id === hostId)
  const others = players.filter(p => p.id !== hostId)
  const partner = players.find(p => p.id === pendingPartnerId)
  const rest = others.filter(p => p.id !== pendingPartnerId)

  return (
    <div className={`rounded-xl border ${accentClasses.border} ${accentClasses.soft} p-3 flex flex-col gap-3`}>
      {isHostViewer ? (
        <>
          <p className="text-sm font-semibold text-textPrimary">Choose your partner</p>
          <div className="flex flex-wrap gap-2">
            {others.map(p => {
              const isSelected = p.id === pendingPartnerId
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPartner(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border-[1.5px] transition-colors ${
                    isSelected
                      ? `${accentClasses.button} border-transparent`
                      : 'bg-surfaceElevated text-textPrimary border-border/60 hover:border-textMuted'
                  }`}
                >
                  <span>{p.avatar ?? '🎮'}</span>
                  <span>{p.name}</span>
                </button>
              )
            })}
          </div>
        </>
      ) : partner ? (
        <p className="text-sm font-semibold text-textPrimary">Partners for this game</p>
      ) : (
        <p className="text-sm text-textMuted">Host is choosing partners…</p>
      )}

      {partner && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className={`px-2.5 py-1 rounded-lg font-semibold ${accentClasses.soft} ${accentClasses.text}`}>
            {hostPlayer?.avatar} {hostPlayer?.name} & {partner.avatar} {partner.name}
          </span>
          <span className="text-textMuted">vs</span>
          <span className="px-2.5 py-1 rounded-lg font-semibold bg-surfaceElevated text-textPrimary">
            {rest.map(p => `${p.avatar} ${p.name}`).join(' & ')}
          </span>
        </div>
      )}
    </div>
  )
}
