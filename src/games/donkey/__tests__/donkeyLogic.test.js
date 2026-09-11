import {
  buildDonkeyDeck,
  hasFourOfAKind,
  resolvePassRound,
  nextLetters,
  isEliminated,
  resolveDonkeyRound
} from '../donkeyLogic'

describe('buildDonkeyDeck', () => {
  test('4 players -> 16 unique cards, 4 of each of the first 4 ranks', () => {
    const deck = buildDonkeyDeck(4)
    expect(deck.length).toBe(16)
    expect(new Set(deck).size).toBe(16)
    expect(deck.filter(id => id.startsWith('A')).length).toBe(4)
  })

  test('8 players -> 32 unique cards', () => {
    const deck = buildDonkeyDeck(8)
    expect(deck.length).toBe(32)
    expect(new Set(deck).size).toBe(32)
  })

  test('3 players -> 12 unique cards', () => {
    const deck = buildDonkeyDeck(3)
    expect(deck.length).toBe(12)
    expect(new Set(deck).size).toBe(12)
  })
})

describe('hasFourOfAKind', () => {
  test('true when all 4 cards share a rank', () => {
    expect(hasFourOfAKind(['AS', 'AH', 'AD', 'AC'])).toBe(true)
  })

  test('false when ranks differ', () => {
    expect(hasFourOfAKind(['AS', 'AH', 'AD', 'KC'])).toBe(false)
  })

  test('false when hand length is not exactly 4', () => {
    expect(hasFourOfAKind(['AS', 'AH', 'AD'])).toBe(false)
    expect(hasFourOfAKind(['AS', 'AH', 'AD', 'AC', 'AS'])).toBe(false)
  })
})

describe('resolvePassRound', () => {
  test('every hand still has exactly 4 cards, passed cards land with the correct neighbor', () => {
    const turnOrder = ['p0', 'p1', 'p2', 'p3']
    const hands = {
      p0: ['AS', 'AH', 'KS', 'KH'],
      p1: ['AD', 'AC', 'QS', 'QH'],
      p2: ['KD', 'KC', 'JS', 'JH'],
      p3: ['QD', 'QC', '10S', '10H']
    }
    const chosenCards = { p0: 'AS', p1: 'AD', p2: 'KD', p3: 'QD' }
    const newHands = resolvePassRound(hands, turnOrder, chosenCards)

    for (const id of turnOrder) {
      expect(newHands[id].length).toBe(4)
    }
    // p1 passes to p0 (p1 is "previous" of p0 going backward)... verify via
    // the actual neighbor relationship this function defines: turnOrder[i]
    // receives from turnOrder[i-1].
    expect(newHands.p1).toContain('AS') // p0's passed card goes to p1
    expect(newHands.p2).toContain('AD') // p1's passed card goes to p2
    expect(newHands.p3).toContain('KD') // p2's passed card goes to p3
    expect(newHands.p0).toContain('QD') // p3's passed card wraps to p0
  })

  test('the passed card is removed from the passer\'s own hand', () => {
    const turnOrder = ['p0', 'p1']
    const hands = { p0: ['AS', 'AH', 'AD', 'AC'], p1: ['KS', 'KH', 'KD', 'KC'] }
    const chosenCards = { p0: 'AS', p1: 'KS' }
    const newHands = resolvePassRound(hands, turnOrder, chosenCards)
    expect(newHands.p0).not.toContain('AS')
    expect(newHands.p1).not.toContain('KS')
  })

  test('no cards are duplicated or lost across the whole round', () => {
    const turnOrder = ['p0', 'p1', 'p2']
    const hands = {
      p0: ['AS', 'AH', 'AD', 'AC'],
      p1: ['KS', 'KH', 'KD', 'KC'],
      p2: ['QS', 'QH', 'QD', 'QC']
    }
    const chosenCards = { p0: 'AS', p1: 'KS', p2: 'QS' }
    const newHands = resolvePassRound(hands, turnOrder, chosenCards)
    const allBefore = Object.values(hands).flat()
    const allAfter = Object.values(newHands).flat()
    expect(allAfter.length).toBe(allBefore.length)
    expect(new Set(allAfter)).toEqual(new Set(allBefore))
  })
})

describe('nextLetters / isEliminated', () => {
  test('progresses one letter at a time through the full word', () => {
    let letters = ''
    const expected = ['D', 'DO', 'DON', 'DONK', 'DONKE', 'DONKEY']
    for (const exp of expected) {
      letters = nextLetters(letters)
      expect(letters).toBe(exp)
    }
  })

  test('isEliminated only true once the full word is reached', () => {
    expect(isEliminated('DONK')).toBe(false)
    expect(isEliminated('DONKEY')).toBe(true)
  })

  test('nextLetters treats undefined/null as empty', () => {
    expect(nextLetters(undefined)).toBe('D')
    expect(nextLetters(null)).toBe('D')
  })
})

describe('resolveDonkeyRound', () => {
  test('the last valid reactor by timestamp is the donkey', () => {
    const actions = [
      { playerId: 'p1', createdAt: { seconds: 100 } },
      { playerId: 'p2', createdAt: { seconds: 102 } },
      { playerId: 'p3', createdAt: { seconds: 101 } }
    ]
    expect(resolveDonkeyRound(actions, ['p1', 'p2', 'p3'])).toBe('p2')
  })

  test('a player who never reacted is the donkey over anyone who reacted late', () => {
    const actions = [
      { playerId: 'p1', createdAt: { seconds: 100 } },
      { playerId: 'p2', createdAt: { seconds: 999 } } // reacted very late, but DID react
    ]
    // p3 never reacted at all -> still the donkey, not p2
    expect(resolveDonkeyRound(actions, ['p1', 'p2', 'p3'])).toBe('p3')
  })

  test('multiple never-reactors are tie-broken by seat order (expectedReactorIds order)', () => {
    const actions = [{ playerId: 'p1', createdAt: { seconds: 100 } }]
    expect(resolveDonkeyRound(actions, ['p1', 'p2', 'p3'])).toBe('p2')
  })

  test('ignores actions from players not in expectedReactorIds (e.g. a signaled player)', () => {
    const actions = [
      { playerId: 'p1', createdAt: { seconds: 100 } },
      { playerId: 'signaled-player', createdAt: { seconds: 50 } }
    ]
    expect(resolveDonkeyRound(actions, ['p1'])).toBe('p1')
  })
})
