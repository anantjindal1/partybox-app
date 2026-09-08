import { checkPattern, calledPositions, isClaimValid, PRIZES } from '../prizes'
import { cellIndex } from '../ticket'

// Hand-built ticket (flat, row-major), 15 numbers, valid column ranges/order:
// row0: 1, 12, _, 34, _, _, 62, _, 89
// row1: 4, _, 25, _, 41, 55, _, 78, _
// row2: 8, 19, _, _, 49, _, 69, _, 90
function buildTicket() {
  const cells = new Array(27).fill(null)
  const set = (r, c, v) => { cells[cellIndex(r, c)] = v }
  set(0, 0, 1); set(0, 1, 12); set(0, 3, 34); set(0, 6, 62); set(0, 8, 89)
  set(1, 0, 4); set(1, 2, 25); set(1, 4, 41); set(1, 5, 55); set(1, 7, 78)
  set(2, 0, 8); set(2, 1, 19); set(2, 4, 49); set(2, 6, 69); set(2, 8, 90)
  return { cells }
}

const ticket = buildTicket()

function markAll(positions) {
  return new Set(positions)
}

describe('PRIZES', () => {
  test('lists the classic six', () => {
    expect(PRIZES).toEqual(['earlyFive', 'topLine', 'middleLine', 'bottomLine', 'corners', 'fullHouse'])
  })
})

describe('checkPattern', () => {
  test('earlyFive is false with fewer than 5 marked', () => {
    const marked = markAll(['0-0', '0-1', '0-3'])
    expect(checkPattern('earlyFive', ticket, marked)).toBe(false)
  })

  test('earlyFive is true with 5+ marked anywhere', () => {
    const marked = markAll(['0-0', '0-1', '0-3', '0-6', '0-8'])
    expect(checkPattern('earlyFive', ticket, marked)).toBe(true)
  })

  test('topLine requires every filled cell in row 0', () => {
    const partial = markAll(['0-0', '0-1', '0-3', '0-6'])
    expect(checkPattern('topLine', ticket, partial)).toBe(false)
    const full = markAll(['0-0', '0-1', '0-3', '0-6', '0-8'])
    expect(checkPattern('topLine', ticket, full)).toBe(true)
  })

  test('middleLine requires every filled cell in row 1', () => {
    const full = markAll(['1-0', '1-2', '1-4', '1-5', '1-7'])
    expect(checkPattern('middleLine', ticket, full)).toBe(true)
    expect(checkPattern('middleLine', ticket, markAll(['1-0']))).toBe(false)
  })

  test('bottomLine requires every filled cell in row 2', () => {
    const full = markAll(['2-0', '2-1', '2-4', '2-6', '2-8'])
    expect(checkPattern('bottomLine', ticket, full)).toBe(true)
    expect(checkPattern('bottomLine', ticket, markAll(['2-0', '2-1']))).toBe(false)
  })

  test('corners requires the leftmost/rightmost filled cell of row 0 and row 2', () => {
    // row0 filled: col0, col1, col3, col6, col8 -> corners col0, col8
    // row2 filled: col0, col1, col4, col6, col8 -> corners col0, col8
    const full = markAll(['0-0', '0-8', '2-0', '2-8'])
    expect(checkPattern('corners', ticket, full)).toBe(true)
    expect(checkPattern('corners', ticket, markAll(['0-0', '0-8', '2-0']))).toBe(false)
  })

  test('fullHouse requires all 15 filled cells marked', () => {
    const allFilled = new Set()
    ticket.cells.forEach((cell, i) => {
      if (cell !== null) allFilled.add(`${Math.floor(i / 9)}-${i % 9}`)
    })
    expect(checkPattern('fullHouse', ticket, allFilled)).toBe(true)
    allFilled.delete('2-8')
    expect(checkPattern('fullHouse', ticket, allFilled)).toBe(false)
  })

  test('returns false for an unknown prize id', () => {
    expect(checkPattern('notAPrize', ticket, new Set())).toBe(false)
  })

  test('returns false for every prize with an empty marked set', () => {
    for (const prize of PRIZES) {
      expect(checkPattern(prize, ticket, new Set())).toBe(false)
    }
  })
})

describe('calledPositions', () => {
  test('returns only positions whose ticket number was actually called', () => {
    const called = calledPositions(ticket, [1, 12, 999])
    expect(called).toEqual(new Set(['0-0', '0-1']))
  })

  test('empty when nothing has been called', () => {
    expect(calledPositions(ticket, [])).toEqual(new Set())
  })
})

describe('isClaimValid', () => {
  test('true when every required number for the prize has been called, regardless of what the player marked', () => {
    // topLine needs 1, 12, 34, 62, 89 all called
    expect(isClaimValid('topLine', ticket, [1, 12, 34, 62, 89])).toBe(true)
  })

  test('false when the prize is not actually complete yet', () => {
    expect(isClaimValid('topLine', ticket, [1, 12, 34])).toBe(false)
  })

  test('a dishonest claim with nothing called is invalid', () => {
    for (const prize of PRIZES) {
      expect(isClaimValid(prize, ticket, [])).toBe(false)
    }
  })

  test('fullHouse valid only once every one of the 15 numbers is called', () => {
    const allNumbers = ticket.cells.filter(c => c !== null)
    expect(isClaimValid('fullHouse', ticket, allNumbers.slice(0, 14))).toBe(false)
    expect(isClaimValid('fullHouse', ticket, allNumbers)).toBe(true)
  })
})
