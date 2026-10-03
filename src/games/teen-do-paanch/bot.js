import { chooseTrickCard, chooseTrumpSuit } from '../../multiplayer/bots/trickStrategy'
import { canRequestReveal } from './teenDoPaanchLogic'

export function getBotTurns(state) {
  const { phase, turnOrder = [], hands = {}, roundNumber } = state

  if (phase === 'calling_trump') {
    const botId = state.callerId
    return [{
      botId,
      key: `call:${roundNumber}`,
      act: difficulty => ({ type: 'CALL_TRUMP', payload: { suit: chooseTrumpSuit(hands[botId], difficulty), mode: 'declared' } })
    }]
  }

  if (phase !== 'playing' || state.handWinnerId) return []
  const botId = turnOrder[state.currentIdx]
  const hand = hands[botId] ?? []
  const revealed = !!state.trumpRevealed
  return [{
    botId,
    key: `play:${roundNumber}:${hand.length}:${revealed}`,
    act: difficulty => {
      if (state.trumpMode === 'hidden' && !revealed && difficulty !== 'easy' && canRequestReveal(hand, state.ledSuit)) {
        return { type: 'REVEAL_TRUMP', payload: {} }
      }
      const cardId = chooseTrickCard({
        hand,
        currentHand: state.currentHand ?? [],
        ledSuit: state.ledSuit,
        trumpSuit: revealed ? state.trumpSuit : null,
        myId: botId,
        playerCount: turnOrder.length,
        unplayed: turnOrder.filter(id => id !== botId).flatMap(id => hands[id] ?? []),
        difficulty
      })
      return { type: 'PLAY', payload: { cardId } }
    }
  }]
}
