import { ACTIONS } from './reducer'

export function HandoffScreen({ state, dispatch }) {
  const { teams, currentTeamIdx, winPoints } = state
  const currentTeam = teams[currentTeamIdx]

  // Determine which player number is acting (1-based, cycles through memberCount)
  const playerNum = (currentTeam.actorIdx % currentTeam.memberCount) + 1

  return (
    <div className="px-4 py-8 flex flex-col items-center space-y-6 text-center min-h-[80vh] justify-center">
      {/* Team badge */}
      <div className="bg-terracotta/20 border border-terracotta/40 rounded-2xl px-8 py-4">
        <p className="text-3xl font-black text-textPrimary">{currentTeam.name}</p>
        <p className="text-terracotta text-sm font-semibold mt-1">Your Turn!</p>
      </div>

      {/* Actor indicator */}
      <div className="bg-surfaceElevated/80 border border-border/50 rounded-2xl px-6 py-4 w-full max-w-xs">
        <p className="text-textMuted text-xs uppercase tracking-widest mb-1">Acting now</p>
        <p className="text-textPrimary text-xl font-black">
          🎭 Player {playerNum}
        </p>
        <p className="text-textMuted text-xs mt-1">
          (rotate each turn)
        </p>
      </div>

      {/* Scoreboard */}
      <div className="w-full space-y-2">
        {[...teams]
          .sort((a, b) => b.score - a.score)
          .map(tm => {
            const dots = Array.from({ length: winPoints }, (_, i) => i < tm.score)
            return (
              <div
                key={tm.name}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  tm.name === currentTeam.name
                    ? 'bg-terracotta/10 border-terracotta/40'
                    : 'bg-surfaceElevated/60 border-border/40'
                }`}
              >
                <span className={`font-semibold text-sm ${tm.name === currentTeam.name ? 'text-textPrimary' : 'text-textMuted'}`}>
                  {tm.name}
                </span>
                <div className="flex items-center gap-1.5">
                  {dots.map((filled, i) => (
                    <span key={i} className={`w-2.5 h-2.5 rounded-full ${filled ? 'bg-terracotta' : 'bg-surfaceMuted'}`} />
                  ))}
                  <span className="text-textMuted text-xs ml-1">{tm.score}/{winPoints}</span>
                </div>
              </div>
            )
          })}
      </div>

      {/* Look away instruction */}
      <p className="text-textMuted text-sm font-medium">
        👀 Everyone else — look away!
      </p>

      {/* CTA */}
      <div className="w-full pt-2">
        <button
          onClick={() => dispatch({ type: ACTIONS.ACTOR_READY })}
          className="w-full py-5 rounded-2xl bg-terracotta hover:opacity-90 active:scale-[0.98] text-onTerracotta font-black text-xl transition-colors select-none"
        >
          I'm the actor — show me the word 👁
        </button>
      </div>
    </div>
  )
}
