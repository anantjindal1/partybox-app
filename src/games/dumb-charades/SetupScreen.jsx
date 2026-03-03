import { useState } from 'react'
import { Button } from '../../components/Button'
import { ACTIONS } from './reducer'
import { DC } from './theme'

export function SetupScreen({ state, dispatch, t }) {
  const [teamCount, setTeamCount] = useState(state.teams.length)
  const [names, setNames] = useState(() => state.teams.map(t => t.name))

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
    dispatch({ type: ACTIONS.SET_TEAMS, payload: { teamNames } })
  }

  return (
    <div className={`min-h-screen ${DC.bg} ${DC.text} flex flex-col px-6 pt-10 pb-8 space-y-6`}>
      <h1 className={`text-3xl font-black ${DC.accent}`}>🎭 {t('title')}</h1>
      <h2 className={`text-xl font-bold ${DC.textMuted}`}>{t('teamSetup')}</h2>

      {/* Team count selector */}
      <div>
        <p className={`${DC.textMuted} text-sm mb-3`}>{t('howManyTeams')}</p>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => updateCount(n)}
              className={`py-5 rounded-2xl text-3xl font-black transition-colors ${
                teamCount === n ? `${DC.accentBg} text-[#141414]` : `${DC.card} ${DC.textMuted} border ${DC.cardBorder}`
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Team name inputs */}
      <div className="space-y-3">
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
            className={`w-full ${DC.card} ${DC.text} text-xl rounded-2xl px-5 py-4 border ${DC.cardBorder} outline-none focus:ring-2 focus:ring-[#2CE49D]`}
          />
        ))}
      </div>

      <div className="pt-2">
        <Button onClick={handleNext}>{t('next')}</Button>
      </div>
    </div>
  )
}
