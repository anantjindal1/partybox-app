export default {
  slug: 'judgement',
  title: { en: 'Judgement (Kachuful)', hi: 'जजमेंट (कचुफुल)' },
  minPlayers: 3,
  maxPlayers: 9,
  noAutoClose: true,
  onlineBadge: { id: 'exactCall' },
  rules: {
    en: [
      'Hands start at 1 card and grow each round up to the max, then shrink back down to 1.',
      "Bid how many tricks you'll take this round — before anyone knows the trump suit.",
      'Whoever bids the highest number chooses trump for the round and leads the first trick.',
      "Last to bid can't choose the exact number that would make everyone's bids add up to the hand size.",
      'Hit your bid exactly to score 10x your bid (minimum 10) — miss it by over OR under and you lose the same amount instead.'
    ],
    hi: [
      'हाथ 1 पत्ते से शुरू होते हैं, हर राउंड में बढ़ते हैं, फिर वापस 1 तक घटते हैं।',
      'इस राउंड में आप कितनी चालें जीतेंगे, यह बताएं — तुरुप सूट पता चलने से पहले।',
      'सबसे ज़्यादा बोली लगाने वाला उस राउंड का तुरुप चुनता है और पहली चाल शुरू करता है।',
      'आखिरी बोली लगाने वाला वह नंबर नहीं चुन सकता जिससे सबकी बोलियों का जोड़ हाथ के बराबर हो जाए।',
      'अपनी बोली बिल्कुल पूरी करें तो बोली का 10 गुना (कम से कम 10) अंक मिलेंगे — ज़्यादा या कम, दोनों ही सूरत में उतने ही अंक कट जाएंगे।'
    ]
  },
  tutorial: {
    en: [
      { title: 'Hands Rise, Then Fall', body: 'Round 1 deals just 1 card each. Every round after that deals one more, up to the max your table allows, then hands shrink back down to 1 for the final round.' },
      { title: 'Bid Blind, Then Trump Is Chosen', body: "Bid how many tricks you'll win this round without knowing the trump suit. Once everyone has bid, whoever bid the highest number picks the trump suit — and leads the first trick." },
      { title: 'The Hook Rule', body: "If you're the last to bid, you can't pick the one number that would make every bid add up to exactly the hand size. Every other number is still open to you." },
      { title: 'Hit It Exactly, Or Lose It All', body: 'Score 10x your bid (minimum 10) only if you win EXACTLY that many tricks. Win more or fewer and you lose that same amount instead — overtricks are not a safety net here.' }
    ],
    hi: [
      { title: 'हाथ पहले बढ़ते हैं, फिर घटते हैं', body: 'पहले राउंड में हर किसी को सिर्फ 1 पत्ता मिलता है। इसके बाद हर राउंड में एक-एक पत्ता बढ़ता है, आपकी टेबल की अधिकतम सीमा तक, फिर आखिरी राउंड तक वापस 1 पत्ते पर आ जाता है।' },
      { title: 'पहले बोली, फिर तुरुप तय होता है', body: 'बिना तुरुप सूट जाने बताएं कि आप इस राउंड में कितनी चालें जीतेंगे। सबके बोली लगाने के बाद, सबसे ज़्यादा बोली लगाने वाला तुरुप सूट चुनता है — और पहली चाल भी वही शुरू करता है।' },
      { title: 'हुक नियम', body: 'अगर आप आखिरी बोली लगाने वाले हैं, तो आप वह नंबर नहीं चुन सकते जिससे सबकी बोलियों का जोड़ हाथ के बराबर हो जाए। बाकी सारे नंबर आपके लिए खुले हैं।' },
      { title: 'बिल्कुल पूरा करें, वरना सब गंवाएं', body: 'अपनी बोली का 10 गुना (कम से कम 10) अंक तभी मिलेगा जब आप ठीक उतनी ही चालें जीतें। ज़्यादा या कम जीतने पर उतने ही अंक कट जाएंगे — यहां ओवरट्रिक कोई सुरक्षा नहीं देता।' }
    ]
  }
}
