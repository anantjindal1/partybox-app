import { resolveTrick, getLegalPlays } from '../trick'

function play(playerId, card) {
  return { playerId, card }
}

describe('resolveTrick', () => {
  test('plain suit-following: highest card of the led suit wins', () => {
    const played = [play('a', '5H'), play('b', 'KH'), play('c', '2H')]
    expect(resolveTrick(played, 'hearts')).toBe('b')
  })

  test('a high off-suit non-trump card never beats a lower on-suit card', () => {
    const played = [play('a', '3H'), play('b', 'KC')] // b couldn't follow suit, played off-suit, no trump
    expect(resolveTrick(played, 'hearts', 'spades')).toBe('a')
  })

  test('a trump beats a non-trump regardless of rank', () => {
    const played = [play('a', 'KH'), play('b', '2S')]
    expect(resolveTrick(played, 'hearts', 'spades')).toBe('b')
  })

  test('multiple trumps played: highest trump wins', () => {
    const played = [play('a', 'KH'), play('b', '2S'), play('c', 'KS')]
    expect(resolveTrick(played, 'hearts', 'spades')).toBe('c')
  })

  test('trump suit equals led suit: degrades to plain suit-following, no special case', () => {
    const played = [play('a', '5H'), play('b', 'KH'), play('c', '2H')]
    expect(resolveTrick(played, 'hearts', 'hearts')).toBe('b')
  })

  test('trumpSuit null (no-trump round) skips the trump branch entirely', () => {
    const played = [play('a', '5H'), play('b', '2S'), play('c', 'KH')]
    // b's spade would "win" if null were ever treated as suit-equal to anything — it must not
    expect(resolveTrick(played, 'hearts', null)).toBe('c')
  })

  test('ace-high by default', () => {
    const played = [play('a', 'KH'), play('b', 'AH')]
    expect(resolveTrick(played, 'hearts')).toBe('b')
  })

  test('ace-low when explicitly requested', () => {
    const played = [play('a', 'KH'), play('b', 'AH')]
    expect(resolveTrick(played, 'hearts', null, { aceHigh: false })).toBe('a')
  })
})

describe('getLegalPlays', () => {
  test('follow-suit is enforced when the hand holds the led suit', () => {
    const hand = ['5H', 'KH', '2S']
    expect(getLegalPlays(hand, 'hearts')).toEqual(['5H', 'KH'])
  })

  test('free dump when the hand has none of the led suit', () => {
    const hand = ['2S', '3D', '4C']
    expect(getLegalPlays(hand, 'hearts')).toEqual(hand)
  })

  test('leading (ledSuit null) returns the whole hand regardless of contents', () => {
    const hand = ['5H', 'KH', '2S']
    expect(getLegalPlays(hand, null)).toEqual(hand)
  })

  test('exactly one matching card returns just that card', () => {
    const hand = ['5H', '2S', '4C']
    expect(getLegalPlays(hand, 'hearts')).toEqual(['5H'])
  })
})
