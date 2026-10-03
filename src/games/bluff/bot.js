import { parseCard } from '../../multiplayer/deck'
import { pickRandom } from '../../multiplayer/bots/bots'

const rankOf = card => parseCard(card).rank

function groupByRank(hand) {
  const groups = {}
  for (const c of hand) (groups[rankOf(c)] ??= []).push(c)
  return groups
}

// Chance of slipping one extra (false) card into a play.
const LIE_RATE = { easy: 0.1, medium: 0.25, hard: 0.35 }

function withLie(cards, hand, difficulty, rng) {
  const spare = hand.filter(c => !cards.includes(c))
  if (!spare.length || hand.length <= 2 || rng() >= LIE_RATE[difficulty]) return cards
  return [...cards, pickRandom(spare, rng)]
}

function openRound(hand, difficulty, rng) {
  const groups = Object.entries(groupByRank(hand))
  const [rank, cards] = difficulty === 'easy'
    ? pickRandom(groups, rng)
    : groups.reduce((a, b) => (b[1].length > a[1].length ? b : a))
  return { type: 'OPEN_ROUND', payload: { cardIds: withLie(cards, hand, difficulty, rng), claimedRank: rank } }
}

function shouldChallenge(state, hand, difficulty, rng) {
  const copies = 4 * (state.deckCount ?? 1)
  const mine = hand.filter(c => rankOf(c) === state.claimedRank).length
  const claimed = state.latestHandCardIds?.length ?? 0
  if (mine + claimed > copies) return true
  if (difficulty === 'easy') return rng() < 0.15
  const claimantLeft = state.hands[state.latestHandPlayerId]?.length ?? 99
  const pileRisk = (state.pile?.length ?? 0) > 8 ? 0.5 : 1
  let p = 0.08 + 0.12 * (mine + claimed) / copies
  if (claimantLeft <= 2) p += 0.4
  if (difficulty === 'hard' && claimed >= 3) p += 0.15
  return rng() < p * pileRisk
}

function chooseAction(state, botId, difficulty, rng = Math.random) {
  const hand = state.hands[botId] ?? []
  if (!state.latestHandPlayerId) return openRound(hand, difficulty, rng)

  const matching = hand.filter(c => rankOf(c) === state.claimedRank)
  if (state.latestHandPlayerId === botId) {
    return matching.length ? { type: 'ADD', payload: { cardIds: matching } } : { type: 'PASS', payload: {} }
  }
  if (shouldChallenge(state, hand, difficulty, rng)) return { type: 'CHALLENGE', payload: {} }
  if (matching.length) return { type: 'ADD', payload: { cardIds: withLie(matching, hand, difficulty, rng) } }
  if (hand.length > 2 && rng() < LIE_RATE[difficulty]) {
    return { type: 'ADD', payload: { cardIds: [pickRandom(hand, rng)] } }
  }
  return { type: 'PASS', payload: {} }
}

export function getBotTurns(state) {
  if (state.phase !== 'playing' || state.pendingReveal) return []
  const botId = state.turnOrder?.[state.currentIdx]
  const hand = state.hands?.[botId] ?? []
  return [{
    botId,
    key: `${state.round}:${hand.length}:${state.pile?.length ?? 0}:${state.latestHandPlayerId}`,
    act: difficulty => chooseAction(state, botId, difficulty)
  }]
}

export { chooseAction }
