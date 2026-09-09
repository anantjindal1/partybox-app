import { useState } from 'react'
import { MAX_ANSWER_LENGTH } from './voting'

export function AnsweringScreen({ prompt, answersIn, totalPlayers, onSubmit, submitted, isHost, onRevealNow, currentRound, roundCount, t }) {
  const [text, setText] = useState('')

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed || submitted) return
    onSubmit(trimmed.slice(0, MAX_ANSWER_LENGTH))
  }

  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider">
        {t('round')} {currentRound} {t('of')} {roundCount}
      </p>

      <div className="bg-surfaceElevated border-[1.5px] border-fuchsia rounded-2xl p-6 text-center w-full">
        <p className="text-xl font-bold font-display text-textPrimary leading-snug">
          {prompt?.en ?? '...'}
        </p>
      </div>

      {submitted ? (
        <p className="text-sm text-textMuted">Answer locked in — waiting for the room…</p>
      ) : (
        <div className="w-full flex flex-col gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            maxLength={MAX_ANSWER_LENGTH}
            placeholder="Your funniest answer…"
            className="w-full min-h-[48px] rounded-xl border-[1.5px] border-border bg-surfaceElevated px-4 text-textPrimary placeholder:text-textMuted focus:outline-none focus:border-fuchsia"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="min-h-[44px] rounded-xl bg-fuchsia text-onFuchsia font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit Answer →
          </button>
        </div>
      )}

      <div className="w-full flex flex-col items-center gap-3 mt-auto pt-3">
        <p className="text-sm font-semibold text-textMuted">
          {answersIn} of {totalPlayers} answered
        </p>
        {isHost && (
          <button
            onClick={onRevealNow}
            disabled={answersIn === 0}
            className="min-h-[44px] w-full rounded-xl border-[1.5px] border-fuchsia text-fuchsia font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Reveal Answers Now →
          </button>
        )}
      </div>
    </div>
  )
}
