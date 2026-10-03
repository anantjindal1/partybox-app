import { getBotTurns } from '../bot'
import { shuffleDeck } from '../../../multiplayer/deck'
import { dealCards } from '../../../multiplayer/deal'
import { createReducedDeck } from '../teenDoPaanchLogic'
import { playOutTricks } from '../../../../tests/helpers/simulateTricks'

const ORDER = ['bot_a', 'bot_b', 'bot_c']

describe('Teen Do Paanch bots', () => {
  test.each(['easy', 'medium', 'hard'])('%s bots call trump and play a full legal round', difficulty => {
    for (let i = 0; i < 10; i++) {
      const { hands } = dealCards(shuffleDeck(createReducedDeck()), ORDER, 10)
      const [call] = getBotTurns({ phase: 'calling_trump', callerId: 'bot_c', hands, roundNumber: 0 })
      const { suit, mode } = call.act(difficulty).payload
      expect(mode).toBe('declared')
      playOutTricks(getBotTurns, {
        phase: 'playing', turnOrder: ORDER, roundNumber: 0, currentIdx: 2, hands, currentHand: [], ledSuit: null,
        trumpSuit: suit, trumpMode: mode, trumpRevealed: true
      }, difficulty)
    }
  })

  test('asks for a hidden trump to be revealed when void in the led suit', () => {
    const [turn] = getBotTurns({
      phase: 'playing', turnOrder: ORDER, roundNumber: 0, currentIdx: 1, trumpSuit: 'spades', trumpMode: 'hidden', trumpRevealed: false,
      hands: { bot_b: ['AS', 'KD'] }, currentHand: [{ playerId: 'bot_a', card: 'AH' }], ledSuit: 'hearts'
    })
    expect(turn.act('medium').type).toBe('REVEAL_TRUMP')
    const [after] = getBotTurns({
      phase: 'playing', turnOrder: ORDER, roundNumber: 0, currentIdx: 1, trumpSuit: 'spades', trumpMode: 'hidden', trumpRevealed: true,
      hands: { bot_b: ['AS', 'KD'] }, currentHand: [{ playerId: 'bot_a', card: 'AH' }], ledSuit: 'hearts'
    })
    expect(after.key).not.toBe(turn.key)
    expect(after.act('medium').payload.cardId).toBe('AS')
  })
})
