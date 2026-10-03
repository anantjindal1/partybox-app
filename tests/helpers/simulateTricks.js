import { parseCard } from '../../src/multiplayer/deck'
import { resolveTrick, getLegalPlays } from '../../src/multiplayer/trick'
import { removeCardFromHand } from '../../src/multiplayer/hand'

/**
 * Plays out every remaining hand of a trick game driven only by a game's
 * getBotTurns, the way the host's effects would. `actorOf(state, seatId)`
 * maps a seat to whoever must submit its play (Teri's dummy). Fails the
 * test on any illegal card or a repeated decision key.
 */
export function playOutTricks(getBotTurns, state, difficulty, { trumpOf = s => s.trumpSuit, actorOf = (s, id) => id } = {}) {
  const lastKey = {}
  const won = Object.fromEntries(state.turnOrder.map(id => [id, 0]))
  let s = { ...state, handsWon: { ...won, ...(state.handsWon ?? {}) } }
  const total = state.turnOrder.reduce((n, id) => n + s.hands[id].length, 0)
  for (let n = 0; n < total; n++) {
    const seatId = s.turnOrder[s.currentIdx]
    const turns = getBotTurns(s, [])
    expect(turns).toHaveLength(1)
    const [turn] = turns
    expect(turn.botId).toBe(actorOf(s, seatId))
    expect(lastKey[turn.botId]).not.toBe(turn.key)
    lastKey[turn.botId] = turn.key
    const { type, payload } = turn.act(difficulty)
    expect(type).toBe('PLAY')
    expect(getLegalPlays(s.hands[seatId], s.ledSuit)).toContain(payload.cardId)

    const currentHand = [...s.currentHand, { playerId: seatId, card: payload.cardId }]
    const ledSuit = s.ledSuit ?? parseCard(payload.cardId).suit
    const hands = { ...s.hands, [seatId]: removeCardFromHand(s.hands[seatId], payload.cardId) }
    if (currentHand.length === s.turnOrder.length) {
      const winner = resolveTrick(currentHand, ledSuit, trumpOf(s))
      expect(getBotTurns({ ...s, hands, currentHand, handWinnerId: winner }, [])).toEqual([])
      s = { ...s, hands, currentHand: [], ledSuit: null, currentIdx: s.turnOrder.indexOf(winner), handsWon: { ...s.handsWon, [winner]: s.handsWon[winner] + 1 } }
    } else {
      s = { ...s, hands, currentHand, ledSuit, currentIdx: (s.currentIdx + 1) % s.turnOrder.length }
    }
  }
  return s
}
