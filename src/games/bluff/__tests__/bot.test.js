import { getBotTurns } from '../bot'
import { createDeck, shuffleDeck, parseCard, RANKS } from '../../../multiplayer/deck'
import { dealEven } from '../../../multiplayer/deal'

const ORDER = ['bot_a', 'bot_b', 'bot_c']

function base(hands, extra = {}) {
  return { phase: 'playing', turnOrder: ORDER, currentIdx: 1, round: 1, hands, pile: [], latestHandPlayerId: null, ...extra }
}

describe('Bluff bots', () => {
  test.each(['easy', 'medium', 'hard'])('%s bots open with cards they hold and a real rank', difficulty => {
    for (let i = 0; i < 50; i++) {
      const { hands } = dealEven(shuffleDeck(createDeck()), ORDER)
      const [turn] = getBotTurns(base(hands))
      const { type, payload } = turn.act(difficulty)
      expect(type).toBe('OPEN_ROUND')
      expect(RANKS).toContain(payload.claimedRank)
      expect(payload.cardIds.length).toBeGreaterThan(0)
      for (const c of payload.cardIds) expect(hands.bot_b).toContain(c)
      expect(new Set(payload.cardIds).size).toBe(payload.cardIds.length)
    }
  })

  test('always calls a claim that is impossible given its own hand', () => {
    const hands = { bot_a: ['2C'], bot_b: ['KS', 'KH', '3D'], bot_c: ['4C'] }
    const state = base(hands, { pile: ['5S', '6S', '7S'], claimedRank: 'K', latestHandPlayerId: 'bot_a', latestHandCardIds: ['5S', '6S', '7S'] })
    const [turn] = getBotTurns(state)
    expect(turn.act('easy').type).toBe('CHALLENGE')
  })

  test('the round owner burns or adds, never challenges itself', () => {
    const hands = { bot_a: ['2C'], bot_b: ['9S', '3D', '4D'], bot_c: ['4C'] }
    const state = base(hands, { pile: ['5S'], claimedRank: 'K', latestHandPlayerId: 'bot_b', latestHandCardIds: ['5S'] })
    for (let i = 0; i < 20; i++) expect(getBotTurns(state)[0].act('hard').type).toBe('PASS')
  })

  test('adds or bluffs only with cards it holds', () => {
    for (let i = 0; i < 100; i++) {
      const { hands } = dealEven(shuffleDeck(createDeck()), ORDER)
      const state = base(hands, { pile: ['5S'], claimedRank: 'Q', latestHandPlayerId: 'bot_a', latestHandCardIds: ['5S'] })
      const action = getBotTurns(state)[0].act('medium')
      expect(['ADD', 'PASS', 'CHALLENGE']).toContain(action.type)
      if (action.type === 'ADD') for (const c of action.payload.cardIds) expect(hands.bot_b).toContain(c)
    }
  })

  test('waits during a reveal', () => {
    expect(getBotTurns(base({}, { pendingReveal: { correct: true } }))).toEqual([])
  })

  test('never claims more of a rank than a two-deck game holds', () => {
    const { hands } = dealEven(shuffleDeck(createDeck({ deckCount: 2 })), ORDER)
    const action = getBotTurns(base(hands, { deckCount: 2 }))[0].act('hard')
    const counts = action.payload.cardIds.filter(c => parseCard(c).rank === action.payload.claimedRank).length
    expect(counts).toBeLessThanOrEqual(8)
  })
})
