import { getBotTurns } from '../bot'
import { createDeck, shuffleDeck } from '../../../multiplayer/deck'
import { dealCards } from '../../../multiplayer/deal'
import { playOutTricks } from '../../../../tests/helpers/simulateTricks'

const ORDER = ['bot_a', 'bot_b', 'bot_c', 'bot_d']

describe('Mendikot bots', () => {
  test.each(['easy', 'medium', 'hard'])('%s bots play a full legal game', difficulty => {
    for (let i = 0; i < 10; i++) {
      const { hands } = dealCards(shuffleDeck(createDeck()), ORDER, 13)
      const end = playOutTricks(getBotTurns, { phase: 'playing', turnOrder: ORDER, currentIdx: 0, hands, currentHand: [], ledSuit: null }, difficulty, { trumpOf: () => null })
      expect(Object.values(end.handsWon).reduce((a, b) => a + b)).toBe(13)
    }
  })
})
