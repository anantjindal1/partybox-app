export function pickWords(wordBank, count = 25, rng = Math.random) {
  const shuffled = [...wordBank].sort(() => rng() - 0.5)
  return shuffled.slice(0, count)
}

export function buildBoard(words, startingTeam, rng = Math.random) {
  const otherTeam = startingTeam === 'red' ? 'blue' : 'red'
  const colors = [
    ...Array(9).fill(startingTeam),
    ...Array(8).fill(otherTeam),
    ...Array(7).fill('neutral'),
    'assassin',
  ]
  const shuffledColors = [...colors].sort(() => rng() - 0.5)
  return words.map((word, i) => ({ id: `w${i}`, word, color: shuffledColors[i], revealed: false }))
}

export function remainingCounts(board) {
  const counts = { red: 0, blue: 0 }
  for (const card of board) {
    if (!card.revealed && (card.color === 'red' || card.color === 'blue')) counts[card.color]++
  }
  return counts
}

export function checkWordsWin(board) {
  const counts = remainingCounts(board)
  if (counts.red === 0) return 'red'
  if (counts.blue === 0) return 'blue'
  return null
}

export function maxGuesses(clueNumber) {
  return clueNumber + 1
}
