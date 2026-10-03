import { parseCard, rankIndex } from '../../multiplayer/deck'
import { getLegalPlays } from '../../multiplayer/trick'
import { MISTAKE_RATE, pickRandom } from '../../multiplayer/bots/bots'

const value = card => (parseCard(card).rank === 'A' ? 13 : rankIndex(parseCard(card).rank))
const byValue = cards => [...cards].sort((a, b) => value(a) - value(b))
const suitOf = card => parseCard(card).suit

// Whoever holds the pile's highest card picks it all up if anyone breaks
// suit, so stay under the current high card, lead low, and when void dump
// the highest card held.
function chooseCard(state, botId, difficulty) {
  const hand = state.hands[botId] ?? []
  const pile = state.pile ?? []
  if (state.isFirstRound && pile.length === 0) return 'AS'
  const legal = getLegalPlays(hand, state.ledSuit)
  if (legal.length === 1) return legal[0]
  if (Math.random() < MISTAKE_RATE[difficulty]) return pickRandom(legal)

  if (pile.length === 0) {
    const bySuit = {}
    for (const c of hand) (bySuit[suitOf(c)] ??= []).push(c)
    const others = (state.pileParticipants ?? []).filter(id => id !== botId)
    const outstanding = suit => others.flatMap(id => state.hands[id] ?? []).filter(c => suitOf(c) === suit).length
    // Hard leads the suit most cards are still out in (others least likely void).
    const suits = Object.keys(bySuit)
    const suit = difficulty === 'hard'
      ? suits.reduce((a, b) => (outstanding(b) > outstanding(a) ? b : a))
      : suits.reduce((a, b) => (bySuit[b].length > bySuit[a].length ? b : a))
    return byValue(bySuit[suit])[0]
  }

  const following = legal.some(c => suitOf(c) === state.ledSuit)
  if (!following) return byValue(legal).at(-1)

  const isLast = pile.length === (state.pileParticipants ?? []).length - 1
  if (isLast) return byValue(legal).at(-1)
  const high = Math.max(...pile.filter(p => suitOf(p.card) === state.ledSuit).map(p => value(p.card)))
  const under = byValue(legal.filter(c => value(c) < high))
  return under.length ? under.at(-1) : byValue(legal)[0]
}

export function getBotTurns(state) {
  if (state.phase !== 'playing' || state.pileResult) return []
  const botId = state.pileParticipants?.[state.pileIdx ?? 0]
  const hand = state.hands?.[botId] ?? []
  return [{
    botId,
    key: `play:${[...hand].sort().join(',')}`,
    act: difficulty => ({ type: 'PLAY', payload: { cardId: chooseCard(state, botId, difficulty) } })
  }]
}
