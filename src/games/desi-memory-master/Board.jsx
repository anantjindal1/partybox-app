/**
 * Responsive grid of memory cards. Grid adapts to difficulty (4x4, 5x4, 6x4). Large tap targets.
 */
import { Card } from './Card'

function getGridCols(difficulty) {
  return { easy: 'grid-cols-4', medium: 'grid-cols-5', hard: 'grid-cols-6' }[difficulty] || 'grid-cols-4'
}

export function Board({ board, flippedIndices, matchedIndices, onCardClick, disabled }) {
  const flippedSet = new Set(flippedIndices || [])
  const matchedSet = new Set(matchedIndices || [])
  const difficulty = board.length <= 16 ? 'easy' : board.length <= 20 ? 'medium' : 'hard'
  const gridCols = getGridCols(difficulty)

  return (
    <div className={`grid ${gridCols} gap-2 sm:gap-3 max-w-2xl mx-auto`}>
      {board.map((card, index) => (
        <Card
          key={card.id}
          value={card.value}
          isFlipped={flippedSet.has(index)}
          isMatched={matchedSet.has(index)}
          onClick={() => onCardClick(index)}
          disabled={disabled}
        />
      ))}
    </div>
  )
}
