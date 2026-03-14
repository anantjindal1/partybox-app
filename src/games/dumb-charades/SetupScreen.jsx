import { useState } from 'react'
import { ACTIONS } from './reducer'

const MEMBER_OPTIONS = [2, 3, 4, 5]

export function SetupScreen({ state, dispatch }) {
  const [teamCount, setTeamCount] = useState(state.teams.length)
  const [names, setNames] = useState(() => state.teams.map(t => t.name))
  const [memberCount, setMemberCount] = useState(3)

  function updateCount(n) {
    setTeamCount(n)
    setNames(prev => {
      const next = [...prev]
      while (next.length < n) next.push(`Team ${next.length + 1}`)
      return next.slice(0, n)
    })
  }

  function handleNext() {
    const teamNames = names.map((n, i) => n.trim() || `Team ${i + 1}`)
    dispatch({ type: ACTIONS.SET_TEAMS, payload: { teamNames, memberCount } })
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-white">🎭 Dumb Charades</h1>
        <p className="text-zinc-400 text-sm">Act it out — no words, no sounds!</p>
      </div>

      {/* Team count */}
      <div>
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">How many teams?</p>
        <div className="grid grid-cols-3 gap-3">
          {[2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => updateCount(n)}
              className={`py-4 rounded-2xl text-2xl font-black transition-colors ${
                teamCount === n
                  ? 'bg-pink-500 text-white'
                  : 'bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-zinc-600 text-xs mt-1 text-center">2–4 teams supported</p>
      </div>

      {/* Team names */}
      <div className="space-y-3">
        <p className="text-zinc-400 text-xs uppercase tracking-widest">Team Names</p>
        {names.map((name, i) => (
          <input
            key={i}
            type="text"
            value={name}
            onChange={e => {
              const next = [...names]
              next[i] = e.target.value
              setNames(next)
            }}
            placeholder={`Team ${i + 1}`}
            maxLength={20}
            className="w-full bg-zinc-800/80 border border-zinc-700/50 text-white text-lg rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-pink-500/60 placeholder-zinc-600"
          />
        ))}
      </div>

      {/* Members per team */}
      <div>
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Members per team</p>
        <div className="grid grid-cols-4 gap-3">
          {MEMBER_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setMemberCount(n)}
              className={`py-3 rounded-2xl font-bold transition-colors ${
                memberCount === n
                  ? 'bg-pink-500 text-white'
                  : 'bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              {n === 5 ? '5+' : n}
            </button>
          ))}
        </div>
        <p className="text-zinc-600 text-xs mt-1 text-center">Used to rotate actors each turn</p>
      </div>

      <button
        onClick={handleNext}
        className="w-full py-4 rounded-2xl bg-pink-500 hover:bg-pink-400 text-white font-black text-lg transition-colors active:scale-[0.98]"
      >
        Next →
      </button>
    </div>
  )
}
