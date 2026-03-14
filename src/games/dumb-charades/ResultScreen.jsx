import { useEffect } from 'react'
import { ACTIONS } from './reducer'

// ── TurnResultScreen ──────────────────────────────────────────────────────────

export function TurnResultScreen({ state, dispatch }) {
  const { teams, currentTeamIdx, turnOutcome, turnHistory, winPoints } = state
  const currentTeam = teams[currentTeamIdx]

  const wasCorrect = turnOutcome === 'correct'
  const correctEntry  = turnHistory.find(e => e.result === 'correct')
  const timeoutEntry  = turnHistory.find(e => e.result === 'timeout')
  const skippedWords  = turnHistory.filter(e => e.result === 'skip').map(e => e.word)

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-5xl">{wasCorrect ? '🎉' : '⏰'}</p>
        <h2 className="text-2xl font-black text-white">
          {wasCorrect ? 'Guessed it!' : "Time's up!"}
        </h2>
        <p className="text-zinc-400 text-sm">{currentTeam.name}</p>
      </div>

      {/* Outcome card */}
      {wasCorrect ? (
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl px-5 py-4 text-center space-y-1">
          <p className="text-emerald-400 font-black text-xl">✓ +1 point 🎉</p>
          {correctEntry && (
            <p className="text-white font-bold text-lg">{correctEntry.word}</p>
          )}
        </div>
      ) : (
        <div className="bg-zinc-800/60 border border-zinc-700/40 rounded-2xl px-5 py-4 text-center space-y-1">
          <p className="text-zinc-400 font-semibold text-base">No point this turn</p>
          {timeoutEntry && (
            <p className="text-zinc-500 text-sm">
              Was acting: <span className="text-zinc-300 font-semibold">{timeoutEntry.word}</span>
            </p>
          )}
        </div>
      )}

      {/* Skipped words */}
      {skippedWords.length > 0 && (
        <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl px-4 py-3">
          <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2">Skipped</p>
          <p className="text-zinc-500 text-sm leading-relaxed">
            {skippedWords.join(', ')}
          </p>
        </div>
      )}

      {/* Score progress — all teams */}
      <div className="space-y-2">
        {[...teams]
          .sort((a, b) => b.score - a.score)
          .map(tm => {
            const dots = Array.from({ length: winPoints }, (_, i) => i < tm.score)
            const isCurrent = tm.name === currentTeam.name
            return (
              <div
                key={tm.name}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  isCurrent
                    ? 'bg-pink-500/10 border-pink-500/40'
                    : 'bg-zinc-800/60 border-zinc-700/40'
                }`}
              >
                <span className={`font-semibold text-sm flex-1 ${isCurrent ? 'text-white' : 'text-zinc-400'}`}>
                  {tm.name}
                </span>
                <div className="flex items-center gap-1">
                  {dots.map((filled, i) => (
                    <span key={i} className={`w-3 h-3 rounded-full ${filled ? 'bg-pink-500' : 'bg-zinc-700'}`} />
                  ))}
                </div>
                <span className="text-zinc-500 text-xs tabular-nums w-8 text-right">{tm.score}/{winPoints}</span>
              </div>
            )
          })}
      </div>

      <button
        onClick={() => dispatch({ type: ACTIONS.NEXT_TURN })}
        className="w-full py-4 rounded-2xl bg-pink-500 hover:bg-pink-400 text-white font-black text-lg transition-colors active:scale-[0.98]"
      >
        Next Turn →
      </button>
    </div>
  )
}

// ── GameEndScreen ─────────────────────────────────────────────────────────────

export function GameEndScreen({ state, dispatch }) {
  const { teams, gameHistory } = state

  // Find winner(s)
  const maxScore = Math.max(...teams.map(t => t.score))
  const winners  = teams.filter(t => t.score === maxScore)
  const isTie    = winners.length > 1

  const totalCorrect = gameHistory.reduce((sum, t) => sum + (t.correct ?? 0), 0)
  const totalRounds  = gameHistory.length

  // XP award on mount
  useEffect(() => {
    import('../../services/xp').then(({ awardXP }) => {
      awardXP(totalCorrect * 5).catch(() => {})
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Confetti
  useEffect(() => {
    import('canvas-confetti').then(mod => {
      const fire = mod.default
      fire({ particleCount: 140, spread: 80, origin: { y: 0.4 },
        colors: ['#ec4899', '#f97316', '#facc15', '#34d399', '#60a5fa'] })
      setTimeout(() => {
        fire({ particleCount: 60, spread: 50, origin: { y: 0.6 }, angle: 60 })
        fire({ particleCount: 60, spread: 50, origin: { y: 0.6 }, angle: 120 })
      }, 700)
    })
  }, [])

  // WhatsApp share
  const winnerNames = winners.map(w => w.name).join(' & ')
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://partybox-app.vercel.app'
  const shareText = `${winnerNames} just crushed Dumb Charades! 🎬\nGuessed ${totalCorrect} words in ${totalRounds} rounds.\nThink you can beat us? → ${appUrl}`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  return (
    <div className="px-4 py-6 space-y-5 pb-36">
      {/* Winner announcement */}
      <div className="text-center space-y-2">
        <p className="text-6xl">{isTie ? '🤝' : '🏆'}</p>
        <h2 className="text-3xl font-black text-white">
          {isTie ? "It's a Tie!" : `${winners[0].name} Wins!`}
        </h2>
        {isTie && (
          <p className="text-zinc-400 text-sm">{winnerNames} are tied!</p>
        )}
      </div>

      {/* Final scoreboard */}
      <div className="space-y-2">
        {[...teams]
          .sort((a, b) => b.score - a.score)
          .map((tm, rank) => {
            const isWinner = winners.some(w => w.name === tm.name)
            return (
              <div
                key={tm.name}
                className={`flex items-center justify-between px-5 py-4 rounded-2xl border ${
                  isWinner
                    ? 'bg-pink-500/20 border-pink-500/50'
                    : 'bg-zinc-800/80 border-zinc-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}</span>
                  <span className={`font-bold text-base ${isWinner ? 'text-white' : 'text-zinc-300'}`}>
                    {tm.name}
                  </span>
                </div>
                <span className={`text-2xl font-black ${isWinner ? 'text-pink-400' : 'text-zinc-400'}`}>
                  {tm.score} pts
                </span>
              </div>
            )
          })}
      </div>

      {/* Game stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-400">{totalCorrect}</p>
          <p className="text-zinc-500 text-xs mt-0.5">words guessed</p>
        </div>
        <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-pink-400">{totalRounds}</p>
          <p className="text-zinc-500 text-xs mt-0.5">turns played</p>
        </div>
      </div>

      {/* Share */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition-colors"
      >
        📱 Share on WhatsApp
      </a>

      {/* CTAs — sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-zinc-900 via-zinc-900/95 to-transparent space-y-3">
        <button
          onClick={() => dispatch({ type: ACTIONS.PLAY_AGAIN })}
          className="w-full py-4 rounded-2xl bg-pink-500 hover:bg-pink-400 text-white font-black text-lg transition-colors active:scale-[0.98]"
        >
          Play Again 🎭
        </button>
        <button
          onClick={() => dispatch({ type: 'CHANGE_SETTINGS' })}
          className="w-full py-3 rounded-2xl bg-transparent border border-zinc-600 hover:border-zinc-500 text-zinc-400 hover:text-zinc-300 font-bold text-base transition-colors active:scale-[0.98]"
        >
          Change Settings
        </button>
      </div>
    </div>
  )
}
