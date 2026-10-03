import { getBotTurns } from '../bot'
import { shuffleDeck } from '../../../multiplayer/deck'
import { dealCards } from '../../../multiplayer/deal'
import { buildDonkeyDeck, resolvePassRound, hasFourOfAKind } from '../donkeyLogic'

const ORDER = ['bot_a', 'bot_b', 'bot_c', 'bot_d']

describe('Donkey bots', () => {
  test.each(['easy', 'medium', 'hard'])('%s bots pass a card they hold until someone collects four of a kind', difficulty => {
    for (let game = 0; game < 20; game++) {
      let { hands } = dealCards(shuffleDeck(buildDonkeyDeck(ORDER.length)), ORDER, 4)
      let rounds = 0
      while (!ORDER.some(id => hasFourOfAKind(hands[id])) && rounds < 200) {
        const turns = getBotTurns({ phase: 'passing', turnOrder: ORDER, hands, roundNumber: 0, passRoundIndex: rounds })
        expect(turns.map(t => t.botId)).toEqual(ORDER)
        const chosen = Object.fromEntries(turns.map(t => [t.botId, t.act(difficulty).payload.cardId]))
        for (const id of ORDER) expect(hands[id]).toContain(chosen[id])
        hands = resolvePassRound(hands, ORDER, chosen)
        rounds++
      }
      if (difficulty !== 'easy') expect(rounds).toBeLessThan(200)
    }
  })

  test('only non-signalers react, faster on harder levels', () => {
    const turns = getBotTurns({ phase: 'reacting', turnOrder: ORDER, signaledPlayerIds: ['bot_a'], roundNumber: 0, reactDeadline: 1 })
    expect(turns.map(t => t.botId)).toEqual(['bot_b', 'bot_c', 'bot_d'])
    expect(turns[0].act().type).toBe('REACT')
    const avg = d => Array.from({ length: 200 }, () => turns[0].delay(d)).reduce((a, b) => a + b) / 200
    expect(avg('hard')).toBeLessThan(avg('medium'))
    expect(avg('medium')).toBeLessThan(avg('easy'))
  })
})
