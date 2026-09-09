import { useState } from 'react'

const BID_OPTIONS = Array.from({ length: 13 }, (_, i) => i + 1)

export function BiddingScreen({ roundNumber, bidsIn, totalPlayers, onSubmit, submitted }) {
  const [selected, setSelected] = useState(null)

  function handleSubmit() {
    if (selected == null || submitted) return
    onSubmit(selected)
  }

  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">
        Round {roundNumber} of 5 — Bidding
      </p>

      {submitted ? (
        <p className="text-sm text-textMuted py-4">Bid locked in — waiting for the room…</p>
      ) : (
        <div className="w-full flex flex-col gap-4">
          <p className="text-center text-textPrimary font-semibold">How many tricks will you win?</p>
          <div className="grid grid-cols-5 gap-2">
            {BID_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setSelected(n)}
                className={`min-h-[44px] rounded-xl border-[1.5px] font-bold transition-colors ${
                  selected === n
                    ? 'bg-turquoise text-onTurquoise border-turquoise'
                    : 'bg-surfaceElevated text-textPrimary border-border hover:border-turquoise/50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={selected == null}
            className="min-h-[44px] rounded-xl bg-turquoise text-onTurquoise font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Lock In Bid →
          </button>
        </div>
      )}

      <p className="text-sm font-semibold text-textMuted mt-auto pt-3">
        {bidsIn} of {totalPlayers} have bid
      </p>
    </div>
  )
}
