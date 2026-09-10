export default {
  slug: 'bluff',
  title: { en: 'Bluff', hi: 'ब्लफ' },
  minPlayers: 3,
  maxPlayers: 6,
  noAutoClose: true,
  onlineBadge: { id: 'masterBluffer', emoji: '🎭' },
  rules: {
    en: [
      'One player opens a round by playing 1–4 cards and naming a rank.',
      'Others can Pass, Add more cards of the same rank, or Call Bluff on the latest play.',
      'Wrong bluff call → the whole pile goes to the bluffer. Right call → it goes to you.',
      'Empty your hand first to win!'
    ],
    hi: [
      'एक खिलाड़ी 1-4 पत्ते खोलकर एक नंबर का दावा करता है।',
      'बाकी लोग पास कर सकते हैं, उसी नंबर के और पत्ते जोड़ सकते हैं, या ब्लफ पकड़ सकते हैं।',
      'गलत ब्लफ पकड़ी तो पूरा ढेर आपको मिलेगा। सही पकड़ी तो ढेर बकवास करने वाले को।',
      'सबसे पहले पत्ते खत्म करने वाला जीतता है!'
    ]
  },
  tutorial: {
    en: [
      { title: 'Claim a Rank', body: 'Play 1-4 cards face-down and declare what rank they are — but you can lie!' },
      { title: 'Pass, Add, or Call Bluff', body: 'On your turn, add more cards of the same claimed rank, pass, or call bluff on the last play.' },
      { title: 'Win by Emptying Your Hand', body: 'Get caught bluffing, or wrongly accuse someone, and you inherit the whole pile. First to run out of cards wins.' }
    ],
    hi: [
      { title: 'नंबर का दावा करें', body: '1-4 पत्ते नीचे की तरफ खोलें और बताएं कि वो किस नंबर के हैं — लेकिन झूठ भी बोल सकते हैं!' },
      { title: 'पास करें, जोड़ें, या ब्लफ पकड़ें', body: 'अपनी बारी पर, उसी दावा किए नंबर के और पत्ते जोड़ें, पास करें, या पिछली चाल पर ब्लफ पकड़ें।' },
      { title: 'पत्ते खत्म करके जीतें', body: 'ब्लफ पकड़े जाने पर या गलत आरोप लगाने पर, पूरा ढेर आपके हाथ में आ जाता है। सबसे पहले पत्ते खत्म करने वाला जीतता है।' }
    ]
  }
}
