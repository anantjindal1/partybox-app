import { chooseTrickCard, chooseTrumpSuit } from '../trickStrategy'
import { isBotId, makeBot } from '../bots'

const never = () => 0.99
const base = { myId: 'me', playerCount: 4, rng: never, difficulty: 'medium' }

describe('chooseTrickCard', () => {
  test('always follows suit', () => {
    const card = chooseTrickCard({
      ...base,
      hand: ['2H', 'AS', 'KD'],
      currentHand: [{ playerId: 'o1', card: '9H' }],
      ledSuit: 'hearts',
      trumpSuit: 'spades'
    })
    expect(card).toBe('2H')
  })

  test('dumps lowest non-trump when partner is winning', () => {
    const card = chooseTrickCard({
      ...base,
      hand: ['3S', '4C', 'KC'],
      currentHand: [{ playerId: 'p', card: 'AH' }, { playerId: 'o1', card: '5H' }],
      ledSuit: 'hearts',
      trumpSuit: 'spades',
      isTeammate: id => id === 'p'
    })
    expect(card).toBe('4C')
  })

  test('trumps with the lowest winning trump when void and opponent winning', () => {
    const card = chooseTrickCard({
      ...base,
      hand: ['3S', 'QS', '4C'],
      currentHand: [{ playerId: 'o1', card: 'AH' }],
      ledSuit: 'hearts',
      trumpSuit: 'spades'
    })
    expect(card).toBe('3S')
  })

  test('wins as cheaply as possible when last to play', () => {
    const card = chooseTrickCard({
      ...base,
      hand: ['10H', 'KH', 'AH'],
      currentHand: [{ playerId: 'o1', card: '9H' }, { playerId: 'p', card: '2H' }, { playerId: 'o2', card: 'JH' }],
      ledSuit: 'hearts',
      trumpSuit: 'spades',
      isTeammate: id => id === 'p'
    })
    expect(card).toBe('KH')
  })

  test('plays low when it cannot win', () => {
    const card = chooseTrickCard({
      ...base,
      hand: ['2H', '9H'],
      currentHand: [{ playerId: 'o1', card: 'AH' }],
      ledSuit: 'hearts',
      trumpSuit: 'spades'
    })
    expect(card).toBe('2H')
  })

  test('hard leads a card nobody can beat in its suit', () => {
    const card = chooseTrickCard({
      ...base,
      difficulty: 'hard',
      hand: ['KH', '3D', '4D'],
      currentHand: [],
      ledSuit: null,
      trumpSuit: 'spades',
      unplayed: ['QH', '5D', 'AD', '2S']
    })
    expect(card).toBe('KH')
  })

  test('easy picks among legal cards only', () => {
    for (let i = 0; i < 20; i++) {
      const card = chooseTrickCard({
        ...base,
        difficulty: 'easy',
        rng: Math.random,
        hand: ['2H', '9H', 'AS'],
        currentHand: [{ playerId: 'o1', card: 'KH' }],
        ledSuit: 'hearts',
        trumpSuit: 'spades'
      })
      expect(['2H', '9H']).toContain(card)
    }
  })
})

describe('chooseTrumpSuit', () => {
  test('picks the longest suit', () => {
    expect(chooseTrumpSuit(['2H', '5H', '7H', 'AS', 'KD'], 'hard')).toBe('hearts')
  })
})

describe('bots', () => {
  test('makeBot gives a bot id and a name not already taken', () => {
    const bot = makeBot([{ name: 'Ravi' }])
    expect(isBotId(bot.id)).toBe(true)
    expect(bot.name).not.toBe('Ravi')
    expect(bot.isBot).toBe(true)
  })
})
