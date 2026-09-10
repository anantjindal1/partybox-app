import {
  createEmptyBoard,
  isLegalPlay,
  getLegalPlays,
  applyPlayToBoard,
  computeStalemateWinners
} from '../sattiLogic'

describe('createEmptyBoard', () => {
  test('every suit starts with low/high null', () => {
    const board = createEmptyBoard()
    expect(board).toEqual({
      spades: { low: null, high: null },
      hearts: { low: null, high: null },
      diamonds: { low: null, high: null },
      clubs: { low: null, high: null }
    })
  })
})

describe('isLegalPlay / getLegalPlays — unopened suit', () => {
  test('only the 7 is legal when a suit has not been opened', () => {
    const board = createEmptyBoard()
    expect(isLegalPlay('7S', board)).toBe(true)
    expect(isLegalPlay('6S', board)).toBe(false)
    expect(isLegalPlay('8S', board)).toBe(false)
    expect(isLegalPlay('AS', board)).toBe(false)
    expect(isLegalPlay('KS', board)).toBe(false)
  })

  test('getLegalPlays filters a hand down to just the playable cards', () => {
    const board = createEmptyBoard()
    const hand = ['2S', '7S', '9H', '7H', 'KC']
    expect(getLegalPlays(hand, board)).toEqual(['7S', '7H'])
  })
})

describe('isLegalPlay / getLegalPlays — opened suit', () => {
  test('only high+1 and low-1 are legal once a suit is open', () => {
    let board = createEmptyBoard()
    board = applyPlayToBoard(board, '7S') // low: 6, high: 6

    expect(isLegalPlay('8S', board)).toBe(true) // high+1
    expect(isLegalPlay('6S', board)).toBe(true) // low-1
    expect(isLegalPlay('9S', board)).toBe(false) // not adjacent yet
    expect(isLegalPlay('5S', board)).toBe(false) // not adjacent yet
    expect(isLegalPlay('7S', board)).toBe(false) // already played
  })

  test('the run extends correctly after several plays', () => {
    let board = createEmptyBoard()
    board = applyPlayToBoard(board, '7D')
    board = applyPlayToBoard(board, '8D')
    board = applyPlayToBoard(board, '9D')
    board = applyPlayToBoard(board, '6D')

    expect(board.diamonds).toEqual({ low: 5, high: 8 }) // 6..9 open (6 is idx 5)
    expect(isLegalPlay('10D', board)).toBe(true)
    expect(isLegalPlay('5D', board)).toBe(true)
    expect(isLegalPlay('4D', board)).toBe(false)
    expect(isLegalPlay('JD', board)).toBe(false)
  })
})

describe('isLegalPlay — closed suit', () => {
  test('nothing is legal once a suit reaches Ace and King', () => {
    let board = createEmptyBoard()
    board = { ...board, clubs: { low: 0, high: 12 } } // A..K fully built
    for (const rank of ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']) {
      expect(isLegalPlay(`${rank}C`, board)).toBe(false)
    }
  })
})

describe('applyPlayToBoard', () => {
  test('playing a 7 opens the suit at low=high=7', () => {
    const board = applyPlayToBoard(createEmptyBoard(), '7H')
    expect(board.hearts).toEqual({ low: 6, high: 6 })
  })

  test('playing high+1 extends high only', () => {
    let board = applyPlayToBoard(createEmptyBoard(), '7H')
    board = applyPlayToBoard(board, '8H')
    expect(board.hearts).toEqual({ low: 6, high: 7 })
  })

  test('playing low-1 extends low only', () => {
    let board = applyPlayToBoard(createEmptyBoard(), '7H')
    board = applyPlayToBoard(board, '6H')
    expect(board.hearts).toEqual({ low: 5, high: 6 })
  })

  test('other suits are untouched by a play', () => {
    const board = applyPlayToBoard(createEmptyBoard(), '7H')
    expect(board.spades).toEqual({ low: null, high: null })
    expect(board.diamonds).toEqual({ low: null, high: null })
    expect(board.clubs).toEqual({ low: null, high: null })
  })
})

describe('computeStalemateWinners', () => {
  test('a single player with the fewest cards wins outright', () => {
    const hands = { a: ['1', '2'], b: ['1'], c: ['1', '2', '3'] }
    expect(computeStalemateWinners(hands, ['a', 'b', 'c'])).toEqual(['b'])
  })

  test('a genuine tie returns every player at the minimum', () => {
    const hands = { a: ['1'], b: ['1', '2'], c: ['1'] }
    expect(computeStalemateWinners(hands, ['a', 'b', 'c'])).toEqual(['a', 'c'])
  })

  test('all players tied returns everyone', () => {
    const hands = { a: ['1'], b: ['1'], c: ['1'] }
    expect(computeStalemateWinners(hands, ['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
  })
})
