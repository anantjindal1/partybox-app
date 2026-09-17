import { useState } from 'react'

function ClueForm({ onSubmit }) {
  const [word, setWord] = useState('')
  const [number, setNumber] = useState(1)

  return (
    <div className="rounded-xl border-[1.5px] border-sage bg-sage/10 p-3 flex flex-col gap-2">
      <p className="text-xs font-semibold text-sage uppercase tracking-wider">Give a clue</p>
      <div className="flex gap-2">
        <input
          value={word}
          onChange={e => setWord(e.target.value)}
          placeholder="One word..."
          className="flex-1 min-h-[40px] rounded-lg border-[1.5px] border-border bg-surfaceElevated px-3 text-textPrimary focus:outline-none focus:border-sage"
        />
        <select
          value={number}
          onChange={e => setNumber(Number(e.target.value))}
          className="min-h-[40px] rounded-lg border-[1.5px] border-border bg-surfaceElevated px-2 text-textPrimary"
        >
          {Array.from({ length: 4 }, (_, i) => i).map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <button
        onClick={() => onSubmit(word.trim(), number)}
        disabled={word.trim().length === 0}
        className="min-h-[40px] rounded-lg bg-sage text-onSage font-bold disabled:opacity-40"
      >
        Submit Clue
      </button>
    </div>
  )
}

const CARD_COLOR_CLASSES = {
  red: 'bg-maroon text-onMaroon border-maroon',
  blue: 'bg-cobalt text-onCobalt border-cobalt',
  neutral: 'bg-surfaceMuted text-textMuted border-border',
  assassin: 'bg-textPrimary text-surface border-textPrimary',
}

const SPYMASTER_TINT_CLASSES = {
  red: 'bg-maroon/20 border-maroon text-textPrimary',
  blue: 'bg-cobalt/20 border-cobalt text-textPrimary',
  neutral: 'bg-surfaceElevated border-border text-textPrimary',
  assassin: 'bg-textPrimary text-surface border-textPrimary',
}

export function BoardScreen({
  board,
  isSpymaster,
  myTeam,
  activeTeam,
  currentClue,
  clueHistory = [],
  guessesUsed,
  maxGuessesAllowed,
  remaining,
  canGiveClue,
  canGuess,
  onSubmitClue,
  onTapCard,
  onPass,
}) {
  return (
    <div className="flex-1 flex flex-col gap-4 px-3 sm:px-6 py-4 max-w-2xl w-full mx-auto">
      <div className="flex items-center justify-between text-sm font-bold">
        <span className="text-maroon">Red: {remaining.red} left</span>
        <span className={`uppercase tracking-wider ${activeTeam === 'red' ? 'text-maroon' : 'text-cobalt'}`}>
          {activeTeam}'s turn
        </span>
        <span className="text-cobalt">Blue: {remaining.blue} left</span>
      </div>

      {clueHistory.length > 0 && (
        <div className="w-full max-h-32 overflow-y-auto rounded-xl border-[1.5px] border-border bg-surfaceElevated">
          {clueHistory.map((entry, i) => (
            <div
              key={i}
              className={`flex justify-between px-3 py-1.5 text-xs ${i !== 0 ? 'border-t border-border/60' : ''}`}
            >
              <span className={`font-semibold uppercase ${entry.team === 'red' ? 'text-maroon' : 'text-cobalt'}`}>
                {entry.team}
              </span>
              <span className="font-semibold text-textPrimary">{entry.word} — {entry.number}</span>
            </div>
          ))}
        </div>
      )}

      {currentClue ? (
        <div className="rounded-xl border-[1.5px] border-border bg-surfaceElevated p-3 flex items-center justify-between">
          <p className="text-textPrimary font-semibold">
            Clue: <span className="font-bold uppercase">{currentClue.word}</span> — {currentClue.number}
            <span className="text-textMuted font-normal"> ({guessesUsed}/{maxGuessesAllowed} guesses used)</span>
          </p>
          {canGuess && (
            <button onClick={onPass} className="text-xs font-semibold px-3 py-2 rounded-lg border-[1.5px] border-border text-textPrimary">
              Pass
            </button>
          )}
        </div>
      ) : canGiveClue ? (
        <ClueForm onSubmit={onSubmitClue} />
      ) : (
        <p className="text-center text-textMuted text-sm">
          Waiting for {activeTeam}'s spymaster to give a clue…
        </p>
      )}

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {board.map(card => {
          const showColor = card.revealed || isSpymaster
          const classes = card.revealed
            ? CARD_COLOR_CLASSES[card.color]
            : showColor
            ? SPYMASTER_TINT_CLASSES[card.color]
            : 'bg-surfaceElevated border-border text-textPrimary'
          const tappable = canGuess && !card.revealed
          return (
            <button
              key={card.id}
              onClick={() => tappable && onTapCard(card.id)}
              disabled={!tappable}
              className={`aspect-square rounded-md sm:rounded-lg border-[1.5px] flex items-center justify-center text-center p-0.5 sm:p-1 text-[9px] sm:text-xs font-bold uppercase leading-tight transition-colors ${classes} ${
                tappable ? 'active:scale-95' : ''
              } ${card.revealed ? 'opacity-90' : ''}`}
            >
              {card.color === 'assassin' && showColor ? `💀 ${card.word}` : card.word}
            </button>
          )
        })}
      </div>

      {myTeam && (
        <p className="text-center text-xs text-textMuted">
          You're on {myTeam}{isSpymaster ? ' as spymaster' : ''}
        </p>
      )}
    </div>
  )
}
