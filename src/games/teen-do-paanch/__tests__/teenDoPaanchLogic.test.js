import {
  computeTargets,
  getCallerId,
  computeRoundScores,
  checkGameWinners,
  canRequestReveal,
  createReducedDeck
} from '../teenDoPaanchLogic'

const turnOrder = ['p0', 'p1', 'p2']

describe('computeTargets', () => {
  test('round 0 uses the first rotation', () => {
    expect(computeTargets(turnOrder, 0)).toEqual({ p0: 3, p1: 2, p2: 5 })
  })

  test('round 1 uses the second rotation', () => {
    expect(computeTargets(turnOrder, 1)).toEqual({ p0: 5, p1: 3, p2: 2 })
  })

  test('round 2 uses the third rotation', () => {
    expect(computeTargets(turnOrder, 2)).toEqual({ p0: 2, p1: 5, p2: 3 })
  })

  test('round 3 wraps back to the first rotation', () => {
    expect(computeTargets(turnOrder, 3)).toEqual({ p0: 3, p1: 2, p2: 5 })
  })

  test('round 5 continues the cycle correctly', () => {
    expect(computeTargets(turnOrder, 5)).toEqual({ p0: 2, p1: 5, p2: 3 })
  })

  test('every round assigns exactly one 3, one 2, and one 5', () => {
    for (let round = 0; round < 6; round++) {
      const targets = computeTargets(turnOrder, round)
      const values = Object.values(targets).sort()
      expect(values).toEqual([2, 3, 5])
    }
  })
})

describe('getCallerId', () => {
  test('resolves whichever player holds the 5 target', () => {
    expect(getCallerId({ p0: 3, p1: 2, p2: 5 })).toBe('p2')
    expect(getCallerId({ p0: 5, p1: 3, p2: 2 })).toBe('p0')
    expect(getCallerId({ p0: 2, p1: 5, p2: 3 })).toBe('p1')
  })
})

describe('computeRoundScores', () => {
  test('a positive surplus when a player beats their target', () => {
    const targets = { p0: 3, p1: 2, p2: 5 }
    const handsWon = { p0: 3, p1: 5, p2: 5 }
    expect(computeRoundScores(targets, handsWon)).toEqual({ p0: 0, p1: 3, p2: 0 })
  })

  test('a negative deficit when a player misses their target', () => {
    const targets = { p0: 3, p1: 2, p2: 5 }
    const handsWon = { p0: 1, p1: 2, p2: 3 }
    expect(computeRoundScores(targets, handsWon)).toEqual({ p0: -2, p1: 0, p2: -2 })
  })

  test('missing handsWon entries default to zero', () => {
    const targets = { p0: 3, p1: 2, p2: 5 }
    expect(computeRoundScores(targets, {})).toEqual({ p0: -3, p1: -2, p2: -5 })
  })
})

describe('checkGameWinners', () => {
  test('nobody at or above the target yet', () => {
    expect(checkGameWinners({ p0: 4, p1: 6, p2: -2 })).toBeNull()
  })

  test('a single player crosses the target', () => {
    expect(checkGameWinners({ p0: 11, p1: 4, p2: -2 })).toEqual(['p0'])
  })

  test('two players cross the target in the same round — genuine co-winners', () => {
    expect(checkGameWinners({ p0: 10, p1: 12, p2: 3 })).toEqual(['p0', 'p1'])
  })

  test('exactly at the target counts as reaching it', () => {
    expect(checkGameWinners({ p0: 10, p1: 5, p2: 0 })).toEqual(['p0'])
  })
})

describe('canRequestReveal', () => {
  test('false when leading the hand (ledSuit is null)', () => {
    expect(canRequestReveal(['AS', 'KH'], null)).toBe(false)
  })

  test('false when the hand can follow the led suit', () => {
    expect(canRequestReveal(['AS', 'KH'], 'spades')).toBe(false)
  })

  test('true when the hand cannot follow the led suit', () => {
    expect(canRequestReveal(['AS', 'KH'], 'diamonds')).toBe(true)
  })
})

describe('createReducedDeck', () => {
  test('produces exactly 30 unique cards', () => {
    const deck = createReducedDeck()
    expect(deck.length).toBe(30)
    expect(new Set(deck).size).toBe(30)
  })

  test('every suit has A,8,9,10,J,Q,K, and only spades/hearts also have a 7', () => {
    const deck = createReducedDeck()
    expect(deck).toContain('7S')
    expect(deck).toContain('7H')
    expect(deck).not.toContain('7D')
    expect(deck).not.toContain('7C')
    for (const suit of ['S', 'H', 'D', 'C']) {
      for (const rank of ['8', '9', '10', 'J', 'Q', 'K', 'A']) {
        expect(deck).toContain(`${rank}${suit}`)
      }
    }
  })

  test('no card ranked 2 through 6 is present', () => {
    const deck = createReducedDeck()
    for (const card of deck) {
      const rank = card.slice(0, -1)
      expect(['2', '3', '4', '5', '6']).not.toContain(rank)
    }
  })
})
