import { getBotTurns } from '../bot'
import { createDeck, shuffleDeck, parseCard } from '../../../multiplayer/deck'
import { dealAll } from '../../../multiplayer/deal'
import { resolveTrick, getLegalPlays } from '../../../multiplayer/trick'
import { removeCardFromHand, addCardsToHand } from '../../../multiplayer/hand'
import { findAceOfSpadesHolder, breaksSuit, rotateActiveFrom } from '../bhabhiLogic'

const ORDER = ['bot_a', 'bot_b', 'bot_c', 'bot_d']

// Mirrors the host's applyPlay; returns the winner or null if capped.
function playGame(difficulty) {
  const { hands } = dealAll(shuffleDeck(createDeck()), ORDER)
  let s = { phase: 'playing', seatingOrder: ORDER, hands, pile: [], pileIdx: 0, ledSuit: null, isFirstRound: true }
  s.pileParticipants = rotateActiveFrom(ORDER, ORDER, findAceOfSpadesHolder(hands, ORDER))
  const lastKey = {}
  for (let n = 0; n < 3000; n++) {
    const [turn] = getBotTurns(s)
    const actor = s.pileParticipants[s.pileIdx]
    expect(turn.botId).toBe(actor)
    expect(lastKey[actor]).not.toBe(turn.key)
    lastKey[actor] = turn.key
    const { cardId } = turn.act(difficulty).payload
    const legal = s.isFirstRound && s.pile.length === 0 ? ['AS'] : getLegalPlays(s.hands[actor], s.ledSuit)
    expect(legal).toContain(cardId)

    const hand = removeCardFromHand(s.hands[actor], cardId)
    const newHands = { ...s.hands, [actor]: hand }
    if (hand.length === 0) return actor
    const pile = [...s.pile, { playerId: actor, card: cardId }]
    const ledSuit = s.ledSuit ?? parseCard(cardId).suit
    const broke = breaksSuit(cardId, s.ledSuit, s.isFirstRound)
    if (!broke && pile.length < s.pileParticipants.length) {
      s = { ...s, hands: newHands, pile, ledSuit, pileIdx: s.pileIdx + 1 }
      continue
    }
    const high = resolveTrick(pile, ledSuit, null)
    expect(getBotTurns({ ...s, pileResult: { outcome: 'x' } })).toEqual([])
    const finalHands = broke ? { ...newHands, [high]: addCardsToHand(newHands[high], pile.map(p => p.card)) } : newHands
    s = { ...s, hands: finalHands, pile: [], pileParticipants: rotateActiveFrom(ORDER, ORDER, high), pileIdx: 0, ledSuit: null, isFirstRound: false }
  }
  return null
}

describe('Bhabhi bots', () => {
  test.each(['easy', 'medium', 'hard'])('%s bots only make legal plays', difficulty => {
    let finished = 0
    for (let i = 0; i < 20; i++) if (playGame(difficulty)) finished++
    expect(finished).toBeGreaterThan(0)
  })
})
