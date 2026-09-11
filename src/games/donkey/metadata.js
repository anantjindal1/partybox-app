export default {
  slug: 'donkey',
  title: { en: 'Donkey (Gadha)', hi: 'गधा' },
  minPlayers: 3,
  maxPlayers: 8,
  noAutoClose: true,
  onlineBadge: { id: 'donkeySurvivor' },
  rules: {
    en: [
      'Every player always holds exactly 4 cards.',
      'Each round, you have a few seconds to pick one card to pass on — everyone passes at the same time.',
      "The instant anyone collects four of a kind, it's spotted automatically and a subtle signal appears on their seat.",
      'Everyone else races to tap "Copy the Signal!" — whoever taps last (or never taps) gets the next letter of D-O-N-K-E-Y.',
      'Spell the whole word and you\'re out. Last player standing wins.'
    ],
    hi: [
      'हर खिलाड़ी के पास हमेशा ठीक 4 पत्ते होते हैं।',
      'हर राउंड में, आपके पास एक पत्ता आगे बढ़ाने के लिए कुछ सेकंड होते हैं — सब एक साथ पत्ता बढ़ाते हैं।',
      'जैसे ही कोई चार एक जैसे पत्ते जमा कर ले, यह अपने आप पता चल जाता है और उसकी सीट पर हल्का सा इशारा दिखता है।',
      'बाकी सब "इशारा कॉपी करें!" दबाने की दौड़ लगाते हैं — जो आखिर में दबाए (या बिल्कुल न दबाए) उसे D-O-N-K-E-Y का अगला अक्षर मिलता है।',
      'पूरा शब्द बन जाए तो आप बाहर। आखिर तक बचा खिलाड़ी जीतता है।'
    ]
  },
  tutorial: {
    en: [
      { title: 'Always 4 Cards', body: 'Every round starts with everyone holding exactly 4 cards, dealt fresh from a deck sized just for your table.' },
      { title: 'Pass, Fast', body: "Each round, quickly pick one card you don't want and pass it on. Everyone passes at the same moment — no waiting your turn." },
      { title: 'Four of a Kind? It Shows', body: "The moment your hand becomes four of a kind, a subtle cue appears on your seat automatically. You don't have to do anything — just wait." },
      { title: "Copy the Signal — Don't Be Last!", body: 'Everyone else has to notice and tap "Copy the Signal!" as fast as possible. Whoever\'s last — or never taps — earns the next letter toward D-O-N-K-E-Y. Spell it out fully and you\'re eliminated.' }
    ],
    hi: [
      { title: 'हमेशा 4 पत्ते', body: 'हर राउंड की शुरुआत में सबके पास ठीक 4 पत्ते होते हैं, आपकी मेज़ के हिसाब से बनाए गए डेक से ताज़ा बंटे हुए।' },
      { title: 'तेज़ी से आगे बढ़ाएं', body: 'हर राउंड में, जो पत्ता आपको नहीं चाहिए उसे जल्दी चुनकर आगे बढ़ा दें। सब एक ही पल में आगे बढ़ाते हैं — बारी का इंतज़ार नहीं करना।' },
      { title: 'चार एक जैसे पत्ते? दिख जाएगा', body: 'जैसे ही आपके पत्ते चार एक जैसे हो जाएं, आपकी सीट पर अपने आप हल्का सा इशारा दिख जाता है। आपको कुछ नहीं करना — बस इंतज़ार करें।' },
      { title: 'इशारा कॉपी करें — आखिर में मत रहिए!', body: 'बाकी सबको नोटिस करके जल्दी से "इशारा कॉपी करें!" दबाना है। जो आखिर में दबाए — या बिल्कुल न दबाए — उसे D-O-N-K-E-Y का अगला अक्षर मिलता है। पूरा शब्द बना तो आप बाहर।' }
    ]
  }
}
