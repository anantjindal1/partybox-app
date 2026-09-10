import { parseCard, rankIndex, SUITS } from '../../multiplayer/deck'

const SEVEN_IDX = rankIndex('7')

function emptySuit() {
  return { low: null, high: null }
}

export function createEmptyBoard() {
  const board = {}
  for (const suit of SUITS) board[suit] = emptySuit()
  return board
}

/**
 * A card is legal if it's the not-yet-played 7 of its suit, or it
 * directly extends that suit's already-open run at either end (one
 * above the current high, or one below the current low). Nothing else
 * is ever legal, including cards for a suit whose run has already
 * closed (low reached the Ace, high reached the King).
 */
export function isLegalPlay(cardId, board) {
  const { rank, suit } = parseCard(cardId)
  const idx = rankIndex(rank)
  const { low, high } = board[suit]
  if (low === null) return idx === SEVEN_IDX
  return idx === high + 1 || idx === low - 1
}

export function getLegalPlays(hand, board) {
  return hand.filter(id => isLegalPlay(id, board))
}

export function applyPlayToBoard(board, cardId) {
  const { rank, suit } = parseCard(cardId)
  const idx = rankIndex(rank)
  const current = board[suit]
  const next =
    current.low === null
      ? { low: SEVEN_IDX, high: SEVEN_IDX }
      : idx === current.high + 1
        ? { ...current, high: idx }
        : { ...current, low: idx }
  return { ...board, [suit]: next }
}

/**
 * A full pass-around (every player in a row had no legal move) ends the
 * game immediately. Whoever holds the fewest cards wins — genuine
 * co-winners on a tie, never re-resolved further.
 */
export function computeStalemateWinners(hands, turnOrder) {
  const counts = turnOrder.map(id => ({ id, count: hands[id].length }))
  const min = Math.min(...counts.map(c => c.count))
  return counts.filter(c => c.count === min).map(c => c.id)
}
