import { getBotTurns } from '../bot'
import { createDeck, shuffleDeck, parseCard } from '../../../multiplayer/deck'
import { dealCards } from '../../../multiplayer/deal'
import { resolveTrick, getLegalPlays } from '../../../multiplayer/trick'
import { removeCardFromHand } from '../../../multiplayer/hand'
import { computeTeamHands } from '../courtPieceLogic'

const ORDER = ['bot_a', 'bot_b', 'bot_c', 'bot_d']

// Plays one full round driven only by getBotTurns, the way the host's
// effects would, and checks every move is legal.
function playRound(difficulty) {
  const { hands: first, remaining } = dealCards(shuffleDeck(createDeck()), ORDER, 5)
  let state = { phase: 'calling_trump', turnOrder: ORDER, roundNumber: 1, callerId: ORDER[0], hands: first }

  const [call] = getBotTurns(state)
  expect(call.botId).toBe(ORDER[0])
  const { type, payload } = call.act(difficulty)
  expect(type).toBe('CALL_TRUMP')
  expect(first[ORDER[0]].map(c => parseCard(c).suit)).toContain(payload.suit)

  const { hands: second } = dealCards(remaining, ORDER, 8)
  state = {
    ...state,
    phase: 'playing',
    trumpSuit: payload.suit,
    hands: Object.fromEntries(ORDER.map(id => [id, [...first[id], ...second[id]]])),
    currentIdx: 0,
    currentHand: [],
    ledSuit: null
  }
  const won = Object.fromEntries(ORDER.map(id => [id, 0]))
  const keys = new Set()

  for (let n = 0; n < 52; n++) {
    const [turn] = getBotTurns(state)
    expect(keys.has(`${turn.botId}|${turn.key}`)).toBe(false)
    keys.add(`${turn.botId}|${turn.key}`)
    const { cardId } = turn.act(difficulty).payload
    expect(getLegalPlays(state.hands[turn.botId], state.ledSuit)).toContain(cardId)

    const currentHand = [...state.currentHand, { playerId: turn.botId, card: cardId }]
    const ledSuit = state.ledSuit ?? parseCard(cardId).suit
    const hands = { ...state.hands, [turn.botId]: removeCardFromHand(state.hands[turn.botId], cardId) }
    if (currentHand.length === 4) {
      const winner = resolveTrick(currentHand, ledSuit, state.trumpSuit)
      won[winner]++
      expect(getBotTurns({ ...state, hands, currentHand, handWinnerId: winner })).toEqual([])
      state = { ...state, hands, currentHand: [], ledSuit: null, currentIdx: ORDER.indexOf(winner) }
    } else {
      state = { ...state, hands, currentHand, ledSuit, currentIdx: (state.currentIdx + 1) % 4 }
    }
  }
  const teams = computeTeamHands(ORDER, won)
  expect(teams.teamA + teams.teamB).toBe(13)
}

describe('Court Piece bots', () => {
  test.each(['easy', 'medium', 'hard'])('%s bots play a full legal round', difficulty => {
    for (let i = 0; i < 10; i++) playRound(difficulty)
  })
})
