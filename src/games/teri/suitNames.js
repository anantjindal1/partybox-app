/**
 * Hindi card-game terms for Teri's bidding UI — the words players
 * actually use at the table, not a literal translation of "spades" etc.
 */
export const SUIT_NAME_HI = {
  spades: 'Hukum',
  hearts: 'Paan',
  diamonds: 'Eent',
  clubs: 'Chidi'
}

const NUMBER_NAME_HI = {
  7: 'Saat',
  8: 'Aath',
  9: 'Nau',
  10: 'Dus',
  11: 'Gyarah',
  12: 'Baarah',
  13: 'Terah'
}

export function formatBidHi(number, suit) {
  return `${SUIT_NAME_HI[suit] ?? suit} mein ${NUMBER_NAME_HI[number] ?? number}`
}
