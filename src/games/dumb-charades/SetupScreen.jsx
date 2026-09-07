import { useState, useRef } from 'react'
import { ACTIONS } from './reducer'

const TEAM_NAMES = [
  'Rocket', 'Chaos', 'Thunder', 'Mango', 'Ninja',
  'Disco', 'Punjabi', 'Chill', 'Jugaad', 'Desi',
  'Masala', 'Tamasha', 'Jhingalala', 'Bindaas', 'Fatafat',
  'Ullu', 'Chamak', 'Dhamaka', 'Jhakaas', 'Toofan',
]

const MEMBER_OPTIONS = [1, 2, 3, 4, 5]

function shuffleNames() {
  const a = [...TEAM_NAMES]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function SetupScreen({ state, dispatch }) {
  const namePoolRef = useRef(shuffleNames())
  const [teamCount, setTeamCount] = useState(state.teams.length)
  const [names, setNames] = useState(() =>
    Array.from({ length: state.teams.length }, (_, i) => `Team ${namePoolRef.current[i]}`)
  )
  const [memberCount, setMemberCount] = useState(3)

  function updateCount(n) {
    setTeamCount(n)
    setNames(prev => {
      const next = [...prev]
      while (next.length < n) next.push(`Team ${namePoolRef.current[next.length]}`)
      return next.slice(0, n)
    })
  }

  function handleNext() {
    const teamNames = names.map((n, i) => n.trim() || `Team ${namePoolRef.current[i]}`)
    dispatch({ type: ACTIONS.SET_TEAMS, payload: { teamNames, memberCount } })
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-textPrimary">🎭 Dumb Charades</h1>
        <p className="text-textMuted text-sm">Act it out — no words, no sounds!</p>
      </div>

      {/* Team count */}
      <div>
        <p className="text-textMuted text-xs uppercase tracking-widest mb-3">How many teams?</p>
        <div className="grid grid-cols-3 gap-3">
          {[2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => updateCount(n)}
              className={`py-4 rounded-2xl text-2xl font-black transition-colors ${
                teamCount === n
                  ? 'bg-terracotta text-onTerracotta'
                  : 'bg-surfaceElevated/80 border border-border/50 text-textMuted hover:border-border'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-textMuted text-xs mt-1 text-center">2–4 teams supported</p>
      </div>

      {/* Team names */}
      <div className="space-y-3">
        <p className="text-textMuted text-xs uppercase tracking-widest">Team Names</p>
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
            placeholder={`Team ${namePoolRef.current[i]}`}
            maxLength={20}
            className="w-full bg-surfaceElevated/80 border border-border/50 text-textPrimary text-lg rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-terracotta/60 placeholder-zinc-600"
          />
        ))}
      </div>

      {/* Members per team */}
      <div>
        <p className="text-textMuted text-xs uppercase tracking-widest mb-3">Members per team</p>
        <div className="grid grid-cols-5 gap-3">
          {MEMBER_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setMemberCount(n)}
              className={`py-3 rounded-2xl font-bold transition-colors ${
                memberCount === n
                  ? 'bg-terracotta text-onTerracotta'
                  : 'bg-surfaceElevated/80 border border-border/50 text-textMuted hover:border-border'
              }`}
            >
              {n === 5 ? '5+' : n}
            </button>
          ))}
        </div>
        <p className="text-textMuted text-xs mt-1 text-center">Used to rotate actors each turn</p>
      </div>

      <button
        onClick={handleNext}
        className="w-full py-4 rounded-2xl bg-terracotta hover:opacity-90 text-onTerracotta font-black text-lg transition-colors active:scale-[0.98]"
      >
        Next →
      </button>
    </div>
  )
}
