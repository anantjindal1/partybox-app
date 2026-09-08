import { useState } from 'react'
import { TAGS } from './prompts'
import { ACTIONS } from './reducer'

const ROUND_OPTIONS = [6, 8, 12]
const MIN_PLAYERS = 3

export function SetupScreenOffline({ state, dispatch }) {
  const [players, setPlayers] = useState(state.players)
  const [nameInput, setNameInput] = useState('')
  const [selectedTags, setSelectedTags] = useState(state.selectedTags)
  const [includeAdult, setIncludeAdult] = useState(state.includeAdult)
  const [roundCount, setRoundCount] = useState(state.roundCount)

  function addPlayer() {
    const name = nameInput.trim()
    if (!name) return
    setPlayers((prev) => [...prev, { id: `p${Date.now()}${prev.length}`, name }])
    setNameInput('')
  }

  function removePlayer(id) {
    setPlayers((prev) => prev.filter((p) => p.id !== id))
  }

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function handleStart() {
    dispatch({ type: ACTIONS.SET_PLAYERS, payload: players })
    dispatch({ type: ACTIONS.SET_TAGS, payload: selectedTags.length ? selectedTags : ['friends'] })
    dispatch({ type: ACTIONS.SET_ADULT, payload: includeAdult })
    dispatch({ type: ACTIONS.SET_ROUND_COUNT, payload: roundCount })
    dispatch({ type: ACTIONS.START_GAME })
  }

  const canStart = players.length >= MIN_PLAYERS

  return (
    <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black font-display text-textPrimary">Sabse Zyada Kaun</h1>
        <p className="text-textMuted text-sm">Who fits the prompt best? The room decides.</p>
      </div>

      {/* Players */}
      <div>
        <p className="text-textMuted text-xs uppercase tracking-widest mb-3">
          Players ({players.length})
        </p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            placeholder="Add a player's name"
            maxLength={20}
            className="flex-1 bg-surfaceElevated border border-border text-textPrimary rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose/50"
          />
          <button
            onClick={addPlayer}
            className="min-h-[44px] px-5 rounded-xl bg-rose text-onRose font-bold"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-2 bg-surfaceElevated border border-border rounded-full pl-3 pr-2 py-1.5 text-sm text-textPrimary"
            >
              {p.name}
              <button
                onClick={() => removePlayer(p.id)}
                aria-label={`Remove ${p.name}`}
                className="w-5 h-5 flex items-center justify-center rounded-full text-textMuted hover:text-error"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </span>
          ))}
        </div>
        {!canStart && (
          <p className="text-xs text-textMuted mt-2">Need at least {MIN_PLAYERS} players.</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <p className="text-textMuted text-xs uppercase tracking-widest mb-3">Setting</p>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(TAGS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleTag(key)}
              className={`min-h-[44px] rounded-xl border-[1.5px] px-4 text-left font-semibold transition-colors ${
                selectedTags.includes(key)
                  ? 'bg-rose text-onRose border-rose'
                  : 'bg-surfaceElevated text-textPrimary border-border hover:border-rose/50'
              }`}
            >
              {label.en}
            </button>
          ))}
        </div>
      </div>

      {/* 18+ toggle */}
      <button
        onClick={() => setIncludeAdult((v) => !v)}
        className={`w-full min-h-[44px] rounded-xl border-[1.5px] px-4 flex items-center justify-between font-semibold transition-colors ${
          includeAdult ? 'bg-error/10 border-error text-error' : 'bg-surfaceElevated border-border text-textMuted'
        }`}
      >
        <span>Include 18+ prompts</span>
        <span className="text-xs font-bold">{includeAdult ? 'ON' : 'OFF'}</span>
      </button>

      {/* Round count */}
      <div>
        <p className="text-textMuted text-xs uppercase tracking-widest mb-3">Rounds</p>
        <div className="grid grid-cols-3 gap-2">
          {ROUND_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setRoundCount(n)}
              className={`min-h-[44px] rounded-xl border-[1.5px] font-bold transition-colors ${
                roundCount === n
                  ? 'bg-rose text-onRose border-rose'
                  : 'bg-surfaceElevated text-textPrimary border-border hover:border-rose/50'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!canStart}
        className="w-full min-h-[44px] py-4 rounded-2xl bg-rose text-onRose font-black text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        Start →
      </button>
    </div>
  )
}
