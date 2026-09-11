import { parseCard } from '../../multiplayer/deck'
import { getTeamA, getTeamB, getTeamOf, computeTeamTricks } from '../../multiplayer/partnerships'

export { getTeamA, getTeamB, getTeamOf, computeTeamTricks }

/**
 * Cards are dealt one at a time, round-robin through turnOrder, from a
 * freshly shuffled deck, until someone receives a Jack — that player
 * is the starting shuffler. "Clockwise" is just a fixed convention;
 * this only needs to be a deterministic function of a shuffled deck.
 */
export function determineInitialShuffler(shuffledDeck, turnOrder) {
  for (let i = 0; i < shuffledDeck.length; i++) {
    if (parseCard(shuffledDeck[i]).rank === 'J') return turnOrder[i % turnOrder.length]
  }
  return turnOrder[0] // defensive fallback, unreachable with a real 52-card deck
}

/**
 * The shuffler's counter-clockwise neighbor bids first; bidding then
 * proceeds counter-clockwise for exactly 2 full rounds (8 turns).
 * turnOrder's stored order already represents "counter-clockwise"
 * progression (a labeling choice — see teriLogic notes), so this is a
 * plain 8-entry cycle starting one seat after the shuffler.
 */
export function computeBiddingOrder(turnOrder, shufflerId) {
  const startIdx = (turnOrder.indexOf(shufflerId) + 1) % turnOrder.length
  return Array.from({ length: 8 }, (_, i) => turnOrder[(startIdx + i) % turnOrder.length])
}

export function isValidBid(number, currentHighBid) {
  if (number < 7 || number > 13) return false
  return currentHighBid ? number > currentHighBid.number : true
}

/**
 * The hand ends the instant GameLead's team reaches their bid, or the
 * defending team reaches 14-bid (the point past which GameLead
 * mathematically can't reach their bid) — UNLESS the other side is
 * still at zero tricks, in which case play continues until either a
 * full 13-trick sweep ("Teri"), or the trailing side wins its first
 * trick (which ends the hand immediately for the already-qualified
 * side, non-Teri). Applies symmetrically to either team.
 */
export function checkTeriHandWinner(gameLeadTricks, defenderTricks, bid) {
  const defenderTarget = 14 - bid
  if (gameLeadTricks === 13) return { winner: 'gameLead', isTeri: true }
  if (defenderTricks === 13) return { winner: 'defender', isTeri: true }
  if (gameLeadTricks >= bid && defenderTricks > 0) return { winner: 'gameLead', isTeri: false }
  if (defenderTricks >= defenderTarget && gameLeadTricks > 0) return { winner: 'defender', isTeri: false }
  return null
}

export function computeHandPoints(bid, winner, isTeri) {
  const gameLeadWon = winner === 'gameLead'
  if (bid === 13) return gameLeadWon ? 39 : -39
  if (gameLeadWon) return isTeri ? 26 : bid
  return -2 * bid
}

/**
 * The single running score, tracked from whichever player currently
 * holds the shuffler role. `isShufflerOnGameLeadTeam` mirrors the
 * hand's GameLead-perspective points onto the shuffler's own team,
 * since the score should reflect whether the SHUFFLER's own side
 * gained or lost, not always GameLead's perspective.
 */
export function applyShufflerScore({
  currentScore,
  handPointsForGameLead,
  isShufflerOnGameLeadTeam,
  shufflerId,
  shufflerPartnerId,
  nextCounterClockwiseId
}) {
  const delta = isShufflerOnGameLeadTeam ? handPointsForGameLead : -handPointsForGameLead
  const raw = currentScore - delta
  if (raw < 0) {
    return { shufflerId: nextCounterClockwiseId, score: -raw, burstPlayerId: null }
  }
  if (raw > 52) {
    return { shufflerId: shufflerPartnerId, score: 0, burstPlayerId: shufflerId }
  }
  return { shufflerId, score: raw, burstPlayerId: null }
}

/**
 * The match ends the moment BOTH members of one team have individually
 * triggered a burst (>52) at some point in match history — the OTHER
 * team wins.
 */
export function checkMatchWinner(burstPlayerIds, turnOrder) {
  const teamA = getTeamA(turnOrder)
  const teamB = getTeamB(turnOrder)
  if (teamA.every(id => burstPlayerIds.includes(id))) return 'teamB'
  if (teamB.every(id => burstPlayerIds.includes(id))) return 'teamA'
  return null
}
