import { useState } from 'react'
import { TAGS } from './prompts'

const ROUND_OPTIONS = [6, 8, 12]

export function LobbyScreen({ isHost, minPlayers, players, onStart, starting, t }) {
  const [selectedTags, setSelectedTags] = useState(['friends'])
  const [includeAdult, setIncludeAdult] = useState(false)
  const [roundCount, setRoundCount] = useState(8)
  const canStart = isHost && players.length >= minPlayers && !starting

  function toggleTag(tag) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t2) => t2 !== tag) : [...prev, tag]))
  }

  if (!isHost) {
    return (
      <div className="flex flex-col gap-4 max-w-lg w-full mx-auto pt-2">
        <p className="text-center text-textMuted text-sm">{t('waitingForHostStart')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg w-full mx-auto pt-2">
      <div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Setting</p>
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

      <button
        onClick={() => setIncludeAdult((v) => !v)}
        className={`w-full min-h-[44px] rounded-xl border-[1.5px] px-4 flex items-center justify-between font-semibold transition-colors ${
          includeAdult ? 'bg-error/10 border-error text-error' : 'bg-surfaceElevated border-border text-textMuted'
        }`}
      >
        <span>Include 18+ prompts</span>
        <span className="text-xs font-bold">{includeAdult ? 'ON' : 'OFF'}</span>
      </button>

      <div>
        <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">{t('rounds')}</p>
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
        onClick={() => onStart({ selectedTags: selectedTags.length ? selectedTags : ['friends'], includeAdult, roundCount })}
        disabled={!canStart}
        className="min-h-[44px] rounded-xl bg-rose text-onRose font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        {starting ? t('starting') : `${t('startGame')} →`}
      </button>
    </div>
  )
}
