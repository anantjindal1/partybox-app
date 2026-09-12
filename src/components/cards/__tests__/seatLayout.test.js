import { getSeatPosition, getHandStep } from '../seatLayout'

describe('getSeatPosition', () => {
  test('a single seat sits dead center, near the top', () => {
    expect(getSeatPosition(0, 1)).toEqual({ left: '50%', top: '20%' })
  })

  test('two seats spread symmetrically at the arc endpoints', () => {
    const first = getSeatPosition(0, 2)
    const second = getSeatPosition(1, 2)
    // angle 170deg and 10deg -> symmetric around the vertical center line (50%)
    const firstLeft = parseFloat(first.left)
    const secondLeft = parseFloat(second.left)
    expect(firstLeft).toBeCloseTo(100 - secondLeft, 5)
    expect(parseFloat(first.top)).toBeCloseTo(parseFloat(second.top), 5)
  })

  test('four seats are evenly spaced and symmetric', () => {
    const positions = [0, 1, 2, 3].map(i => getSeatPosition(i, 4))
    // Endpoints closer to the sides (lower top-position number = higher up
    // is not guaranteed at the very edges; instead check left-right symmetry).
    expect(parseFloat(positions[0].left)).toBeCloseTo(100 - parseFloat(positions[3].left), 5)
    expect(parseFloat(positions[1].left)).toBeCloseTo(100 - parseFloat(positions[2].left), 5)
  })

  test('eight seats (max realistic opponent count) all land within table bounds', () => {
    const positions = [...Array(8).keys()].map(i => getSeatPosition(i, 8))
    for (const pos of positions) {
      const left = parseFloat(pos.left)
      const top = parseFloat(pos.top)
      expect(left).toBeGreaterThanOrEqual(0)
      expect(left).toBeLessThanOrEqual(100)
      expect(top).toBeGreaterThanOrEqual(0)
      expect(top).toBeLessThanOrEqual(100)
    }
  })

  test('the middle seat of an odd count sits at the very top center', () => {
    const middle = getSeatPosition(2, 5) // index 2 of 5 -> angle 90deg
    expect(parseFloat(middle.left)).toBeCloseTo(50, 5)
  })
})

describe('getHandStep', () => {
  const CARD_WIDTH = 46

  test('a single card needs no overlap', () => {
    expect(getHandStep(1, CARD_WIDTH)).toBe(CARD_WIDTH)
  })

  test('a small hand uses the comfortable default, not squeezed tighter than needed', () => {
    const step = getHandStep(4, CARD_WIDTH, 340)
    expect(step).toBe(CARD_WIDTH - 10)
  })

  test('a 13-card hand fits within the target width', () => {
    const step = getHandStep(13, CARD_WIDTH, 340)
    const totalWidth = CARD_WIDTH + 12 * step
    expect(totalWidth).toBeLessThanOrEqual(340 + 0.01)
  })

  test('a 17-card hand (Judgement\'s hill peak) still fits within the target width', () => {
    const step = getHandStep(17, CARD_WIDTH, 340)
    const totalWidth = CARD_WIDTH + 16 * step
    expect(totalWidth).toBeLessThanOrEqual(340 + 0.01)
  })

  test('step never goes negative or absurdly small for a very large hand', () => {
    const step = getHandStep(30, CARD_WIDTH, 340)
    expect(step).toBeGreaterThan(0)
  })
})
