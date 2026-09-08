import { ROLE_ICON_COMPONENTS, roleLabel } from './roleIcons'

export function RoundRevealScreen({
  roles,
  roundScores,
  cumulativeScores,
  correct,
  players,
  isHost,
  isLastRound,
  onNextRound,
  advancing,
  t,
}) {
  const byPlayer = (id) => players.find((p) => p.id === id)
  const sortedByCumulative = [...players].sort(
    (a, b) => (cumulativeScores[b.id] ?? 0) - (cumulativeScores[a.id] ?? 0)
  )

  return (
    <div className="flex-1 flex flex-col py-6 gap-5 max-w-lg w-full mx-auto">
      <div
        className={`rounded-2xl border-[1.5px] p-4 text-center font-bold ${
          correct ? 'bg-teal/10 border-teal text-teal' : 'bg-error/10 border-error text-error'
        }`}
      >
        {correct ? t('mantriCaughtChor') : t('chorGotAway')}
      </div>

      <div className="flex flex-col gap-2">
        {players.map((p) => {
          const role = roles[p.id]
          const Icon = ROLE_ICON_COMPONENTS[role] ?? ROLE_ICON_COMPONENTS.sipahi
          const pts = roundScores[p.id] ?? 0
          return (
            <div key={p.id} className="flex items-center gap-3 bg-surfaceElevated border border-border rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 rounded-full border-[1.5px] border-plum text-plum flex items-center justify-center flex-shrink-0">
                <Icon width="16" height="16" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-textPrimary truncate">{p.name}</p>
                <p className="text-xs text-textMuted">{roleLabel(role, t)}</p>
              </div>
              <span className="text-sm font-bold text-gold flex-shrink-0">+{pts}</span>
            </div>
          )
        })}
      </div>

      <div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">{t('scoreboard')}</p>
        <div className="flex flex-col gap-1.5">
          {sortedByCumulative.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surfaceMuted/50">
              <span className="text-sm text-textPrimary font-medium">
                {i + 1}. {byPlayer(p.id)?.name}
              </span>
              <span className="text-sm font-bold text-textPrimary tabular-nums">
                {cumulativeScores[p.id] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isHost ? (
        <button
          onClick={onNextRound}
          disabled={advancing}
          className="min-h-[44px] rounded-xl bg-plum text-onPlum font-bold disabled:opacity-40 transition-opacity"
        >
          {isLastRound ? `${t('seeFinalResults')} →` : `${t('nextRound')} →`}
        </button>
      ) : (
        <p className="text-center text-textMuted text-sm">{t('waitingForHostContinue')}</p>
      )}
    </div>
  )
}
