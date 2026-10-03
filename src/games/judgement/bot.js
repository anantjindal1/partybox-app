import { chooseTrickCard, chooseTrumpSuit, estimateHandsWon } from '../../multiplayer/bots/trickStrategy'
import { rotate, getForbiddenBid } from './hillLogic'

function chooseBid(state, botId, actions, difficulty) {
  const handSize = state.handSizeSequence[state.roundIndex]
  const hand = state.hands[botId] ?? []
  // Trump isn't known yet — value the hand as if its longest suit were trump.
  let bid = Math.min(handSize, estimateHandsWon(hand, chooseTrumpSuit(hand, 'hard'), difficulty) - (handSize <= 3 ? 1 : 0))
  bid = Math.max(0, bid)
  const bidOrder = rotate(state.turnOrder, state.leaderIdx)
  if (bidOrder[bidOrder.length - 1] === botId) {
    const othersBids = Object.fromEntries(actions.filter(a => a.type === 'BID').map(a => [a.playerId, a.payload.bid]))
    if (getForbiddenBid(handSize, othersBids) === bid) bid = bid > 0 ? bid - 1 : bid + 1
  }
  return bid
}

export function getBotTurns(state, actions = []) {
  const { phase, turnOrder = [], hands = {}, roundIndex } = state

  if (phase === 'bidding') {
    const bidOrder = rotate(turnOrder, state.leaderIdx ?? 0)
    const lastBidder = bidOrder[bidOrder.length - 1]
    const othersDone = actions.filter(a => a.type === 'BID' && a.playerId !== lastBidder).length === turnOrder.length - 1
    return turnOrder
      .filter(id => id !== lastBidder || othersDone)
      .map(botId => ({
        botId,
        key: `bid:${roundIndex}`,
        act: difficulty => ({ type: 'BID', payload: { bid: chooseBid(state, botId, actions, difficulty) } })
      }))
  }

  if (phase === 'choosing_trump') {
    const botId = state.trumpChooserId
    return [{
      botId,
      key: `trump:${roundIndex}`,
      act: difficulty => ({ type: 'CHOOSE_TRUMP', payload: { suit: chooseTrumpSuit(hands[botId], difficulty) } })
    }]
  }

  if (phase !== 'playing' || state.handWinnerId) return []
  const botId = turnOrder[state.currentIdx]
  const hand = hands[botId] ?? []
  return [{
    botId,
    key: `play:${roundIndex}:${hand.length}`,
    act: difficulty => ({
      type: 'PLAY',
      payload: {
        cardId: chooseTrickCard({
          hand,
          currentHand: state.currentHand ?? [],
          ledSuit: state.ledSuit,
          trumpSuit: state.trumpSuit,
          myId: botId,
          playerCount: turnOrder.length,
          unplayed: turnOrder.filter(id => id !== botId).flatMap(id => hands[id] ?? []),
          avoidWinning: (state.handsWon?.[botId] ?? 0) >= (state.bids?.[botId] ?? 0),
          difficulty
        })
      }
    })
  }]
}
