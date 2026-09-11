export default {
  slug: 'teen-do-paanch',
  title: { en: '3-2-5 (Teen Do Paanch)', hi: 'तीन दो पांच' },
  minPlayers: 3,
  maxPlayers: 3,
  noAutoClose: true,
  onlineBadge: { id: 'teenDoPaanchAce' },
  rules: {
    en: [
      'A reduced 30-card deck — 10 cards dealt to each of the 3 players.',
      'Every hand, each player is assigned a fixed target: one must win exactly 3 tricks, one exactly 2, one exactly 5. Targets rotate hand to hand.',
      'The player targeting 5 sees their first 5 cards and calls trump — a suit, and whether to declare it or keep it hidden.',
      "Hidden trump is revealed only when a player who can't follow suit asks for it — then they can play a trump card to try to win the trick.",
      'Score = tricks won minus your target — can be positive or negative. First to 10 cumulative points wins the match.'
    ],
    hi: [
      'घटाया हुआ 30 पत्तों का डेक — 3 खिलाड़ियों में से हर एक को 10 पत्ते मिलते हैं।',
      'हर हाथ में, हर खिलाड़ी को एक तय लक्ष्य मिलता है: किसी को ठीक 3 चालें जीतनी हैं, किसी को 2, किसी को 5। लक्ष्य हर हाथ में बदलते रहते हैं।',
      '5 का लक्ष्य पाने वाला खिलाड़ी अपने पहले 5 पत्ते देखकर ट्रंप बुलाता है — एक सूट, और यह तय करता है कि सबको बताना है या छुपाना है।',
      'छुपा हुआ ट्रंप तभी खुलता है जब कोई खिलाड़ी सूट फॉलो न कर पाए और ट्रंप खुलवाने को कहे — फिर वो चाल जीतने के लिए ट्रंप पत्ता खेल सकता है।',
      'स्कोर = जीती हुई चालें घटा आपका लक्ष्य — यह पॉज़िटिव या नेगेटिव हो सकता है। सबसे पहले 10 कुल अंक पाने वाला खेल जीतता है।'
    ]
  },
  tutorial: {
    en: [
      { title: 'Everyone Has a Target', body: "Each hand, the three players are assigned fixed targets — 3, 2, and 5 tricks. Nobody chooses their number, and it rotates to a different seat every hand." },
      { title: 'Two-Stage Deal', body: 'You get 5 cards first. Whoever is targeting 5 this hand looks at their 5 and calls trump — picking a suit and choosing to declare it openly or keep it hidden. Then everyone gets their remaining 5 cards.' },
      { title: "Hidden Trump? Ask to Reveal", body: "If trump is hidden and you can't follow the led suit, you can ask for it to be revealed. Once revealed, everyone knows it for the rest of the hand, and you can play a trump card to try to win the trick." },
      { title: 'Score = Tricks Won Minus Your Target', body: 'Beat your target and you score positive; fall short and you go negative. Scores add up hand after hand — first player to reach 10 cumulative points wins the match.' }
    ],
    hi: [
      { title: 'हर किसी का एक लक्ष्य है', body: 'हर हाथ में, तीनों खिलाड़ियों को तय लक्ष्य मिलते हैं — 3, 2, और 5 चालें। कोई अपना नंबर खुद नहीं चुनता, और हर हाथ में यह अलग सीट पर चला जाता है।' },
      { title: 'दो चरणों में बंटवारा', body: 'पहले आपको 5 पत्ते मिलते हैं। जिसका इस हाथ में 5 का लक्ष्य है, वो अपने 5 पत्ते देखकर ट्रंप बुलाता है — एक सूट चुनकर, और यह तय करके कि सबको खुलकर बताना है या छुपाना है। फिर सबको बचे हुए 5 पत्ते मिलते हैं।' },
      { title: 'ट्रंप छुपा है? खुलवाने को कहें', body: 'अगर ट्रंप छुपा है और आप चली गई सूट फॉलो नहीं कर पा रहे, तो आप उसे खुलवाने को कह सकते हैं। खुलने के बाद, बाकी हाथ के लिए सब जान जाते हैं, और आप चाल जीतने के लिए ट्रंप पत्ता खेल सकते हैं।' },
      { title: 'स्कोर = जीती चालें घटा आपका लक्ष्य', body: 'अपने लक्ष्य से ज़्यादा जीतें तो पॉज़िटिव स्कोर मिलता है; कम रह जाएं तो नेगेटिव। स्कोर हर हाथ के बाद जुड़ते जाते हैं — सबसे पहले 10 कुल अंक पाने वाला खेल जीतता है।' }
    ]
  }
}
