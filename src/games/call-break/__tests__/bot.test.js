import { getBotTurns } from '../bot'
import { createDeck, shuffleDeck } from '../../../multiplayer/deck'
import { dealCards } from '../../../multiplayer/deal'
import { playOutTricks } from '../../../../tests/helpers/simulateTricks'

const ORDER = ['bot_a', 'bot_b', 'bot_c', 'bot_d']

describe('Call Break bots', () => {
  test('every bot bids 1-13 in the bidding phase', () => {
    const { hands } = dealCards(shuffleDeck(createDeck()), ORDER, 13)
    const turns = getBotTurns({ phase: 'bidding', turnOrder: ORDER, hands, roundNumber: 1 })
    expect(turns.map(t => t.botId)).toEqual(ORDER)
    for (const t of turns) {
      const { bid } = t.act('medium').payload
      expect(bid).toBeGreaterThanOrEqual(1)
      expect(bid).toBeLessThanOrEqual(13)
    }
  })

  test.each(['easy', 'medium', 'hard'])('%s bots play a full legal round', difficulty => {
    for (let i = 0; i < 10; i++) {
      const { hands } = dealCards(shuffleDeck(createDeck()), ORDER, 13)
      playOutTricks(getBotTurns, { phase: 'playing', turnOrder: ORDER, roundNumber: 1, currentIdx: 0, hands, currentHand: [], ledSuit: null }, difficulty, { trumpOf: () => 'spades' })
    }
  })
})
