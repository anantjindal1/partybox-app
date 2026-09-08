/**
 * Prize-pattern checking against a ticket + a set of marked cell positions.
 * `markedPositions` is a Set of "row-col" strings, e.g. "0-3".
 * These are local UX-gate helpers only — never used to auto-approve a
 * claim server-side, per the game's manual-verification design.
 */
import { getCell, ROWS, COLS } from './ticket'

export const PRIZES = ['earlyFive', 'topLine', 'middleLine', 'bottomLine', 'corners', 'fullHouse']

function filledPositions(ticket) {
  const positions = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (getCell(ticket, r, c) !== null) positions.push(`${r}-${c}`)
    }
  }
  return positions
}

function rowFilledPositions(ticket, row) {
  const positions = []
  for (let c = 0; c < COLS; c++) {
    if (getCell(ticket, row, c) !== null) positions.push(`${row}-${c}`)
  }
  return positions
}

function isAllMarked(positions, markedPositions) {
  return positions.length > 0 && positions.every(p => markedPositions.has(p))
}

function cornerPositions(ticket) {
  const top = rowFilledPositions(ticket, 0)
  const bottom = rowFilledPositions(ticket, 2)
  if (top.length === 0 || bottom.length === 0) return []
  return [top[0], top[top.length - 1], bottom[0], bottom[bottom.length - 1]]
}

const CHECKERS = {
  earlyFive: (ticket, markedPositions) => {
    const filled = filledPositions(ticket)
    const markedCount = filled.filter(p => markedPositions.has(p)).length
    return markedCount >= 5
  },
  topLine: (ticket, markedPositions) => isAllMarked(rowFilledPositions(ticket, 0), markedPositions),
  middleLine: (ticket, markedPositions) => isAllMarked(rowFilledPositions(ticket, 1), markedPositions),
  bottomLine: (ticket, markedPositions) => isAllMarked(rowFilledPositions(ticket, 2), markedPositions),
  corners: (ticket, markedPositions) => isAllMarked(cornerPositions(ticket), markedPositions),
  fullHouse: (ticket, markedPositions) => isAllMarked(filledPositions(ticket), markedPositions)
}

export function checkPattern(prizeId, ticket, markedPositions) {
  const checker = CHECKERS[prizeId]
  if (!checker) return false
  return checker(ticket, markedPositions)
}

// The set of ticket positions whose number has actually been called — the
// ground truth, independent of anything the player self-reported as marked.
// Lets the host verify a claim from data it already has (ticket +
// calledNumbers), with no need to sync a player's local marks.
export function calledPositions(ticket, calledNumbers) {
  const positions = new Set()
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const value = getCell(ticket, r, c)
      if (value !== null && calledNumbers.includes(value)) positions.add(`${r}-${c}`)
    }
  }
  return positions
}

// Host-facing validity check: is this claim actually true, based on what's
// really been called? Informational only — the host still approves/rejects
// manually, this never auto-approves anything.
export function isClaimValid(prizeId, ticket, calledNumbers) {
  return checkPattern(prizeId, ticket, calledPositions(ticket, calledNumbers))
}
