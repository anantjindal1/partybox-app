import { CrownIcon } from '../../components/gameIcons'

export function ResultsScreen({
  players,
  cumulativeScores,
  myId,
  isHost,
  onRematch,
  onHome,
  onRematchVote,
  rematchVoteCount,
  totalPlayers,
  t,
}) {
  const ranked = [...players].sort(
    (a, b) => (cumulativeScores[b.id] ?? 0) - (cumulativeScores[a.id] ?? 0)
  )
  const winner = ranked[0]

  return (
    <div className="flex-1 flex flex-col py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full border-[1.5px] border-plum text-plum flex items-center justify-center">
          <CrownIcon width="30" height="30" />
        </div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">{t('winner')}</p>
        <p className="text-2xl font-bold font-display text-textPrimary">{winner?.name ?? '—'}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        {ranked.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border-[1.5px] ${
              p.id === myId ? 'border-plum bg-plum/10' : 'border-border bg-surfaceElevated'
            }`}
          >
            <span className="text-sm font-semibold text-textPrimary">
              {i + 1}. {p.name}{p.id === myId ? ' (You)' : ''}
            </span>
            <span className="text-sm font-bold text-gold tabular-nums">
              {cumulativeScores[p.id] ?? 0}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {isHost ? (
          <button
            onClick={onRematch}
            className="min-h-[44px] rounded-xl bg-plum text-onPlum font-bold"
          >
            {t('rematch')} →
          </button>
        ) : (
          <button
            onClick={onRematchVote}
            className="min-h-[44px] rounded-xl bg-plum text-onPlum font-bold"
          >
            {t('voteRematch')} ({rematchVoteCount}/{totalPlayers})
          </button>
        )}
        <button
          onClick={onHome}
          className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-semibold"
        >
          {t('home')}
        </button>
      </div>
    </div>
  )
}
