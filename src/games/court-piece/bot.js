import { chooseTrickCard, chooseTrumpSuit } from '../../multiplayer/bots/trickStrategy'
import { getTeamOf } from './courtPieceLogic'

export function getBotTurns(state) {
  const { phase, turnOrder = [], hands = {}, roundNumber } = state

  if (phase === 'calling_trump') {
    const botId = state.callerId
    return [{
      botId,
      key: `call:${roundNumber}`,
      act: difficulty => ({ type: 'CALL_TRUMP', payload: { suit: chooseTrumpSuit(hands[botId], difficulty) } })
    }]
  }

  // currentIdx stays on the hand's last player during the winner reveal.
  if (phase !== 'playing' || state.handWinnerId) return []
  const botId = turnOrder[state.currentIdx]
  const hand = hands[botId] ?? []
  return [{
    botId,
    key: `play:${roundNumber}:${hand.length}`,
    act: difficulty => {
      const myTeam = getTeamOf(botId, turnOrder)
      const unplayed = turnOrder.filter(id => id !== botId).flatMap(id => hands[id] ?? [])
      const cardId = chooseTrickCard({
        hand,
        currentHand: state.currentHand ?? [],
        ledSuit: state.ledSuit,
        trumpSuit: state.trumpSuit,
        myId: botId,
        isTeammate: id => getTeamOf(id, turnOrder) === myTeam,
        playerCount: turnOrder.length,
        unplayed,
        difficulty
      })
      return { type: 'PLAY', payload: { cardId } }
    }
  }]
}
