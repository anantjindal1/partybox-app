import { useState } from 'react'
import { SecretWordBanner } from './SecretWordBanner'

export function BhedGuessScreen({ isBhed, secretWord, guessOptions, onGuess, guessed, isHost, onRevealGuess, revealing, hasGuess }) {
  const [localGuess, setLocalGuess] = useState(null)

  function handlePick(wordId) {
    if (guessed || localGuess) return
    setLocalGuess(wordId)
    onGuess(wordId)
  }

  return (
    <div className="flex-1 flex flex-col items-center py-6 gap-5 max-w-lg w-full mx-auto text-center">
      <SecretWordBanner isBhed={isBhed} secretWord={secretWord} />
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">The Bhed was caught!</p>
      <p className="text-lg font-bold font-display text-textPrimary">One chance to steal the win — guess the secret word</p>

      {isBhed ? (
        <div className="grid grid-cols-1 gap-2 w-full">
          {guessOptions.map(w => {
            const selected = localGuess === w.id
            return (
              <button
                key={w.id}
                onClick={() => handlePick(w.id)}
                disabled={!!localGuess}
                className={`min-h-[44px] rounded-xl border-[1.5px] font-semibold transition-colors disabled:opacity-60 ${
                  selected ? 'bg-emerald text-onEmerald border-emerald' : 'bg-surfaceElevated text-textPrimary border-border hover:border-emerald/50'
                }`}
              >
                {w.word.en}
              </button>
            )
          })}
          {localGuess && <p className="text-sm text-textMuted mt-2">Guess locked in — waiting for the host...</p>}
        </div>
      ) : (
        <p className="text-textMuted">The Bhed is guessing the secret word...</p>
      )}

      {isHost && (
        <button
          onClick={onRevealGuess}
          disabled={!hasGuess || revealing}
          className="min-h-[44px] w-full rounded-xl bg-emerald text-onEmerald font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Reveal Guess →
        </button>
      )}
    </div>
  )
}
