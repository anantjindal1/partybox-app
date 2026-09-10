export default {
  slug: 'call-break',
  title: { en: 'Call Break', hi: 'कॉल ब्रेक' },
  minPlayers: 4,
  maxPlayers: 4,
  noAutoClose: true,
  onlineBadge: { id: 'trumpMaster' },
  rules: {
    en: [
      'Spades are always trump.',
      "Bid how many tricks you'll win each round (1-13) before anyone plays.",
      'Meet or beat your bid to score; fall short and you lose points equal to your bid.',
      '5 rounds — highest total score wins.'
    ],
    hi: [
      'हुकुम (स्पेड) हमेशा तुरुप होता है।',
      'हर राउंड से पहले बताएं कि आप कितनी चालें जीतेंगे (1-13)।',
      'अपना अनुमान पूरा करें तो अंक मिलेंगे, कम पड़े तो उतने ही अंक कट जाएंगे।',
      '5 राउंड बाद सबसे ज़्यादा अंक वाला जीतता है।'
    ]
  },
  tutorial: {
    en: [
      { title: 'Bid Your Tricks', body: "Before each round, secretly bid how many of the 13 tricks you think you'll win." },
      { title: 'Spades Are Always Trump', body: "Follow the led suit if you can. Can't follow? A spade beats everything else, no matter the rank." },
      { title: 'Score by Hitting Your Bid', body: 'Make your bid (or beat it) to score points. Fall short, and you lose points equal to your bid. Best total after 5 rounds wins.' }
    ],
    hi: [
      { title: 'अपनी चालों का अनुमान लगाएं', body: 'हर राउंड से पहले, गुप्त रूप से बताएं कि आप 13 में से कितनी चालें जीतेंगे।' },
      { title: 'हुकुम हमेशा तुरुप', body: 'चली गई सूट को फॉलो करें अगर आपके पास हो। नहीं है तो हुकुम (स्पेड) किसी भी और सूट के पत्ते को हरा देता है, चाहे उसका नंबर कुछ भी हो।' },
      { title: 'अनुमान पूरा करके अंक कमाएं', body: 'अपना अनुमान पूरा करें (या उससे ज़्यादा) तो अंक मिलेंगे। कम पड़े तो उतने ही अंक कट जाएंगे। 5 राउंड बाद सबसे ज़्यादा अंक वाला जीतता है।' }
    ]
  }
}
