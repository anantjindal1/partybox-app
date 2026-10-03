import { chooseTrickCard, estimateHandsWon } from '../../multiplayer/bots/trickStrategy'

export function getBotTurns(state) {
  const { phase, turnOrder = [], hands = {}, roundNumber } = state

  if (phase === 'bidding') {
    return turnOrder.map(botId => ({
      botId,
      key: `bid:${roundNumber}`,
      act: difficulty => ({
        type: 'BID',
        payload: { bid: Math.min(13, Math.max(1, estimateHandsWon(hands[botId] ?? [], 'spades', difficulty))) }
      })
    }))
  }

  if (phase !== 'playing' || state.handWinnerId) return []
  const botId = turnOrder[state.currentIdx]
  const hand = hands[botId] ?? []
  return [{
    botId,
    key: `play:${roundNumber}:${hand.length}:${(state.currentHand ?? []).length}`,
    act: difficulty => ({
      type: 'PLAY',
      payload: {
        cardId: chooseTrickCard({
          hand,
          currentHand: state.currentHand ?? [],
          ledSuit: state.ledSuit,
          trumpSuit: 'spades',
          myId: botId,
          playerCount: turnOrder.length,
          unplayed: turnOrder.filter(id => id !== botId).flatMap(id => hands[id] ?? []),
          difficulty
        })
      }
    })
  }]
}
