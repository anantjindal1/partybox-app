import { generateTicket, isValidTicket, ticketsAreIdentical, generateUniqueTicket, getCell, cellIndex, COLUMN_RANGES, ROWS, COLS } from '../ticket'

function seededRng(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function rowOf(ticket, row) {
  return Array.from({ length: COLS }, (_, c) => getCell(ticket, row, c))
}

describe('generateTicket', () => {
  test('returns a flat 27-cell array, not nested arrays (Firestore cannot store array-of-arrays)', () => {
    const ticket = generateTicket(seededRng(1))
    expect(Array.isArray(ticket.cells)).toBe(true)
    expect(ticket.cells.length).toBe(ROWS * COLS)
    expect(ticket.cells.some(c => Array.isArray(c))).toBe(false)
  })

  test('produces a structurally valid ticket across many random seeds', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const ticket = generateTicket(seededRng(seed))
      expect(isValidTicket(ticket)).toBe(true)
    }
  })

  test('every row has exactly 5 filled cells', () => {
    const ticket = generateTicket(seededRng(7))
    for (let r = 0; r < ROWS; r++) {
      expect(rowOf(ticket, r).filter(c => c !== null).length).toBe(5)
    }
  })

  test('has exactly 15 filled cells and 12 blanks total', () => {
    const ticket = generateTicket(seededRng(11))
    expect(ticket.cells.filter(c => c !== null).length).toBe(15)
    expect(ticket.cells.filter(c => c === null).length).toBe(12)
  })

  test('numbers in each column fall within that column\'s range and are sorted ascending top-to-bottom', () => {
    const ticket = generateTicket(seededRng(23))
    for (let col = 0; col < COLS; col++) {
      const [lo, hi] = COLUMN_RANGES[col]
      const values = []
      for (let row = 0; row < ROWS; row++) {
        const v = getCell(ticket, row, col)
        if (v !== null) values.push(v)
      }
      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(lo)
        expect(v).toBeLessThanOrEqual(hi)
      }
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1])
      }
    }
  })

  test('no duplicate numbers within a ticket', () => {
    const ticket = generateTicket(seededRng(42))
    const flat = ticket.cells.filter(c => c !== null)
    expect(new Set(flat).size).toBe(flat.length)
  })

  test('is deterministic given the same rng sequence', () => {
    const a = generateTicket(seededRng(99))
    const b = generateTicket(seededRng(99))
    expect(a).toEqual(b)
  })
})

describe('cellIndex / getCell', () => {
  test('maps row-major index correctly', () => {
    expect(cellIndex(0, 0)).toBe(0)
    expect(cellIndex(0, 8)).toBe(8)
    expect(cellIndex(1, 0)).toBe(9)
    expect(cellIndex(2, 8)).toBe(26)
  })

  test('getCell reads the right flat index', () => {
    const ticket = { cells: new Array(27).fill(null) }
    ticket.cells[cellIndex(1, 3)] = 42
    expect(getCell(ticket, 1, 3)).toBe(42)
  })
})

describe('isValidTicket', () => {
  test('rejects a ticket with a row missing filled cells', () => {
    const bad = { cells: [1, null, null, null, null, null, null, null, null, ...new Array(18).fill(null)] }
    expect(isValidTicket(bad)).toBe(false)
  })

  test('rejects a ticket with a number outside its column range', () => {
    const ticket = generateTicket(seededRng(3))
    const bad = { cells: [...ticket.cells] }
    bad.cells[cellIndex(0, 0)] = 50 // col 0 only allows 1-9
    expect(isValidTicket(bad)).toBe(false)
  })

  test('rejects a non-flat (nested-array) ticket shape outright', () => {
    expect(isValidTicket({ cells: [[1], [2]] })).toBe(false)
  })
})

describe('ticketsAreIdentical', () => {
  test('true for the same ticket', () => {
    const t = generateTicket(seededRng(5))
    expect(ticketsAreIdentical(t, t)).toBe(true)
  })

  test('false for two different random tickets (overwhelmingly likely)', () => {
    const a = generateTicket(seededRng(1))
    const b = generateTicket(seededRng(2))
    expect(ticketsAreIdentical(a, b)).toBe(false)
  })

  test('true when number sets match regardless of cell arrangement', () => {
    const a = { cells: [1, ...new Array(26).fill(null)] }
    const b = { cells: [null, 1, ...new Array(25).fill(null)] }
    expect(ticketsAreIdentical(a, b)).toBe(true)
  })
})

describe('generateUniqueTicket', () => {
  test('regenerates when the first draw would collide with an existing ticket', () => {
    // `existing` was built from a fresh seed-1 sequence. Handing
    // generateUniqueTicket that same fresh seed-1 sequence means its first
    // internal generateTicket() call reproduces `existing[0]` exactly,
    // forcing a collision and a regenerate from the rest of the sequence.
    const existing = [generateTicket(seededRng(1))]
    const result = generateUniqueTicket(existing, seededRng(1))
    expect(isValidTicket(result)).toBe(true)
    expect(ticketsAreIdentical(result, existing[0])).toBe(false)
  })

  test('never returns a ticket identical to any existing one, across many attempts', () => {
    const existing = [generateTicket(seededRng(10))]
    for (let seed = 11; seed <= 60; seed++) {
      const t = generateUniqueTicket(existing, seededRng(seed))
      expect(existing.some(e => ticketsAreIdentical(e, t))).toBe(false)
      existing.push(t)
    }
  })
})
