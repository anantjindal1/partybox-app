import { createDeck } from '../../../multiplayer/deck'
import {
  determineInitialShuffler,
  computeBiddingOrder,
  isValidBid,
  checkTeriHandWinner,
  computeHandPoints,
  applyShufflerScore,
  checkMatchWinner
} from '../teriLogic'

const turnOrder = ['p0', 'p1', 'p2', 'p3']

describe('determineInitialShuffler', () => {
  test('finds whichever player receives the first Jack, round-robin', () => {
    // Build a deck where the first Jack is at index 5 -> player 5%4=1
    const deck = createDeck().filter(c => !c.startsWith('J'))
    deck.splice(5, 0, 'JS')
    expect(determineInitialShuffler(deck, turnOrder)).toBe('p1')
  })

  test('a Jack at index 0 makes the first player the shuffler', () => {
    const deck = createDeck().filter(c => !c.startsWith('J'))
    deck.unshift('JH')
    expect(determineInitialShuffler(deck, turnOrder)).toBe('p0')
  })

  test('a Jack at index 8 wraps back to the first player (8 % 4 = 0)', () => {
    const deck = createDeck().filter(c => !c.startsWith('J'))
    deck.splice(8, 0, 'JD')
    expect(determineInitialShuffler(deck, turnOrder)).toBe('p0')
  })
})

describe('computeBiddingOrder', () => {
  test('starts at the shuffler\'s neighbor and cycles 8 entries', () => {
    const order = computeBiddingOrder(turnOrder, 'p0')
    expect(order).toEqual(['p1', 'p2', 'p3', 'p0', 'p1', 'p2', 'p3', 'p0'])
  })

  test('works starting from any seat', () => {
    const order = computeBiddingOrder(turnOrder, 'p2')
    expect(order).toEqual(['p3', 'p0', 'p1', 'p2', 'p3', 'p0', 'p1', 'p2'])
  })

  test('every player appears exactly twice', () => {
    const order = computeBiddingOrder(turnOrder, 'p1')
    for (const p of turnOrder) {
      expect(order.filter(id => id === p).length).toBe(2)
    }
  })
})

describe('isValidBid', () => {
  test('rejects below 7', () => {
    expect(isValidBid(6, null)).toBe(false)
  })

  test('rejects above 13', () => {
    expect(isValidBid(14, null)).toBe(false)
  })

  test('accepts 7-13 as a first bid', () => {
    expect(isValidBid(7, null)).toBe(true)
    expect(isValidBid(13, null)).toBe(true)
  })

  test('must exceed the current high bid', () => {
    expect(isValidBid(8, { number: 8, suit: 'spades', playerId: 'p0' })).toBe(false)
    expect(isValidBid(9, { number: 8, suit: 'spades', playerId: 'p0' })).toBe(true)
  })
})

describe('checkTeriHandWinner', () => {
  test('normal GameLead win: bid met, defender already on the board', () => {
    expect(checkTeriHandWinner(8, 3, 8)).toEqual({ winner: 'gameLead', isTeri: false })
  })

  test('normal defender win: defender reaches 14-bid, gameLead already on the board', () => {
    expect(checkTeriHandWinner(1, 6, 8)).toEqual({ winner: 'defender', isTeri: false })
  })

  test('GameLead sweep is a Teri win', () => {
    expect(checkTeriHandWinner(13, 0, 8)).toEqual({ winner: 'gameLead', isTeri: true })
  })

  test('defender sweep is a Teri win for the defender (symmetric extension)', () => {
    expect(checkTeriHandWinner(0, 13, 8)).toEqual({ winner: 'defender', isTeri: true })
  })

  test('still extending: gameLead reached bid but defender still at zero -> no winner yet', () => {
    expect(checkTeriHandWinner(8, 0, 8)).toBeNull()
  })

  test('still extending: defender reached target but gameLead still at zero -> no winner yet', () => {
    expect(checkTeriHandWinner(0, 6, 8)).toBeNull()
  })

  test('below both thresholds -> no winner yet', () => {
    expect(checkTeriHandWinner(3, 2, 8)).toBeNull()
  })
})

describe('computeHandPoints', () => {
  test('normal win (bid < 13, no sweep) scores the bid amount', () => {
    expect(computeHandPoints(8, 'gameLead', false)).toBe(8)
  })

  test('normal loss (bid < 13) scores -2x the bid', () => {
    expect(computeHandPoints(8, 'defender', false)).toBe(-16)
  })

  test('undeclared sweep (bid < 13, won all 13 anyway) scores a flat 26', () => {
    expect(computeHandPoints(8, 'gameLead', true)).toBe(26)
  })

  test('declared 13 and won scores 39', () => {
    expect(computeHandPoints(13, 'gameLead', true)).toBe(39)
  })

  test('declared 13 and lost scores -39', () => {
    expect(computeHandPoints(13, 'defender', false)).toBe(-39)
  })
})

describe('applyShufflerScore', () => {
  const base = {
    currentScore: 5,
    shufflerId: 'p0',
    shufflerPartnerId: 'p2',
    nextCounterClockwiseId: 'p1'
  }

  test('same shuffler continues when the result stays within [0, 52]', () => {
    const result = applyShufflerScore({ ...base, currentScore: 20, handPointsForGameLead: 8, isShufflerOnGameLeadTeam: true })
    expect(result).toEqual({ shufflerId: 'p0', score: 12, burstPlayerId: null })
  })

  test('shuffler on GameLead team, GameLead wins -> score decreases (the worked example: 5-8=-3, rotates and flips to 3)', () => {
    const result = applyShufflerScore({ ...base, handPointsForGameLead: 8, isShufflerOnGameLeadTeam: true })
    expect(result).toEqual({ shufflerId: 'p1', score: 3, burstPlayerId: null })
  })

  test('shuffler on the DEFENDING team mirrors the sign: GameLead losing -16 becomes +16 for the shuffler', () => {
    const result = applyShufflerScore({ ...base, currentScore: 5, handPointsForGameLead: -16, isShufflerOnGameLeadTeam: false })
    // delta = -(-16) = 16; raw = 5 - 16 = -11 -> rotates, flips to 11
    expect(result).toEqual({ shufflerId: 'p1', score: 11, burstPlayerId: null })
  })

  test('crossing above 52 hands the role to the shuffler\'s own partner, reset to 0, and records the burst', () => {
    const result = applyShufflerScore({ ...base, currentScore: 50, handPointsForGameLead: -5, isShufflerOnGameLeadTeam: true })
    // delta = -5 (gameLead lost); raw = 50 - (-5) = 55 > 52
    expect(result).toEqual({ shufflerId: 'p2', score: 0, burstPlayerId: 'p0' })
  })

  test('exactly 52 does not burst', () => {
    const result = applyShufflerScore({ ...base, currentScore: 60, handPointsForGameLead: 8, isShufflerOnGameLeadTeam: true })
    expect(result).toEqual({ shufflerId: 'p0', score: 52, burstPlayerId: null })
  })

  test('exactly 0 does not rotate', () => {
    const result = applyShufflerScore({ ...base, currentScore: 8, handPointsForGameLead: 8, isShufflerOnGameLeadTeam: true })
    expect(result).toEqual({ shufflerId: 'p0', score: 0, burstPlayerId: null })
  })
})

describe('checkMatchWinner', () => {
  test('no bursts yet -> no winner', () => {
    expect(checkMatchWinner([], turnOrder)).toBeNull()
  })

  test('only one member of a team burst -> no winner yet', () => {
    expect(checkMatchWinner(['p0'], turnOrder)).toBeNull()
  })

  test('both members of team A (p0, p2) burst -> team B wins', () => {
    expect(checkMatchWinner(['p0', 'p2'], turnOrder)).toBe('teamB')
  })

  test('both members of team B (p1, p3) burst -> team A wins', () => {
    expect(checkMatchWinner(['p1', 'p3'], turnOrder)).toBe('teamA')
  })
})
