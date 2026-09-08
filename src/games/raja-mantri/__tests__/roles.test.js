import { assignRoles, computeRoundScores, ROLE_POINTS } from '../roles'

describe('assignRoles', () => {
  it('returns null for fewer than 4 players', () => {
    expect(assignRoles(['a', 'b', 'c'])).toBeNull()
    expect(assignRoles([])).toBeNull()
  })

  it('assigns exactly 1 raja, 1 mantri, 1 chor at N=4, and 1 sipahi', () => {
    const roles = assignRoles(['a', 'b', 'c', 'd'])
    const counts = countRoles(roles)
    expect(counts).toEqual({ raja: 1, mantri: 1, chor: 1, sipahi: 1 })
  })

  it('assigns exactly 1 raja, 1 mantri, 1 chor at N=8, and 5 sipahi', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const roles = assignRoles(ids)
    const counts = countRoles(roles)
    expect(counts).toEqual({ raja: 1, mantri: 1, chor: 1, sipahi: 5 })
  })

  it('includes every input id exactly once', () => {
    const ids = ['a', 'b', 'c', 'd', 'e']
    const roles = assignRoles(ids)
    expect(Object.keys(roles).sort()).toEqual([...ids].sort())
  })

  it('does not mutate the input array', () => {
    const ids = ['a', 'b', 'c', 'd']
    const original = [...ids]
    assignRoles(ids)
    expect(ids).toEqual(original)
  })

  it('is deterministic given a scripted rng', () => {
    // rng always returns 0 => each Fisher-Yates swap picks index 0,
    // rotating the array to [b, c, d, a]
    const roles = assignRoles(['a', 'b', 'c', 'd'], () => 0)
    expect(roles).toEqual({ b: 'raja', c: 'mantri', d: 'chor', a: 'sipahi' })
  })

  function countRoles(roles) {
    const counts = { raja: 0, mantri: 0, chor: 0, sipahi: 0 }
    for (const role of Object.values(roles)) counts[role]++
    return counts
  }
})

describe('computeRoundScores', () => {
  const roles = { p1: 'raja', p2: 'mantri', p3: 'chor', p4: 'sipahi' }

  it('rewards the mantri and zeroes the chor on a correct guess', () => {
    const { scores, correct } = computeRoundScores(roles, 'p3')
    expect(correct).toBe(true)
    expect(scores).toEqual({ p1: 1000, p2: 800, p3: 0, p4: 500 })
  })

  it('swaps points to the chor on a wrong guess', () => {
    const { scores, correct } = computeRoundScores(roles, 'p4')
    expect(correct).toBe(false)
    expect(scores).toEqual({ p1: 1000, p2: 0, p3: 800, p4: 500 })
  })

  it('treats guessing the raja as wrong', () => {
    const { scores, correct } = computeRoundScores(roles, 'p1')
    expect(correct).toBe(false)
    expect(scores.p2).toBe(0)
    expect(scores.p3).toBe(800)
  })

  it('treats a null guess (timeout) as wrong', () => {
    const { scores, correct } = computeRoundScores(roles, null)
    expect(correct).toBe(false)
    expect(scores.p2).toBe(0)
    expect(scores.p3).toBe(800)
  })

  it('identifies rajaId, mantriId, chorId', () => {
    const { rajaId, mantriId, chorId } = computeRoundScores(roles, null)
    expect({ rajaId, mantriId, chorId }).toEqual({ rajaId: 'p1', mantriId: 'p2', chorId: 'p3' })
  })

  it('keeps total distributed points constant regardless of outcome', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f']
    const roleMap = assignRoles(ids, () => 0) // deterministic: a=raja b=mantri c=chor d,e,f=sipahi
    const expectedTotal = ROLE_POINTS.raja + ROLE_POINTS.sipahi * 3 + ROLE_POINTS.mantri_correct

    const correctGuess = computeRoundScores(roleMap, roleMap && Object.keys(roleMap).find(id => roleMap[id] === 'chor'))
    const wrongGuess = computeRoundScores(roleMap, null)

    const sum = (scores) => Object.values(scores).reduce((a, b) => a + b, 0)
    expect(sum(correctGuess.scores)).toBe(expectedTotal)
    expect(sum(wrongGuess.scores)).toBe(expectedTotal)
  })
})
