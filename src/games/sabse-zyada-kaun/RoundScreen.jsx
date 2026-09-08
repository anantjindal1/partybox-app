import { useState, useEffect } from 'react'
import { ACTIONS } from './reducer'

export function RoundScreen({ state, dispatch }) {
  const [selected, setSelected] = useState([])

  useEffect(() => {
    setSelected([])
  }, [state.currentPrompt?.id])

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function confirm() {
    if (selected.length === 0) return
    dispatch({ type: ACTIONS.PICK_WINNER, payload: selected })
  }

  function skip() {
    dispatch({ type: ACTIONS.SKIP_PROMPT })
  }

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 py-6 gap-6 max-w-lg w-full mx-auto">
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider text-center">
        Round {state.currentRound} of {state.roundCount}
      </p>

      <div className="bg-surfaceElevated border-[1.5px] border-rose rounded-2xl p-8 text-center">
        <p className="text-2xl font-bold font-display text-textPrimary leading-snug">
          {state.currentPrompt?.en ?? '...'}
        </p>
      </div>

      <p className="text-center text-sm text-textMuted">
        Read it aloud. Once the room decides, tap the winner (or a few, if it's a tie).
      </p>

      <div className="grid grid-cols-2 gap-3">
        {state.players.map((p) => {
          const isSelected = selected.includes(p.id)
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`min-h-[56px] rounded-2xl border-[1.5px] px-3 py-3 font-semibold transition-colors ${
                isSelected
                  ? 'bg-rose text-onRose border-rose'
                  : 'bg-surfaceElevated text-textPrimary border-border hover:border-rose/50'
              }`}
            >
              {p.name}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={confirm}
          disabled={selected.length === 0}
          className="min-h-[44px] rounded-xl bg-rose text-onRose font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          Confirm Winner{selected.length > 1 ? 's' : ''} →
        </button>
        <button
          onClick={skip}
          className="min-h-[44px] rounded-xl border-[1.5px] border-border text-textMuted font-semibold"
        >
          Skip this prompt
        </button>
      </div>
    </div>
  )
}
