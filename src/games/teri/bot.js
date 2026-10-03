import { chooseTrickCard, chooseTrumpSuit, estimateHandsWon } from '../../multiplayer/bots/trickStrategy'
import { getTeamA, getTeamB, getTeamOf } from './teriLogic'

// A partner's hand is worth about 3 hands on average.
const PARTNER_SHARE = 3

function partnerOf(playerId, turnOrder) {
  const team = getTeamA(turnOrder).includes(playerId) ? getTeamA(turnOrder) : getTeamB(turnOrder)
  return team.find(id => id !== playerId)
}

function chooseBid(state, botId, difficulty) {
  const hand = state.hands[botId] ?? []
  const suit = chooseTrumpSuit(hand, difficulty)
  const number = state.currentHighBid ? state.currentHighBid.number + 1 : 7
  if (state.bidTurnIndex === 0) return { type: 'BID', payload: { number: 7, suit } }
  const teamEstimate = estimateHandsWon(hand, suit, difficulty) + PARTNER_SHARE
  if (number <= 13 && teamEstimate >= number) return { type: 'BID', payload: { number, suit } }
  return { type: 'PASS', payload: {} }
}

export function getBotTurns(state) {
  const { phase, turnOrder = [], hands = {}, roundNumber } = state

  if (phase === 'bidding') {
    const botId = state.biddingOrder?.[state.bidTurnIndex]
    if (!botId) return []
    return [{ botId, key: `bid:${roundNumber}:${state.bidTurnIndex}`, act: difficulty => chooseBid(state, botId, difficulty) }]
  }

  if (phase !== 'playing' || state.handWinnerId) return []
  const seatId = turnOrder[state.currentIdx]
  // GameLead plays their dummy partner's cards.
  const botId = seatId === partnerOf(state.gameLeadId, turnOrder) ? state.gameLeadId : seatId
  const hand = hands[seatId] ?? []
  return [{
    botId,
    key: `play:${roundNumber}:${seatId}:${hand.length}`,
    act: difficulty => {
      const myTeam = getTeamOf(seatId, turnOrder)
      const cardId = chooseTrickCard({
        hand,
        currentHand: state.currentHand ?? [],
        ledSuit: state.ledSuit,
        trumpSuit: state.trumpSuit,
        myId: seatId,
        isTeammate: id => getTeamOf(id, turnOrder) === myTeam,
        playerCount: turnOrder.length,
        unplayed: turnOrder.filter(id => id !== seatId).flatMap(id => hands[id] ?? []),
        difficulty
      })
      return { type: 'PLAY', payload: { cardId } }
    }
  }]
}
