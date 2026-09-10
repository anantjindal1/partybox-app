export default {
  slug: 'bhabhi',
  title: { en: 'Bhabhi', hi: 'भाभी' },
  minPlayers: 3,
  maxPlayers: 6,
  noAutoClose: true,
  onlineBadge: { id: 'greatEscape' },
  rules: {
    en: [
      'Follow the suit that was led if you can.',
      "Can't follow? Play any card.",
      'Highest card of the led suit wins the trick — the cards are then discarded.',
      'Trick winner leads the next one. First to empty your hand wins immediately!'
    ],
    hi: [
      'जो सूट चली गई है, अगर आपके पास हो तो वही सूट खेलना ज़रूरी है।',
      'नहीं है तो कोई भी पत्ता खेल सकते हैं।',
      'चली गई सूट का सबसे बड़ा पत्ता चाल जीतता है — पत्ते फिर हटा दिए जाते हैं।',
      'चाल जीतने वाला अगली चाल शुरू करता है। सबसे पहले पत्ते खत्म करने वाला तुरंत जीत जाता है!'
    ]
  },
  tutorial: {
    en: [
      { title: 'Follow the Suit', body: 'Each trick starts with a led suit. Follow it if you can.' },
      { title: "Can't Follow? Dump It", body: "No card of that suit? Play anything — it's your chance to get rid of a stuck card." },
      { title: 'Empty Your Hand to Win', body: 'Highest card of the led suit wins the trick (cards are discarded, not kept). The moment your hand is empty, you win — game over!' }
    ],
    hi: [
      { title: 'सूट को फॉलो करें', body: 'हर चाल में एक सूट चलाई जाती है। अगर आपके पास वो सूट है, तो वही खेलना ज़रूरी है।' },
      { title: 'सूट नहीं है? कोई भी पत्ता फेंकें', body: 'अगर आपके पास वो सूट नहीं है, तो कोई भी पत्ता खेल सकते हैं — यही मौका है किसी फंसे हुए पत्ते से छुटकारा पाने का।' },
      { title: 'पत्ते खत्म करके जीतें', body: 'चली गई सूट का सबसे बड़ा पत्ता चाल जीतता है (पत्ते हटा दिए जाते हैं, किसी के हाथ में नहीं आते)। जैसे ही आपके पत्ते खत्म होते हैं, आप जीत जाते हैं — खेल वहीं खत्म!' }
    ]
  }
}
