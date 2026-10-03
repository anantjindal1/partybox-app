import { parseCard, rankIndex, SUITS } from '../../multiplayer/deck'
import { MISTAKE_RATE, pickRandom } from '../../multiplayer/bots/bots'
import { getLegalPlays } from './sattiLogic'

const SEVEN_IDX = rankIndex('7')

// How many of my own cards this play opens the way to — play what frees
// my hand and hold back what would only free opponents'.
function unlockScore(card, hand) {
  const { rank, suit } = parseCard(card)
  const idx = rankIndex(rank)
  const sameSuit = hand.filter(c => c !== card && parseCard(c).suit === suit).map(c => rankIndex(parseCard(c).rank))
  if (idx === SEVEN_IDX) return sameSuit.length
  return sameSuit.filter(i => (idx > SEVEN_IDX ? i > idx : i < idx)).length
}

function chooseCard(hand, board, difficulty) {
  const legal = getLegalPlays(hand, board)
  if (legal.length === 1 || Math.random() < MISTAKE_RATE[difficulty]) return pickRandom(legal)
  return legal.reduce((a, b) => (unlockScore(b, hand) > unlockScore(a, hand) ? b : a))
}

export function getBotTurns(state) {
  if (state.phase !== 'playing') return []
  const botId = state.turnOrder?.[state.currentIdx]
  const hand = state.hands?.[botId] ?? []
  const boardKey = SUITS.map(s => `${state.board?.[s]?.low}-${state.board?.[s]?.high}`).join('|')
  return [{
    botId,
    key: `${hand.length}:${boardKey}:${state.consecutivePasses}`,
    act: difficulty => getLegalPlays(hand, state.board).length
      ? { type: 'PLAY', payload: { cardId: chooseCard(hand, state.board, difficulty) } }
      : { type: 'PASS', payload: {} }
  }]
}
