export default {
  slug: 'court-piece',
  title: { en: 'Court Piece (Rang)', hi: 'कोर्ट पीस (रंग)' },
  minPlayers: 4,
  maxPlayers: 4,
  noAutoClose: true,
  onlineBadge: { id: 'kotMaster' },
  rules: {
    en: [
      'Exactly 4 players in 2 fixed partnerships — you and the player seated opposite you are partners.',
      "Each hand, you're dealt 5 cards first. The caller looks at just those 5 and calls trump — then everyone gets their remaining 8 cards.",
      "All 13 tricks are always played. Your tricks and your partner's combine into your team's total.",
      'Sweep all 13 tricks (a Kot) and your team scores 2 match points; win any other split (7-12) and you score 1.',
      "First team to 7 match points wins — UNLESS you reach 7 while the other team has won zero hands. Then the match continues until you reach 13, or they win their first hand."
    ],
    hi: [
      'ठीक 4 खिलाड़ी, 2 पक्की जोड़ियों में — आपके सामने बैठा खिलाड़ी आपका साथी है।',
      'हर हाथ में पहले 5 पत्ते बंटते हैं। बुलाने वाला सिर्फ वही 5 पत्ते देखकर तुरुप बोलता है — फिर बाकी 8 पत्ते सबको मिलते हैं।',
      'सभी 13 चालें हमेशा खेली जाती हैं। आपकी और आपके साथी की चालें मिलकर आपकी टीम का कुल स्कोर बनती हैं।',
      'सभी 13 चालें जीतें (कोट) तो टीम को 2 मैच अंक मिलते हैं; कोई भी और जीत (7-12) होने पर 1 अंक मिलता है।',
      'सबसे पहले 7 मैच अंक तक पहुंचने वाली टीम जीतती है — जब तक कि दूसरी टीम ने एक भी हाथ न जीता हो। ऐसे में मैच तब तक चलता है जब तक आप 13 तक न पहुंचें, या वे अपना पहला हाथ न जीत लें।'
    ]
  },
  tutorial: {
    en: [
      { title: 'Fixed Partnerships', body: "You always play with the player sitting opposite you — there's no choosing or changing partners mid-match. Every trick either of you wins counts toward your shared team total." },
      { title: 'Two-Stage Deal', body: 'Each hand starts with just 5 cards dealt to everyone. The caller — whoever won the last hand, or seat 1 for the very first hand — looks at only those 5 cards and names the trump suit. Only then does everyone get their remaining 8 cards, for 13 total.' },
      { title: 'Always All 13 Tricks', body: 'Unlike some trick games, play never stops early — every hand runs the full 13 tricks. Since 13 is odd, one team always ends up with at least 7 tricks.' },
      { title: 'Kot or Not, Race to 7', body: 'Win all 13 tricks in a hand (a Kot) and your team scores 2 match points. Any other winning split scores 1. First team to reach 7 match points wins the whole match.' },
      { title: "Don't Let It End on a Shutout", body: "If your team reaches 7 points while the other team hasn't won a single hand yet, the match doesn't end there — it keeps going until either you sweep to 13, or they finally win one hand and confirm your win." }
    ],
    hi: [
      { title: 'पक्की जोड़ियां', body: 'आप हमेशा अपने सामने बैठे खिलाड़ी के साथ खेलते हैं — मैच के बीच में साथी बदलना या चुनना संभव नहीं है। आप दोनों में से कोई भी जो चाल जीते, वह आपकी साझा टीम के कुल स्कोर में जुड़ती है।' },
      { title: 'दो चरणों में पत्ते बंटना', body: 'हर हाथ की शुरुआत में सबको सिर्फ 5 पत्ते मिलते हैं। बुलाने वाला — पिछला हाथ जीतने वाला, या पहले हाथ में सीट 1 — सिर्फ वही 5 पत्ते देखकर तुरुप सूट बताता है। उसके बाद ही सबको बाकी 8 पत्ते मिलते हैं, कुल 13।' },
      { title: 'हमेशा सभी 13 चालें', body: 'कुछ और ताश खेलों के उलट, यहां खेल बीच में नहीं रुकता — हर हाथ में पूरी 13 चालें खेली जाती हैं। 13 विषम संख्या होने से, एक टीम हमेशा कम से कम 7 चालें जीतती है।' },
      { title: 'कोट या सामान्य जीत, लक्ष्य 7 अंक', body: 'किसी हाथ की सभी 13 चालें जीतें (कोट) तो टीम को 2 मैच अंक मिलते हैं। कोई भी और जीतने वाला बंटवारा 1 अंक देता है। सबसे पहले 7 मैच अंक तक पहुंचने वाली टीम पूरा मैच जीतती है।' },
      { title: 'सूखी जीत पर मैच खत्म नहीं होता', body: 'अगर आपकी टीम 7 अंक तक पहुंच जाए जबकि दूसरी टीम ने अभी तक एक भी हाथ नहीं जीता, तो मैच वहीं खत्म नहीं होता — यह तब तक चलता है जब तक आप 13 तक न पहुंच जाएं, या वे आखिरकार एक हाथ जीतकर आपकी जीत पक्की न कर दें।' }
    ]
  }
}
