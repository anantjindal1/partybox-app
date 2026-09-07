import { useEffect } from 'react'
import { ACTIONS } from './reducer'
import AdBanner from '../../components/AdBanner'

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
        <h2 className="text-2xl font-black text-textPrimary">
          {wasCorrect ? 'Guessed it!' : "Time's up!"}
        </h2>
        <p className="text-textMuted text-sm">{currentTeam.name}</p>
      </div>

      {/* Outcome card */}
      {wasCorrect ? (
        <div className="bg-teal/15 border border-teal/30 rounded-2xl px-5 py-4 text-center space-y-1">
          <p className="text-teal font-black text-xl">✓ +1 point 🎉</p>
          {correctEntry && (
            <p className="text-textPrimary font-bold text-lg">{correctEntry.word}</p>
          )}
        </div>
      ) : (
        <div className="bg-surfaceElevated/60 border border-border/40 rounded-2xl px-5 py-4 text-center space-y-1">
          <p className="text-textMuted font-semibold text-base">No point this turn</p>
          {timeoutEntry && (
            <p className="text-textMuted text-sm">
              Was acting: <span className="text-textSecondary font-semibold">{timeoutEntry.word}</span>
            </p>
          )}
        </div>
      )}

      {/* Skipped words */}
      {skippedWords.length > 0 && (
        <div className="bg-surfaceElevated/80 border border-border/50 rounded-2xl px-4 py-3">
          <p className="text-textMuted text-xs uppercase tracking-widest mb-2">Skipped</p>
          <p className="text-textMuted text-sm leading-relaxed">
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
                    ? 'bg-terracotta/10 border-terracotta/40'
                    : 'bg-surfaceElevated/60 border-border/40'
                }`}
              >
                <span className={`font-semibold text-sm flex-1 ${isCurrent ? 'text-textPrimary' : 'text-textMuted'}`}>
                  {tm.name}
                </span>
                <div className="flex items-center gap-1">
                  {dots.map((filled, i) => (
                    <span key={i} className={`w-3 h-3 rounded-full ${filled ? 'bg-terracotta' : 'bg-surfaceMuted'}`} />
                  ))}
                </div>
                <span className="text-textMuted text-xs tabular-nums w-8 text-right">{tm.score}/{winPoints}</span>
              </div>
            )
          })}
      </div>

      <button
        onClick={() => dispatch({ type: ACTIONS.NEXT_TURN })}
        className="w-full py-4 rounded-2xl bg-terracotta hover:opacity-90 text-onTerracotta font-black text-lg transition-colors active:scale-[0.98]"
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
  const waUrl = `https://wa.me/+919001290623?text=${encodeURIComponent(shareText)}`

  return (
    <div className="px-4 py-6 space-y-5 pb-36">
      {/* Winner announcement */}
      <div className="text-center space-y-2">
        <p className="text-6xl">{isTie ? '🤝' : '🏆'}</p>
        <h2 className="text-3xl font-black text-textPrimary">
          {isTie ? "It's a Tie!" : `${winners[0].name} Wins!`}
        </h2>
        {isTie && (
          <p className="text-textMuted text-sm">{winnerNames} are tied!</p>
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
                    ? 'bg-terracotta/20 border-terracotta/50'
                    : 'bg-surfaceElevated/80 border-border/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}</span>
                  <span className={`font-bold text-base ${isWinner ? 'text-textPrimary' : 'text-textSecondary'}`}>
                    {tm.name}
                  </span>
                </div>
                <span className={`text-2xl font-black ${isWinner ? 'text-terracotta' : 'text-textMuted'}`}>
                  {tm.score} pts
                </span>
              </div>
            )
          })}
      </div>

      {/* Game stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surfaceElevated/80 border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-teal">{totalCorrect}</p>
          <p className="text-textMuted text-xs mt-0.5">words guessed</p>
        </div>
        <div className="bg-surfaceElevated/80 border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-terracotta">{totalRounds}</p>
          <p className="text-textMuted text-xs mt-0.5">turns played</p>
        </div>
      </div>

      {/* Share */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-teal hover:opacity-90 text-onTeal font-bold text-base transition-colors"
      >
        📱 Share on WhatsApp
      </a>

      {/* CTAs — sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-bg via-bg/95 to-transparent space-y-3">
        <AdBanner slot="dumbcharades-end" className="mb-3" />
        <button
          onClick={() => dispatch({ type: ACTIONS.PLAY_AGAIN })}
          className="w-full py-4 rounded-2xl bg-terracotta hover:opacity-90 text-onTerracotta font-black text-lg transition-colors active:scale-[0.98]"
        >
          Play Again 🎭
        </button>
        <button
          onClick={() => dispatch({ type: 'CHANGE_SETTINGS' })}
          className="w-full py-3 rounded-2xl bg-transparent border border-border hover:border-border text-textMuted hover:text-textSecondary font-bold text-base transition-colors active:scale-[0.98]"
        >
          Change Settings
        </button>
      </div>
    </div>
  )
}
