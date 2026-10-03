import { getBotTurns } from '../bot'
import { createDeck, shuffleDeck } from '../../../multiplayer/deck'
import { dealCards } from '../../../multiplayer/deal'
import { computeBiddingOrder } from '../teriLogic'
import { playOutTricks } from '../../../../tests/helpers/simulateTricks'

const ORDER = ['bot_a', 'bot_b', 'bot_c', 'bot_d']
const PARTNER = { bot_a: 'bot_c', bot_c: 'bot_a', bot_b: 'bot_d', bot_d: 'bot_b' }

function runAuction(hands, difficulty) {
  let state = { phase: 'bidding', turnOrder: ORDER, hands, roundNumber: 0, biddingOrder: computeBiddingOrder(ORDER, 'bot_d'), bidTurnIndex: 0, currentHighBid: null }
  for (let i = 0; i < 8; i++) {
    const [turn] = getBotTurns(state)
    expect(turn.botId).toBe(state.biddingOrder[i])
    const action = turn.act(difficulty)
    if (i === 0) expect(action.type).toBe('BID')
    if (action.type === 'BID') {
      expect(action.payload.number).toBeGreaterThan(state.currentHighBid?.number ?? 6)
      expect(action.payload.number).toBeLessThanOrEqual(13)
      state = { ...state, currentHighBid: { ...action.payload, playerId: turn.botId } }
    }
    state = { ...state, bidTurnIndex: i + 1 }
  }
  return state.currentHighBid
}

describe('Teri bots', () => {
  test.each(['easy', 'medium', 'hard'])('%s bots bid and play a full legal round, GameLead playing the dummy', difficulty => {
    for (let i = 0; i < 10; i++) {
      const { hands } = dealCards(shuffleDeck(createDeck()), ORDER, 13)
      const high = runAuction(hands, difficulty)
      const gameLeadId = high.playerId
      playOutTricks(getBotTurns, {
        phase: 'playing', turnOrder: ORDER, roundNumber: 0, hands, currentHand: [], ledSuit: null,
        gameLeadId, trumpSuit: high.suit, bid: high.number, currentIdx: ORDER.indexOf(gameLeadId)
      }, difficulty, { actorOf: (s, seatId) => (seatId === PARTNER[s.gameLeadId] ? s.gameLeadId : seatId) })
    }
  })
})
