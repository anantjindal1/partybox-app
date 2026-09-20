import { findAceOfSpadesHolder, breaksSuit, rotateActiveFrom } from '../bhabhiLogic'

describe('findAceOfSpadesHolder', () => {
  it('finds whoever holds the Ace of Spades', () => {
    const hands = { p1: ['2H', '3D'], p2: ['AS', '4C'], p3: ['5S'] }
    expect(findAceOfSpadesHolder(hands, ['p1', 'p2', 'p3'])).toBe('p2')
  })

  it('falls back to the first player if nobody holds it (should not happen with a full deal, but stay safe)', () => {
    const hands = { p1: ['2H'], p2: ['4C'] }
    expect(findAceOfSpadesHolder(hands, ['p1', 'p2'])).toBe('p1')
  })
})

describe('breaksSuit', () => {
  it('is false when the card matches the led suit', () => {
    expect(breaksSuit('7H', 'hearts', false)).toBe(false)
  })

  it('is true when the card does not match the led suit and it is not the first round', () => {
    expect(breaksSuit('7H', 'spades', false)).toBe(true)
  })

  it('is always false during the first round, even off-suit', () => {
    expect(breaksSuit('7H', 'spades', true)).toBe(false)
  })

  it('is false when there is no led suit yet (opening a pile)', () => {
    expect(breaksSuit('7H', null, false)).toBe(false)
  })
})

describe('rotateActiveFrom', () => {
  it('rotates the active subset to start at the given player, preserving seat order', () => {
    const seatingOrder = ['p1', 'p2', 'p3', 'p4']
    expect(rotateActiveFrom(seatingOrder, seatingOrder, 'p3')).toEqual(['p3', 'p4', 'p1', 'p2'])
  })

  it('skips players who are no longer active', () => {
    const seatingOrder = ['p1', 'p2', 'p3', 'p4']
    const activeIds = ['p1', 'p3', 'p4']
    expect(rotateActiveFrom(seatingOrder, activeIds, 'p4')).toEqual(['p4', 'p1', 'p3'])
  })

  it('returns the plain active order if startId is not active', () => {
    const seatingOrder = ['p1', 'p2', 'p3', 'p4']
    const activeIds = ['p1', 'p3', 'p4']
    expect(rotateActiveFrom(seatingOrder, activeIds, 'p2')).toEqual(['p1', 'p3', 'p4'])
  })
})
