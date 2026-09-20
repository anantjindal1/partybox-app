export default {
  slug: 'bhabhi',
  hidePlayerListInGame: true,
  lobbySeatCircle: true,
  title: { en: 'Bhabhi', hi: 'भाभी' },
  minPlayers: 3,
  maxPlayers: 6,
  noAutoClose: true,
  onlineBadge: { id: 'greatEscape' },
  rules: {
    en: [
      'The whole deck is dealt out. Whoever holds the Ace of Spades opens the game by playing it.',
      "Follow the suit that was led if you can — any card of that suit. Can't follow? Play anything.",
      'If everyone follows suit, the pile is discarded and the highest card of the led suit leads next.',
      "If you can't follow suit, play stops instantly — whoever played the highest card of the led suit must pick up the WHOLE pile into their own hand, then leads next.",
      'The first player to get rid of all their cards wins, and the game ends right there.'
    ],
    hi: [
      'पूरा पत्तों का सेट बाँट दिया जाता है। जिसके पास हुकुम का इक्का है, वह उसे खेलकर खेल शुरू करता है।',
      'जो सूट चली गई है, अगर आपके पास हो तो वही सूट खेलना ज़रूरी है — उस सूट का कोई भी पत्ता। नहीं है तो कोई भी पत्ता खेल सकते हैं।',
      'अगर सबने सूट फॉलो की, तो ढेर हटा दिया जाता है और चली गई सूट का सबसे बड़ा पत्ता अगली चाल शुरू करता है।',
      'अगर आप सूट फॉलो नहीं कर पाए, तो खेल तुरंत रुक जाता है — चली गई सूट का सबसे बड़ा पत्ता खेलने वाले को पूरा ढेर अपने हाथ में उठाना पड़ता है, और वही अगली चाल शुरू करता है।',
      'जो खिलाड़ी सबसे पहले अपने सारे पत्ते खत्म कर देता है, वह जीत जाता है और खेल वहीं खत्म हो जाता है।'
    ]
  },
  tutorial: {
    en: [
      { title: 'Ace of Spades Opens', body: 'The whole deck is dealt out completely. Whoever holds the Ace of Spades plays it to start the very first pile.' },
      { title: 'Follow Suit or Get Stuck', body: "Must follow the led suit if you have it — any card of that suit works, no need to beat what's down. No card of that suit? You can play anything, but it's risky." },
      { title: 'Discard or Pick Up', body: 'If everyone follows suit, the whole pile is simply discarded — free cards gone for good. But if anyone breaks suit, play stops instantly and the highest card of the led suit has to pick up the ENTIRE pile into their own hand.' },
      { title: 'First One Out Wins', body: "The goal is to get rid of every card. The moment anyone's hand is empty, they win and the game ends immediately." }
    ],
    hi: [
      { title: 'हुकुम का इक्का शुरुआत करता है', body: 'पूरा पत्तों का सेट पूरी तरह बाँट दिया जाता है। जिसके पास हुकुम का इक्का है, वह उसे खेलकर सबसे पहला ढेर शुरू करता है।' },
      { title: 'सूट फॉलो करें या फंसें', body: 'चली गई सूट अगर आपके पास है तो वह खेलना ज़रूरी है — उस सूट का कोई भी पत्ता चलेगा, किसी को हराने की ज़रूरत नहीं। वह सूट नहीं है? कोई भी पत्ता खेल सकते हैं, पर यह जोखिम भरा है।' },
      { title: 'ढेर हटेगा या उठाना पड़ेगा', body: 'अगर सबने सूट फॉलो की, तो पूरा ढेर बस हटा दिया जाता है — पत्ते हमेशा के लिए गए। लेकिन अगर किसी ने सूट तोड़ी, तो खेल तुरंत रुक जाता है और चली गई सूट का सबसे बड़ा पत्ता खेलने वाले को पूरा ढेर अपने हाथ में उठाना पड़ता है।' },
      { title: 'सबसे पहले खत्म करने वाला जीतता है', body: 'लक्ष्य है अपने सारे पत्ते खत्म करना। जैसे ही किसी के पत्ते खत्म होते हैं, वह जीत जाता है और खेल तुरंत खत्म हो जाता है।' }
    ]
  }
}
