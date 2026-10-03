import { getBotTurns } from '../bot'
import { createDeck, shuffleDeck } from '../../../multiplayer/deck'
import { dealCards } from '../../../multiplayer/deal'
import { getForbiddenBid } from '../hillLogic'
import { playOutTricks } from '../../../../tests/helpers/simulateTricks'

const ORDER = ['bot_a', 'bot_b', 'bot_c', 'bot_d']

function biddingState(handSize) {
  const { hands } = dealCards(shuffleDeck(createDeck()), ORDER, handSize)
  return { phase: 'bidding', turnOrder: ORDER, hands, roundIndex: 0, leaderIdx: 0, handSizeSequence: [handSize] }
}

describe('Judgement bots', () => {
  test('the last bidder waits for everyone else, then avoids the forbidden bid', () => {
    for (let i = 0; i < 50; i++) {
      const handSize = 1 + (i % 13)
      const state = biddingState(handSize)
      const early = getBotTurns(state, [])
      expect(early.map(t => t.botId)).toEqual(ORDER.slice(0, 3))
      const actions = early.map(t => ({ playerId: t.botId, ...t.act('medium') }))
      const [last] = getBotTurns(state, actions).filter(t => t.botId === 'bot_d')
      const { bid } = last.act('medium').payload
      const others = Object.fromEntries(actions.map(a => [a.playerId, a.payload.bid]))
      expect(bid).not.toBe(getForbiddenBid(handSize, others))
      expect(bid).toBeGreaterThanOrEqual(0)
      expect(bid).toBeLessThanOrEqual(handSize)
    }
  })

  test.each(['easy', 'medium', 'hard'])('%s bots choose trump and play a full legal round', difficulty => {
    for (let i = 0; i < 10; i++) {
      const { hands } = dealCards(shuffleDeck(createDeck()), ORDER, 13)
      const [trump] = getBotTurns({ phase: 'choosing_trump', trumpChooserId: 'bot_b', hands, roundIndex: 0 })
      const { suit } = trump.act(difficulty).payload
      playOutTricks(getBotTurns, {
        phase: 'playing', turnOrder: ORDER, roundIndex: 0, currentIdx: 1, hands, currentHand: [], ledSuit: null,
        trumpSuit: suit, bids: { bot_a: 3, bot_b: 4, bot_c: 0, bot_d: 2 }
      }, difficulty)
    }
  })

  test('a bot that has made its bid ducks under the winning card', () => {
    const [turn] = getBotTurns({
      phase: 'playing', turnOrder: ORDER, roundIndex: 0, currentIdx: 1, trumpSuit: 'clubs',
      hands: { bot_b: ['AH', '5H', '9H'] }, currentHand: [{ playerId: 'bot_a', card: '10H' }], ledSuit: 'hearts',
      bids: { bot_b: 0 }, handsWon: { bot_b: 0 }
    })
    expect(turn.act('hard').payload.cardId).toBe('9H')
  })
})
