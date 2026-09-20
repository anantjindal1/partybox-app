import { useState } from 'react'

/**
 * "All Bids" button + modal — every player's bid and hands won so far this
 * round, for checking who's on track without asking around the table.
 */
export function BidsBoard({ players, turnOrder, bids, handsWon, myId }) {
  const [open, setOpen] = useState(false)
  const rows = turnOrder
    .map(id => players.find(p => p.id === id))
    .filter(Boolean)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="self-center text-sm font-bold text-peridot border-[1.5px] border-peridot bg-peridot/10 rounded-xl px-4 py-2"
      >
        All Bids
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4 py-8 overflow-y-auto">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">This round</p>
              <button
                onClick={() => setOpen(false)}
                className="text-textMuted hover:text-textPrimary text-sm font-semibold px-3 py-1"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-5 gap-y-2 text-sm items-center">
              <span />
              <span className="text-xs font-semibold text-textMuted uppercase">Bid</span>
              <span className="text-xs font-semibold text-textMuted uppercase">Won</span>
              {rows.map(p => (
                <div key={p.id} className="contents">
                  <span className={`truncate ${p.id === myId ? 'font-bold text-textPrimary' : 'text-textPrimary'}`}>
                    {p.name}{p.id === myId ? ' (You)' : ''}
                  </span>
                  <span className="font-bold tabular-nums text-center">{bids?.[p.id] ?? '-'}</span>
                  <span className="font-bold tabular-nums text-center">{handsWon?.[p.id] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
