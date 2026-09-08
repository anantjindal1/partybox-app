/**
 * Tambola ticket generation — standard 3-row x 9-column layout.
 * Column ranges: col 0 = 1-9, col 1-7 = 10-19...70-79, col 8 = 80-90.
 * Each ticket has exactly 15 filled cells (5 per row), rest null (blank),
 * each column's filled numbers sorted ascending top-to-bottom.
 *
 * Ticket shape is a FLAT array of 27 cells (row-major: index = row*9+col),
 * not row arrays — Firestore rejects nested arrays (array-of-arrays), and
 * this ticket gets written into room.state, so the canonical shape has to
 * be flat everywhere, not just serialized at the write boundary.
 */

export const COLUMN_RANGES = [
  [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
  [50, 59], [60, 69], [70, 79], [80, 90]
]

export const ROWS = 3
export const COLS = 9
const CELLS_PER_ROW = 5

export function cellIndex(row, col) {
  return row * COLS + col
}

export function getCell(ticket, row, col) {
  return ticket.cells[cellIndex(row, col)]
}

function shuffle(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 9 column fill-counts (1-3 each) summing to 15: start all at 1, distribute
// the remaining 6 randomly, capped at 3 per column.
function chooseColumnCounts(rng) {
  const counts = new Array(COLS).fill(1)
  let remaining = COLS * CELLS_PER_ROW / ROWS - COLS // 15 - 9 = 6
  while (remaining > 0) {
    const idx = Math.floor(rng() * COLS)
    if (counts[idx] < 3) {
      counts[idx]++
      remaining--
    }
  }
  return counts
}

// Greedy bipartite construction: process columns in random order, each
// column's k cells go to the k rows with the most remaining capacity
// (each row starts at capacity 5). Provably succeeds in one pass since
// column degree (<=3) never exceeds the row count.
function assignRows(columnCounts, rng) {
  const rowCapacity = [CELLS_PER_ROW, CELLS_PER_ROW, CELLS_PER_ROW]
  const columnOrder = shuffle([...Array(COLS).keys()], rng)
  const grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(false))

  for (const col of columnOrder) {
    const k = columnCounts[col]
    const rowsByCapacity = [0, 1, 2]
      .sort((a, b) => rowCapacity[b] - rowCapacity[a] || rng() - 0.5)
      .slice(0, k)
    for (const row of rowsByCapacity) {
      grid[row][col] = true
      rowCapacity[row]--
    }
  }
  return grid
}

function pickNumbers(range, count, rng) {
  const [lo, hi] = range
  const pool = []
  for (let n = lo; n <= hi; n++) pool.push(n)
  return shuffle(pool, rng).slice(0, count).sort((a, b) => a - b)
}

export function generateTicket(rng = Math.random) {
  const columnCounts = chooseColumnCounts(rng)
  const grid = assignRows(columnCounts, rng)
  const cells = new Array(ROWS * COLS).fill(null)

  for (let col = 0; col < COLS; col++) {
    const filledRows = [0, 1, 2].filter(r => grid[r][col])
    const numbers = pickNumbers(COLUMN_RANGES[col], columnCounts[col], rng)
    filledRows.forEach((row, i) => {
      cells[cellIndex(row, col)] = numbers[i]
    })
  }

  return { cells }
}

export function isValidTicket(ticket) {
  const { cells } = ticket
  if (!Array.isArray(cells) || cells.length !== ROWS * COLS) return false

  for (let row = 0; row < ROWS; row++) {
    const rowCells = cells.slice(row * COLS, row * COLS + COLS)
    if (rowCells.filter(c => c !== null).length !== CELLS_PER_ROW) return false
  }

  const seen = new Set()
  for (let col = 0; col < COLS; col++) {
    const colValues = []
    for (let row = 0; row < ROWS; row++) {
      const v = cells[cellIndex(row, col)]
      if (v !== null) colValues.push(v)
    }
    if (colValues.length < 1 || colValues.length > 3) return false
    const [lo, hi] = COLUMN_RANGES[col]
    for (const v of colValues) {
      if (v < lo || v > hi) return false
      if (seen.has(v)) return false
      seen.add(v)
    }
    for (let i = 1; i < colValues.length; i++) {
      if (colValues[i] <= colValues[i - 1]) return false
    }
  }

  return seen.size === 15
}

function flatNumbers(ticket) {
  return ticket.cells.filter(c => c !== null).sort((a, b) => a - b)
}

export function ticketsAreIdentical(a, b) {
  const flatA = flatNumbers(a)
  const flatB = flatNumbers(b)
  if (flatA.length !== flatB.length) return false
  return flatA.every((v, i) => v === flatB[i])
}

export function generateUniqueTicket(existingTickets, rng = Math.random) {
  let ticket = generateTicket(rng)
  let attempts = 0
  while (existingTickets.some(t => ticketsAreIdentical(t, ticket)) && attempts < 50) {
    ticket = generateTicket(rng)
    attempts++
  }
  return ticket
}
