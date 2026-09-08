import { useState } from 'react'
import CircularTimer from '../../components/CircularTimer'

export function MantriGuessScreen({ isMantri, players, myId, secondsLeft, totalSeconds, onGuess, guessed, t }) {
  const [localGuess, setLocalGuess] = useState(null)
  const others = players.filter((p) => p.id !== myId)

  function handlePick(playerId) {
    if (guessed || localGuess) return
    setLocalGuess(playerId)
    onGuess(playerId)
  }

  return (
    <div className="flex-1 flex flex-col items-center py-6 gap-6">
      <CircularTimer totalSeconds={totalSeconds} secondsLeft={secondsLeft} size={90} />

      {isMantri ? (
        <>
          <p className="text-lg font-bold font-display text-center">{t('whoIsTheChor')}</p>
          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            {others.map((p) => {
              const selected = localGuess === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => handlePick(p.id)}
                  disabled={!!localGuess}
                  className={`min-h-[64px] rounded-2xl border-[1.5px] flex flex-col items-center justify-center gap-1 px-3 py-3 transition-colors disabled:opacity-60 ${
                    selected ? 'bg-plum text-onPlum border-plum' : 'bg-surfaceElevated text-textPrimary border-border hover:border-plum/50'
                  }`}
                >
                  <span className="text-xl leading-none">{p.avatar}</span>
                  <span className="text-sm font-semibold truncate max-w-full">{p.name}</span>
                </button>
              )
            })}
          </div>
          {localGuess && (
            <p className="text-sm text-textMuted">{t('lockedInWaiting')}</p>
          )}
        </>
      ) : (
        <p className="text-center text-textMuted">{t('mantriIsChoosing')}</p>
      )}
    </div>
  )
}
