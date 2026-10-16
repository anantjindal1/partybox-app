import { PROMPTS } from '../prompts'
import {
  pickPrompt, pickNextSlot, spinRotation, segmentAt,
  averageRating, addTurnScore, leaderboard,
} from '../logic'

const seq = (...vals) => { let i = 0; return () => vals[i++ % vals.length] }

describe('prompts', () => {
  test('every prompt has a unique id and both languages', () => {
    const all = Object.values(PROMPTS).flatMap(s => [...s.truth, ...s.dare])
    expect(new Set(all.map(p => p.id)).size).toBe(all.length)
    for (const p of all) {
      expect(p.en.length).toBeGreaterThan(0)
      expect(p.hi.length).toBeGreaterThan(0)
    }
  })

  test('pickPrompt avoids used ids, then resets once exhausted', () => {
    const pool = PROMPTS.office.truth
    const used = pool.slice(1).map(p => p.id)
    expect(pickPrompt('office', 'truth', used).id).toBe(pool[0].id)
    expect(pickPrompt('office', 'truth', pool.map(p => p.id))).not.toBeNull()
  })
})

describe('pickNextSlot', () => {
  test('random mode can repeat the same slot', () => {
    expect(pickNextSlot(['a', 'b'], 'random', [], () => 0).id).toBe('a')
    expect(pickNextSlot(['a', 'b'], 'random', ['a'], () => 0).id).toBe('a')
  })

  test('cycle mode gives everyone a turn before repeating', () => {
    const ids = ['a', 'b', 'c']
    let done = []
    const seen = []
    for (let i = 0; i < 3; i++) {
      const r = pickNextSlot(ids, 'cycle', done, () => 0.99)
      seen.push(r.id)
      done = r.cycleDone
    }
    expect(new Set(seen).size).toBe(3)
    const next = pickNextSlot(ids, 'cycle', done, () => 0)
    expect(next.cycleDone).toEqual([next.id])
  })

  test('cycle mode ignores slots removed mid-cycle', () => {
    const r = pickNextSlot(['a', 'c'], 'cycle', ['a', 'b'], () => 0)
    expect(r.id).toBe('c')
    expect(r.cycleDone).toEqual(['a', 'c'])
  })
})

describe('spinRotation', () => {
  test('lands in the target segment and always spins forward', () => {
    let rot = 0
    for (const [index, count] of [[0, 2], [3, 5], [11, 12], [1, 7]]) {
      for (const r of [0, 0.5, 0.999]) {
        const next = spinRotation(rot, index, count, () => r)
        expect(next - rot).toBeGreaterThanOrEqual(5 * 360)
        expect(segmentAt(next, count)).toBe(index)
        rot = next
      }
    }
  })
})

describe('scoring', () => {
  test('averageRating', () => {
    expect(averageRating([])).toBeNull()
    expect(averageRating([5, 4, 0])).toBe(3)
  })

  test('leaderboard ranks by average per turn, ties by turns', () => {
    let s = {}
    s = addTurnScore(s, 'a', 'A', 5)
    s = addTurnScore(s, 'b', 'B', 4)
    s = addTurnScore(s, 'b', 'B', 4)
    s = addTurnScore(s, 'c', 'C', 2)
    s = addTurnScore(s, 'c', 'C', 4)
    s = addTurnScore(s, 'c', 'C', 6)
    const board = leaderboard(s)
    expect(board.map(r => r.id)).toEqual(['a', 'c', 'b'])
    expect(board[1]).toEqual({ id: 'c', name: 'C', turns: 3, avg: 4 })
  })
})
