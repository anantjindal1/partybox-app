/**
 * The "vital facts" strip pinned above a card table — current scores or
 * tricks won, one compact line. Deliberately minimal: no icon-per-stat,
 * no multi-row layout — a single glanceable row.
 */
export function TableScoreBar({ entries, variant }) {
  if (!entries?.length) return null

  if (variant === 'royal') {
    return (
      <div className="royal-scorebar flex items-center justify-center gap-3 px-3 py-2 mb-3">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap">
            <span className="royal-font text-[9px] font-bold tracking-[0.1em] uppercase text-[#9fb8b2]">{entry.label}</span>
            <span className="royal-font text-base font-bold tabular-nums text-[#f8ebcb] flex items-center">{entry.royalValue ?? entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-4 px-4 py-2 rounded-xl bg-surfaceElevated border border-border/60 text-sm mb-3 overflow-x-auto">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-textMuted font-medium">{entry.label}</span>
          <span className={`font-bold tabular-nums ${entry.valueClassName ?? 'text-textPrimary'}`}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}
