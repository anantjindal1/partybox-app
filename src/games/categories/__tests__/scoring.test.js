/**
 * A to Z Dhamaka scoring tests.
 * Unique 10, duplicate 5, invalid 0, bonus all valid +5, all unique +5.
 */
import {
  calculateScores,
  buildDuplicateMap,
  getRoundWinnerIndex,
  calculatePlayerXP
} from '../scoring'

describe('categories scoring', () => {
  test('unique valid word = 10, plus bonuses when all 4 valid and unique', () => {
    const players = [
      { id: 'p0', name: 'A', answers: { Name: 'Amit', Place: 'Agra', Animal: 'Ant', Thing: 'Apple' }, score: 0 }
    ]
    const validMap = { p0: { Name: true, Place: true, Animal: true, Thing: true } }
    const categories = ['Name', 'Place', 'Animal', 'Thing']
    const result = calculateScores(players, {}, validMap, categories)
    expect(result[0].score).toBe(4 * 10 + 5 + 5)
  })

  test('duplicate word = 5', () => {
    const players = [
      { id: 'p0', name: 'A', answers: { Name: 'Amit' }, score: 0 },
      { id: 'p1', name: 'B', answers: { Name: 'Amit' }, score: 0 }
    ]
    const validMap = { p0: { Name: true }, p1: { Name: true } }
    const duplicateMap = { 'Name:amit': true }
    const result = calculateScores(players, duplicateMap, validMap, ['Name'])
    expect(result[0].score).toBe(5)
    expect(result[1].score).toBe(5)
  })

  test('invalid word = 0', () => {
    const players = [
      { id: 'p0', name: 'A', answers: { Name: 'InvalidWord' }, score: 0 }
    ]
    const validMap = { p0: { Name: false } }
    const result = calculateScores(players, {}, validMap, ['Name'])
    expect(result[0].score).toBe(0)
  })

  test('bonus +5 if all 4 valid (with one duplicate so no all-unique bonus)', () => {
    const players = [
      { id: 'p0', name: 'A', answers: { N: 'a', P: 'b', A: 'c', T: 'd' }, score: 0 },
      { id: 'p1', name: 'B', answers: { N: 'a', P: 'b', A: 'c', T: 'd' }, score: 0 }
    ]
    const validMap = { p0: { N: true, P: true, A: true, T: true }, p1: { N: true, P: true, A: true, T: true } }
    const dup = { 'N:a': true, 'P:b': true, 'A:c': true, 'T:d': true }
    const categories = ['N', 'P', 'A', 'T']
    const result = calculateScores(players, dup, validMap, categories)
    expect(result[0].score).toBe(4 * 5 + 5)
  })

  test('bonus +5 if all 4 unique', () => {
    const players = [
      { id: 'p0', name: 'A', answers: { N: 'a', P: 'b', A: 'c', T: 'd' }, score: 0 }
    ]
    const validMap = { p0: { N: true, P: true, A: true, T: true } }
    const result = calculateScores(players, {}, validMap, ['N', 'P', 'A', 'T'])
    expect(result[0].score).toBe(4 * 10 + 5 + 5)
  })

  test('buildDuplicateMap: same word same category = duplicate', () => {
    const players = [
      { id: 'p0', answers: { Name: 'Amit' } },
      { id: 'p1', answers: { Name: 'Amit' } },
      { id: 'p2', answers: { Name: 'Anil' } }
    ]
    const map = buildDuplicateMap(players, ['Name'])
    expect(map['Name:amit']).toBe(true)
    expect(map['Name:anil']).toBeUndefined()
  })

  test('buildDuplicateMap: case-insensitive', () => {
    const players = [
      { id: 'p0', answers: { Name: 'Amit' } },
      { id: 'p1', answers: { Name: 'AMIT' } }
    ]
    const map = buildDuplicateMap(players, ['Name'])
    expect(map['Name:amit']).toBe(true)
  })

  test('getRoundWinnerIndex: highest score wins', () => {
    const players = [
      { id: 'p0', score: 30 },
      { id: 'p1', score: 45 },
      { id: 'p2', score: 40 }
    ]
    expect(getRoundWinnerIndex(players)).toBe(1)
  })

  test('getRoundWinnerIndex: first wins on tie', () => {
    const players = [
      { id: 'p0', score: 40 },
      { id: 'p1', score: 40 }
    ]
    expect(getRoundWinnerIndex(players)).toBe(0)
  })

  test('calculatePlayerXP: +1 per valid, +3 round winner', () => {
    expect(calculatePlayerXP(4, true)).toBe(4 + 3)
    expect(calculatePlayerXP(4, false)).toBe(4)
    expect(calculatePlayerXP(0, true)).toBe(3)
  })
})
