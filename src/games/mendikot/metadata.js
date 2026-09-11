export default {
  slug: 'mendikot',
  title: { en: 'Mendikot (Mindi)', hi: 'मेंडीकोट (मिंडी)' },
  minPlayers: 4,
  maxPlayers: 4,
  noAutoClose: true,
  onlineBadge: { id: 'mendikotSweep' },
  rules: {
    en: [
      'Fixed partnerships — players sitting opposite each other are partners.',
      'No trump. Follow the led suit if you can — highest card of that suit wins the trick.',
      'All 13 tricks are always played.',
      'The four 10s are everything — capture all four for a Mendikot and win outright.',
      "Otherwise, whoever captured more 10s wins. A 2-2 split is broken by who won more tricks."
    ],
    hi: [
      'पक्की जोड़ियां — आमने-सामने बैठे खिलाड़ी साथी होते हैं।',
      'कोई ट्रंप नहीं। चली गई सूट को फॉलो करें अगर हो तो — उस सूट का सबसे बड़ा पत्ता चाल जीतता है।',
      'सभी 13 चालें हमेशा खेली जाती हैं।',
      'चारों 10 सबसे अहम हैं — सभी चारों जीतकर मेंडीकोट बनाएं और सीधे जीतें।',
      'नहीं तो, जिसने ज़्यादा 10 जीते वो टीम जीतती है। 2-2 बराबरी होने पर ज़्यादा चालें जीतने वाली टीम जीतती है।'
    ]
  },
  tutorial: {
    en: [
      { title: 'Partners Across the Table', body: 'You and the player opposite you are a team. No calling, no bidding — just follow suit and play.' },
      { title: 'No Trump, Just Suit', body: 'There is no trump suit at all. Follow the led suit if you can; if not, play anything. Highest card of the led suit always wins the trick.' },
      { title: 'The Four 10s Decide Everything', body: 'Forget trick count — what matters is who captures the four 10s. Land all four and your team wins instantly, a Mendikot.' },
      { title: 'Otherwise, Count the 10s', body: 'No clean sweep? Whoever captured more of the four 10s wins. If it\'s split 2-2, whoever won more tricks overall takes it.' }
    ],
    hi: [
      { title: 'मेज़ के आर-पार साथी', body: 'आप और आपके सामने बैठा खिलाड़ी एक टीम हैं। कोई कॉल नहीं, कोई बोली नहीं — बस सूट फॉलो करें और खेलें।' },
      { title: 'कोई ट्रंप नहीं, सिर्फ सूट', body: 'कोई ट्रंप सूट नहीं है। चली गई सूट को फॉलो करें अगर हो तो; नहीं तो कुछ भी खेलें। चली गई सूट का सबसे बड़ा पत्ता हमेशा चाल जीतता है।' },
      { title: 'चारों 10 ही सब कुछ हैं', body: 'चालों की गिनती भूल जाइए — असली बात यह है कि चारों 10 किसने जीते। सभी चारों जीत लें तो आपकी टीम तुरंत जीत जाती है — मेंडीकोट।' },
      { title: 'नहीं तो, 10 गिनें', body: 'सीधी जीत नहीं हुई? जिसने ज़्यादा 10 जीते वो टीम जीतती है। अगर 2-2 बराबरी है, तो जिसने ज़्यादा चालें जीतीं वो टीम जीतती है।' }
    ]
  }
}
