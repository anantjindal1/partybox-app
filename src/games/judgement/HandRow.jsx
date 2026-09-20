import { PlayingCard } from '../../components/cards/PlayingCard'
import { parseCard } from '../../multiplayer/deck'

export function HandRow({ cards }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {cards.map(cardId => {
        const { rank, suit } = parseCard(cardId)
        return <PlayingCard key={cardId} face="up" rank={rank} suit={suit} size="sm" />
      })}
    </div>
  )
}
