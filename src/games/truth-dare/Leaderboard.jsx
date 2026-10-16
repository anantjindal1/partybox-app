import { useLang } from '../../store/LangContext'

export function Leaderboard({ rows }) {
  const { t } = useLang()
  if (rows.length === 0) {
    return <p className="text-center text-sm text-textMuted py-4">{t('tdNoScores')}</p>
  }
  return (
    <ol className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <li
          key={r.id}
          className={`flex items-center gap-3 rounded-xl border-[1.5px] px-4 py-3 ${
            i === 0 ? 'border-rose bg-rose/10' : 'border-border bg-surfaceElevated'
          }`}
        >
          <span className="w-5 text-sm font-black text-textMuted">{i + 1}</span>
          <span className="flex-1 font-semibold text-textPrimary truncate">{r.name}</span>
          <span className="text-xs text-textMuted">{r.turns === 1 ? t('tdOneTurn') : t('tdTurns', { n: r.turns })}</span>
          <span className="w-10 text-right font-black text-textPrimary">{r.avg.toFixed(1)}</span>
        </li>
      ))}
    </ol>
  )
}

export function LeaderboardSheet({ rows, onClose }) {
  const { t } = useLang()
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl bg-surface border-t border-border p-5 pb-8 flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-center text-lg font-black font-display text-textPrimary">{t('tdLeaderboard')}</p>
        <Leaderboard rows={rows} />
        <button onClick={onClose} className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-semibold">
          {t('close')}
        </button>
      </div>
    </div>
  )
}
