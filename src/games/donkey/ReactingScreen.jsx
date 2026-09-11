import { useState, useEffect } from 'react'
import { PlayerSeat } from '../../components/cards/PlayerSeat'
import CircularTimer from '../../components/CircularTimer'

const TOTAL_SECONDS = 8

export function ReactingScreen({ players, myId, signaledPlayerIds, deadline, isSignaled, hasReacted, onReact }) {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS)

  useEffect(() => {
    const tick = () => {
      setSecondsLeft(Math.max(0, Math.round((deadline - Date.now()) / 1000)))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  const otherPlayers = players.filter(p => p.id !== myId)

  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 gap-6 max-w-lg w-full mx-auto">
      <div className="flex flex-wrap justify-center gap-6">
        {otherPlayers.map(p => (
          <PlayerSeat
            key={p.id}
            player={p}
            cardCount={4}
            isActiveTurn={signaledPlayerIds.includes(p.id)}
            accent="amber"
            label={signaledPlayerIds.includes(p.id) ? 'Signaled!' : undefined}
          />
        ))}
      </div>

      {isSignaled ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <p className="text-xl font-bold font-display text-amber">You got it!</p>
          <p className="text-sm text-textMuted">Waiting for everyone else to notice…</p>
        </div>
      ) : (
        <>
          <CircularTimer totalSeconds={TOTAL_SECONDS} secondsLeft={secondsLeft} size={72} />
          <button
            onClick={onReact}
            disabled={hasReacted}
            className="min-h-[64px] w-full rounded-2xl bg-amber text-onAmber font-bold text-lg disabled:opacity-40"
          >
            {hasReacted ? 'Waiting…' : 'Copy the Signal!'}
          </button>
        </>
      )}
    </div>
  )
}
