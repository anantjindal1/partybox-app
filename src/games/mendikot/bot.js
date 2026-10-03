import { chooseTrickCard } from '../../multiplayer/bots/trickStrategy'
import { getTeamOf } from './mendikotLogic'

const TEN_IDS = ['10S', '10H', '10D', '10C']

export function getBotTurns(state) {
  const { phase, turnOrder = [], hands = {} } = state
  if (phase !== 'playing' || state.handWinnerId) return []
  const botId = turnOrder[state.currentIdx]
  const hand = hands[botId] ?? []
  return [{
    botId,
    key: `play:${hand.length}`,
    act: difficulty => {
      const myTeam = getTeamOf(botId, turnOrder)
      const cardId = chooseTrickCard({
        hand,
        currentHand: state.currentHand ?? [],
        ledSuit: state.ledSuit,
        myId: botId,
        isTeammate: id => getTeamOf(id, turnOrder) === myTeam,
        playerCount: turnOrder.length,
        unplayed: turnOrder.filter(id => id !== botId).flatMap(id => hands[id] ?? []),
        pointCards: TEN_IDS,
        difficulty
      })
      return { type: 'PLAY', payload: { cardId } }
    }
  }]
}
