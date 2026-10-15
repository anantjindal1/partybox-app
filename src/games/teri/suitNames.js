/**
 * Hindi card-game terms for Teri's bidding UI — the words players
 * actually use at the table, not a literal translation of "spades" etc.
 * English mode shows them in Roman script ("Hukum mein Saat"), Hindi mode
 * in Devanagari ("हुकुम में सात").
 */
export const BID_SUIT_KEY = {
  spades: 'bidSuitSpades',
  hearts: 'bidSuitHearts',
  diamonds: 'bidSuitDiamonds',
  clubs: 'bidSuitClubs'
}

export function formatBid(number, suit, t) {
  return t('tBidPhrase', { suit: t(BID_SUIT_KEY[suit]), number: t(`num${number}`) })
}
