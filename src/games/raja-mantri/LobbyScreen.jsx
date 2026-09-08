import { useState } from 'react'

const ROUND_OPTIONS = [4, 6, 8]

export function LobbyScreen({ players, isHost, minPlayers, onStart, starting, t }) {
  const [roundCount, setRoundCount] = useState(6)
  const canStart = isHost && players.length >= minPlayers && !starting

  return (
    <div className="flex flex-col gap-4 max-w-lg w-full mx-auto pt-2">
      {isHost ? (
        <>
          <div>
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">{t('rounds')}</p>
            <div className="grid grid-cols-3 gap-2">
              {ROUND_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setRoundCount(n)}
                  className={`min-h-[44px] rounded-xl border-[1.5px] font-bold transition-colors ${
                    roundCount === n
                      ? 'bg-plum text-onPlum border-plum'
                      : 'bg-surfaceElevated text-textPrimary border-border hover:border-plum/50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => onStart(roundCount)}
            disabled={!canStart}
            className="min-h-[44px] rounded-xl bg-plum text-onPlum font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {starting ? t('starting') : `${t('startGame')} →`}
          </button>
        </>
      ) : (
        <p className="text-center text-textMuted text-sm">{t('waitingForHostStart')}</p>
      )}
    </div>
  )
}
