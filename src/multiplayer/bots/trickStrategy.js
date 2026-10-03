/**
 * Card choice for follow-suit trick games (Court Piece, Mendikot, Call
 * Break, Judgement...) — pure. Easy plays a random legal card; medium
 * follows a decent player's rules of thumb with occasional slips; hard
 * plays the same rules perfectly and also knows which cards are still
 * out (`unplayed` — every card not yet played and not in this bot's
 * hand; never who holds them).
 */
import { parseCard, rankIndex } from '../deck'
import { resolveTrick, getLegalPlays } from '../trick'
import { MISTAKE_RATE, pickRandom } from './bots'

function cardValue(card, aceHigh) {
  const { rank } = parseCard(card)
  return aceHigh && rank === 'A' ? 13 : rankIndex(rank)
}

function lowest(cards, aceHigh) {
  return cards.reduce((a, b) => (cardValue(b, aceHigh) < cardValue(a, aceHigh) ? b : a))
}

function highest(cards, aceHigh) {
  return cards.reduce((a, b) => (cardValue(b, aceHigh) > cardValue(a, aceHigh) ? b : a))
}

function suitOf(card) {
  return parseCard(card).suit
}

// No card still out can beat it within its own suit.
function isBoss(card, unplayed, aceHigh) {
  const suit = suitOf(card)
  const v = cardValue(card, aceHigh)
  return !unplayed.some(c => suitOf(c) === suit && cardValue(c, aceHigh) > v)
}

function longestSuitCards(cards) {
  const bySuit = {}
  for (const c of cards) (bySuit[suitOf(c)] ??= []).push(c)
  return Object.values(bySuit).reduce((a, b) => (b.length > a.length ? b : a))
}

function dumpLowest(legal, trumpSuit, aceHigh) {
  const nonTrump = legal.filter(c => suitOf(c) !== trumpSuit)
  return lowest(nonTrump.length ? nonTrump : legal, aceHigh)
}

function chooseLead(legal, { trumpSuit, unplayed, difficulty, aceHigh }) {
  const nonTrump = legal.filter(c => suitOf(c) !== trumpSuit)
  const pool = nonTrump.length ? nonTrump : legal

  if (difficulty === 'hard') {
    const bosses = pool.filter(c => isBoss(c, unplayed, aceHigh))
    if (bosses.length) return highest(bosses, aceHigh)
    const myTrumps = legal.filter(c => suitOf(c) === trumpSuit)
    const trumpsOut = unplayed.some(c => suitOf(c) === trumpSuit)
    const bossTrump = myTrumps.find(c => isBoss(c, unplayed, aceHigh))
    if (bossTrump && trumpsOut) return bossTrump
  } else {
    const ace = pool.find(c => parseCard(c).rank === 'A')
    if (ace && aceHigh) return ace
  }
  return lowest(longestSuitCards(pool), aceHigh)
}

export function chooseTrickCard({
  hand,
  currentHand,
  ledSuit,
  trumpSuit = null,
  myId,
  isTeammate = () => false,
  playerCount,
  unplayed = [],
  difficulty,
  aceHigh = true,
  rng = Math.random
}) {
  const legal = getLegalPlays(hand, ledSuit)
  if (legal.length === 1) return legal[0]
  if (rng() < MISTAKE_RATE[difficulty]) return pickRandom(legal, rng)

  if (currentHand.length === 0) {
    return chooseLead(legal, { trumpSuit, unplayed, difficulty, aceHigh })
  }

  const opts = { aceHigh }
  const winnerSoFar = resolveTrick(currentHand, ledSuit, trumpSuit, opts)
  if (isTeammate(winnerSoFar)) return dumpLowest(legal, trumpSuit, aceHigh)

  const winners = legal.filter(c =>
    resolveTrick([...currentHand, { playerId: myId, card: c }], ledSuit, trumpSuit, opts) === myId
  )
  if (!winners.length) return dumpLowest(legal, trumpSuit, aceHigh)

  const isLast = currentHand.length === playerCount - 1
  if (!isLast && difficulty === 'hard') {
    const safe = winners.filter(c => suitOf(c) === trumpSuit || isBoss(c, unplayed, aceHigh))
    if (safe.length) return lowest(safe, aceHigh)
  }
  return lowest(winners, aceHigh)
}

/**
 * Trump suit to call from a (possibly partial) hand: the suit with the
 * most length, high cards breaking ties. Easy calls at random.
 */
export function chooseTrumpSuit(hand, difficulty, rng = Math.random) {
  const suits = [...new Set(hand.map(suitOf))]
  if (difficulty === 'easy' || rng() < MISTAKE_RATE[difficulty]) return pickRandom(suits, rng)
  const strength = suit =>
    hand.filter(c => suitOf(c) === suit).reduce((sum, c) => sum + 10 + Math.max(0, cardValue(c, true) - 8), 0)
  return suits.reduce((a, b) => (strength(b) > strength(a) ? b : a))
}
