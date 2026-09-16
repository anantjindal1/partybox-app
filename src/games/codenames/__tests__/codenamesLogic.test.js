import { pickWords, buildBoard, remainingCounts, checkWordsWin, maxGuesses } from '../codenamesLogic'

describe('pickWords', () => {
  it('picks the requested count with no duplicates', () => {
    const bank = Array.from({ length: 40 }, (_, i) => `W${i}`)
    const words = pickWords(bank, 25)
    expect(words.length).toBe(25)
    expect(new Set(words).size).toBe(25)
  })
})

describe('buildBoard', () => {
  it('assigns 9 to the starting team, 8 to the other, 7 neutral, 1 assassin', () => {
    const words = Array.from({ length: 25 }, (_, i) => `W${i}`)
    const board = buildBoard(words, 'red')
    const counts = board.reduce((acc, c) => {
      acc[c.color] = (acc[c.color] ?? 0) + 1
      return acc
    }, {})
    expect(counts.red).toBe(9)
    expect(counts.blue).toBe(8)
    expect(counts.neutral).toBe(7)
    expect(counts.assassin).toBe(1)
  })

  it('gives the other starting team 9 when blue starts', () => {
    const words = Array.from({ length: 25 }, (_, i) => `W${i}`)
    const board = buildBoard(words, 'blue')
    const counts = board.reduce((acc, c) => {
      acc[c.color] = (acc[c.color] ?? 0) + 1
      return acc
    }, {})
    expect(counts.blue).toBe(9)
    expect(counts.red).toBe(8)
  })

  it('starts every card unrevealed', () => {
    const words = Array.from({ length: 25 }, (_, i) => `W${i}`)
    const board = buildBoard(words, 'red')
    expect(board.every(c => c.revealed === false)).toBe(true)
  })
})

describe('remainingCounts / checkWordsWin', () => {
  function makeBoard(redLeft, blueLeft) {
    const board = []
    for (let i = 0; i < redLeft; i++) board.push({ id: `r${i}`, color: 'red', revealed: false })
    for (let i = 0; i < blueLeft; i++) board.push({ id: `b${i}`, color: 'blue', revealed: false })
    return board
  }

  it('counts only unrevealed team cards', () => {
    const board = [
      { id: '1', color: 'red', revealed: false },
      { id: '2', color: 'red', revealed: true },
      { id: '3', color: 'blue', revealed: false },
    ]
    expect(remainingCounts(board)).toEqual({ red: 1, blue: 1 })
  })

  it('declares no winner while both teams have cards left', () => {
    expect(checkWordsWin(makeBoard(2, 3))).toBeNull()
  })

  it('declares red the winner when blue cards remain but red does not', () => {
    expect(checkWordsWin(makeBoard(0, 3))).toBe('red')
  })

  it('declares blue the winner when red cards remain but blue does not', () => {
    expect(checkWordsWin(makeBoard(3, 0))).toBe('blue')
  })
})

describe('maxGuesses', () => {
  it('allows one extra guess beyond the clue number', () => {
    expect(maxGuesses(3)).toBe(4)
    expect(maxGuesses(0)).toBe(1)
  })
})
