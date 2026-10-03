import { getBotTurns } from '../bot'
import { createDeck, shuffleDeck } from '../../../multiplayer/deck'
import { dealAll } from '../../../multiplayer/deal'
import { removeCardFromHand } from '../../../multiplayer/hand'
import { createEmptyBoard, getLegalPlays, applyPlayToBoard } from '../sattiLogic'

const ORDER = ['bot_a', 'bot_b', 'bot_c', 'bot_d']

describe('Satti bots', () => {
  test.each(['easy', 'medium', 'hard'])('%s bots play legal cards, pass only when stuck, and finish', difficulty => {
    for (let game = 0; game < 20; game++) {
      const { hands: dealt } = dealAll(shuffleDeck(createDeck()), ORDER)
      let s = { phase: 'playing', turnOrder: ORDER, currentIdx: 0, hands: dealt, board: createEmptyBoard(), consecutivePasses: 0 }
      const lastKey = {}
      let done = false
      for (let n = 0; n < 500 && !done; n++) {
        const [turn] = getBotTurns(s)
        const id = turn.botId
        expect(id).toBe(ORDER[s.currentIdx])
        expect(lastKey[id]).not.toBe(turn.key)
        lastKey[id] = turn.key
        const action = turn.act(difficulty)
        const legal = getLegalPlays(s.hands[id], s.board)
        if (action.type === 'PASS') {
          expect(legal).toEqual([])
          const passes = s.consecutivePasses + 1
          done = passes === ORDER.length
          s = { ...s, consecutivePasses: passes, currentIdx: (s.currentIdx + 1) % 4 }
        } else {
          expect(legal).toContain(action.payload.cardId)
          const hand = removeCardFromHand(s.hands[id], action.payload.cardId)
          done = hand.length === 0
          s = { ...s, hands: { ...s.hands, [id]: hand }, board: applyPlayToBoard(s.board, action.payload.cardId), consecutivePasses: 0, currentIdx: (s.currentIdx + 1) % 4 }
        }
      }
      expect(done).toBe(true)
    }
  })
})
