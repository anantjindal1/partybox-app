/**
 * The "vital facts" strip pinned above a card table — current scores or
 * tricks won, one compact line. Deliberately minimal: no icon-per-stat,
 * no multi-row layout — a single glanceable row.
 */
export function TableScoreBar({ entries }) {
  if (!entries?.length) return null

  return (
    <div className="flex items-center justify-center gap-4 px-4 py-2 rounded-xl bg-surfaceElevated border border-border/60 text-sm mb-3 overflow-x-auto">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-textMuted font-medium">{entry.label}</span>
          <span className="text-textPrimary font-bold tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}
