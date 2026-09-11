import { useState, useEffect } from 'react'
import CircularTimer from '../../components/CircularTimer'
import { PlayingCard } from '../../components/cards/PlayingCard'
import { parseCard } from '../../multiplayer/deck'

const TOTAL_SECONDS = 3

export function PassingScreen({ myHand, deadline, chosenCount, totalCount, hasChosen, onChoose }) {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS)

  useEffect(() => {
    const tick = () => {
      setSecondsLeft(Math.max(0, Math.round((deadline - Date.now()) / 1000)))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  return (
    <div className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 gap-5 max-w-lg w-full mx-auto">
      <CircularTimer totalSeconds={TOTAL_SECONDS} secondsLeft={secondsLeft} size={72} />
      <p className="text-xs font-semibold text-textMuted uppercase tracking-wider text-center">
        {hasChosen ? 'Waiting for others…' : 'Pick a card to pass'}
      </p>
      <p className="text-xs text-textMuted">{chosenCount}/{totalCount} have chosen</p>

      <div className="flex flex-wrap justify-center gap-2">
        {myHand.map(cardId => {
          const { rank, suit } = parseCard(cardId)
          return (
            <button
              key={cardId}
              type="button"
              disabled={hasChosen}
              onClick={() => onChoose(cardId)}
              className={`transition-transform ${hasChosen ? 'opacity-40' : 'hover:-translate-y-1'}`}
            >
              <PlayingCard face="up" rank={rank} suit={suit} size="lg" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
