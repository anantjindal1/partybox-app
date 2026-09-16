export function buildConfessionOrder(confessions, rng = Math.random) {
  return [...confessions].sort(() => rng() - 0.5).map(c => c.id)
}

export function buildGuessMap(actions) {
  const map = {}
  for (const a of actions) {
    if (a.type !== 'GUESS') continue
    const target = a.payload?.targetPlayerId
    if (!target) continue
    map[a.playerId] = target
  }
  return map
}

export function scoreConfession(guessMap, authorId, eligibleVoterIds) {
  const correctGuesserIds = eligibleVoterIds.filter(id => guessMap[id] === authorId)
  const wrongCount = eligibleVoterIds.filter(id => guessMap[id] && guessMap[id] !== authorId).length
  return { correctGuesserIds, authorPoints: wrongCount }
}

export function tallyByTarget(guessMap) {
  const tally = {}
  for (const target of Object.values(guessMap)) {
    tally[target] = (tally[target] ?? 0) + 1
  }
  return tally
}
