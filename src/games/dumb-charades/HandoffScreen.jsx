import { ACTIONS } from './reducer'

export function HandoffScreen({ state, dispatch }) {
  const { teams, currentTeamIdx, winPoints } = state
  const currentTeam = teams[currentTeamIdx]

  // Determine which player number is acting (1-based, cycles through memberCount)
  const playerNum = (currentTeam.actorIdx % currentTeam.memberCount) + 1

  return (
    <div className="px-4 py-8 flex flex-col items-center space-y-6 text-center min-h-[80vh] justify-center">
      {/* Team badge */}
      <div className="bg-pink-500/20 border border-pink-500/40 rounded-2xl px-8 py-4">
        <p className="text-3xl font-black text-white">{currentTeam.name}</p>
        <p className="text-pink-400 text-sm font-semibold mt-1">Your Turn!</p>
      </div>

      {/* Actor indicator */}
      <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl px-6 py-4 w-full max-w-xs">
        <p className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Acting now</p>
        <p className="text-white text-xl font-black">
          🎭 Player {playerNum}
        </p>
        <p className="text-zinc-500 text-xs mt-1">
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
                    ? 'bg-pink-500/10 border-pink-500/40'
                    : 'bg-zinc-800/60 border-zinc-700/40'
                }`}
              >
                <span className={`font-semibold text-sm ${tm.name === currentTeam.name ? 'text-white' : 'text-zinc-400'}`}>
                  {tm.name}
                </span>
                <div className="flex items-center gap-1.5">
                  {dots.map((filled, i) => (
                    <span key={i} className={`w-2.5 h-2.5 rounded-full ${filled ? 'bg-pink-500' : 'bg-zinc-700'}`} />
                  ))}
                  <span className="text-zinc-500 text-xs ml-1">{tm.score}/{winPoints}</span>
                </div>
              </div>
            )
          })}
      </div>

      {/* Look away instruction */}
      <p className="text-zinc-500 text-sm font-medium">
        👀 Everyone else — look away!
      </p>

      {/* CTA */}
      <div className="w-full pt-2">
        <button
          onClick={() => dispatch({ type: ACTIONS.ACTOR_READY })}
          className="w-full py-5 rounded-2xl bg-pink-500 hover:bg-pink-400 active:scale-[0.98] text-white font-black text-xl transition-colors select-none"
        >
          I'm the actor — show me the word 👁
        </button>
      </div>
    </div>
  )
}
