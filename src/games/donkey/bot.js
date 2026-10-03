import { parseCard } from '../../multiplayer/deck'
import { MISTAKE_RATE, pickRandom } from '../../multiplayer/bots/bots'

// Seconds-range a bot takes to slap when someone signals four of a kind.
const REACTION_MS = { easy: [2500, 5000], medium: [1200, 3000], hard: [700, 1800] }

// Keep the rank held most, pass away a card of the rank held least.
function chooseCardToPass(hand, difficulty) {
  if (Math.random() < MISTAKE_RATE[difficulty]) return pickRandom(hand)
  const count = card => hand.filter(c => parseCard(c).rank === parseCard(card).rank).length
  const fewest = Math.min(...hand.map(count))
  // Random among ties — a fixed pick lets all-AI tables pass in a loop forever.
  return pickRandom(hand.filter(c => count(c) === fewest))
}

export function getBotTurns(state) {
  const { phase, turnOrder = [], hands = {}, roundNumber } = state

  if (phase === 'passing') {
    return turnOrder.map(botId => ({
      botId,
      key: `pass:${roundNumber}:${state.passRoundIndex}`,
      act: difficulty => ({ type: 'PASS_CARD', payload: { cardId: chooseCardToPass(hands[botId] ?? [], difficulty) } })
    }))
  }

  if (phase === 'reacting') {
    return turnOrder
      .filter(id => !(state.signaledPlayerIds ?? []).includes(id))
      .map(botId => ({
        botId,
        key: `react:${roundNumber}:${state.reactDeadline}`,
        act: () => ({ type: 'REACT', payload: {} }),
        delay: difficulty => {
          const [min, max] = REACTION_MS[difficulty]
          return min + Math.random() * (max - min)
        }
      }))
  }
  return []
}
