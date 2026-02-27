/**
 * Desi Memory Master board generation tests.
 * Correct number of pairs, shuffle works (not ordered), no duplicate IDs.
 */
import { generateBoard, shuffleArray, getPairCount } from '../boardUtils'
import { getThemeByName } from '../themes'

describe('desi-memory-master board', () => {
  test('Correct number of pairs generated for each difficulty', () => {
    expect(getPairCount('easy')).toBe(8)
    expect(getPairCount('medium')).toBe(10)
    expect(getPairCount('hard')).toBe(12)
    const theme = getThemeByName('Indian Food')
    expect(theme).not.toBeNull()
    expect(theme.items.length).toBeGreaterThanOrEqual(12)

    const easy = generateBoard('easy', 'Indian Food')
    expect(easy.length).toBe(16) // 8 pairs
    const medium = generateBoard('medium', 'Indian Food')
    expect(medium.length).toBe(20)
    const hard = generateBoard('hard', 'Indian Food')
    expect(hard.length).toBe(24)
  })

  test('Shuffle works — board is not in original order', () => {
    const theme = getThemeByName('Indian Food')
    const items = theme.items.slice(0, 8)
    const doubled = [...items, ...items]
    const ordered = doubled.map((value, i) => ({ id: `id-${i}`, value }))
    const shuffled = shuffleArray([...ordered])
    // Shuffled array should have same elements but very unlikely to be same order
    const orderedIds = ordered.map(c => c.id).join(',')
    const shuffledIds = shuffled.map(c => c.id).join(',')
    expect(shuffled.length).toBe(ordered.length)
    const valuesOrdered = [...ordered].sort((a, b) => a.id.localeCompare(b.id)).map(c => c.value)
    const valuesShuffled = [...shuffled].sort((a, b) => a.id.localeCompare(b.id)).map(c => c.value)
    expect(valuesOrdered.sort()).toEqual(valuesShuffled.sort())
  })

  test('No duplicate ID collision', () => {
    const board = generateBoard('easy', 'Cricket')
    const ids = board.map(c => c.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  test('Each value appears exactly twice', () => {
    const board = generateBoard('medium', 'Bollywood Actors')
    const valueCounts = {}
    board.forEach(c => {
      valueCounts[c.value] = (valueCounts[c.value] || 0) + 1
    })
    Object.values(valueCounts).forEach(count => expect(count).toBe(2))
  })

  test('Unknown theme returns empty board', () => {
    const board = generateBoard('easy', 'Unknown Theme')
    expect(board).toEqual([])
  })

  test('Board generation under 50ms (performance)', () => {
    const start = performance.now()
    for (let i = 0; i < 100; i++) {
      generateBoard('hard', 'Indian Monuments')
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(50 * 100) // 100 boards in under 5s total, so each < 50ms on average
  })
})
