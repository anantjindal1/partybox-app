export default {
  slug: 'satti',
  title: { en: 'Satti (Sevens)', hi: 'सत्ती (सेवन्स)' },
  minPlayers: 4,
  maxPlayers: 8,
  noAutoClose: true,
  onlineBadge: { id: 'sevenMaster' },
  rules: {
    en: [
      'The whole deck is dealt out — some players may hold one extra card.',
      'Play a 7 of any suit to open it, then build up (8, 9, 10...K) or down (6, 5, 4...A) from it.',
      "No legal card to play? You pass — turn moves on.",
      'First to empty your hand wins immediately.',
      "If everyone passes in a row with no play in between, whoever holds the fewest cards wins."
    ],
    hi: [
      'पूरा डेक बांटा जाता है — कुछ खिलाड़ियों के पास एक पत्ता ज़्यादा हो सकता है।',
      'किसी भी सूट का 7 खेलकर उसे खोलें, फिर ऊपर (8, 9, 10...K) या नीचे (6, 5, 4...A) बढ़ाएं।',
      'खेलने लायक पत्ता नहीं है? पास करें — बारी आगे बढ़ जाती है।',
      'सबसे पहले पत्ते खत्म करने वाला तुरंत जीत जाता है।',
      'अगर सब लगातार पास कर दें बिना किसी चाल के, तो सबसे कम पत्तों वाला जीतता है।'
    ]
  },
  tutorial: {
    en: [
      { title: 'Open With a Seven', body: 'Each suit starts with its own 7. Play it whenever you hold it — it opens that suit for building.' },
      { title: 'Build Up or Down', body: 'Once a suit is open, extend it either way: up toward the King, or down toward the Ace. Any card that fits either end is fair game.' },
      { title: 'No Move? Pass', body: "If none of your cards can play anywhere, you pass and the turn moves to the next player." },
      { title: 'Empty Your Hand to Win', body: 'The moment your hand is empty, you win — game over immediately. If everyone gets stuck passing in a row, whoever holds the fewest cards wins instead.' }
    ],
    hi: [
      { title: '7 से शुरुआत करें', body: 'हर सूट अपने 7 से शुरू होती है। जब भी आपके पास हो, खेल दें — इससे वो सूट बनना शुरू हो जाती है।' },
      { title: 'ऊपर या नीचे बढ़ाएं', body: 'सूट खुलने के बाद, उसे किसी भी तरफ बढ़ा सकते हैं: King की तरफ ऊपर, या Ace की तरफ नीचे। जो भी पत्ता किसी भी छोर पर फिट हो, खेल सकते हैं।' },
      { title: 'चाल नहीं है? पास करें', body: 'अगर आपका कोई पत्ता कहीं फिट नहीं होता, तो पास करें और बारी अगले खिलाड़ी की हो जाती है।' },
      { title: 'पत्ते खत्म करके जीतें', body: 'जैसे ही आपके पत्ते खत्म होते हैं, आप जीत जाते हैं — खेल तुरंत खत्म। अगर सब लगातार पास कर दें, तो सबसे कम पत्तों वाला जीतता है।' }
    ]
  }
}
