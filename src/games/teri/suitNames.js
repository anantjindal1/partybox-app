import { SUIT_NAME_KEY } from '../../i18n/strings'

/**
 * Teri's bid phrase: "7 in Diamond" in English, "ईंट में सात" in Hindi —
 * the words players actually use at a Hindi-speaking table.
 */
export function formatBid(number, suit, t) {
  return t('tBidPhrase', { suit: t(SUIT_NAME_KEY[suit]), number: t(`num${number}`) })
}
