export default {
  slug: 'teri',
  title: { en: 'Teri', hi: 'तेरी' },
  minPlayers: 4,
  maxPlayers: 4,
  noAutoClose: true,
  onlineBadge: { id: 'teriSweep' },
  rules: {
    en: [
      'Fixed partnerships. Bidding runs 2 rounds — the first player must bid 7+ and a suit; everyone after can pass or bid higher.',
      'Highest bidder is GameLead — their suit is trump, and their partner\'s whole hand is shown to everyone. GameLead plays cards for their partner; the partner can suggest one.',
      'The hand ends the instant GameLead\'s team hits their bid, or the other team hits enough tricks to make it impossible — unless the other side has zero tricks, in which case play continues to a full 13-trick sweep ("Teri") or their first trick.',
      'GameLead\'s team scores +bid for a normal win, +26 for an unplanned sweep, +39 for a called 13. A loss costs -2x the bid, or -39 for a failed 13.',
      "One running score follows a single 'shuffler' — it rises or falls with their own team's result each hand. Go negative and the role passes to the next player with the score flipped positive; pass 52 and it goes to your own partner at 0. The match ends when both players on a team have done that — the other team wins."
    ],
    hi: [
      'पक्की जोड़ियां। बोली 2 राउंड चलती है — पहला खिलाड़ी 7 या ज़्यादा और एक सूट ज़रूर बोलता है; बाकी सब पास या ज़्यादा बोल सकते हैं।',
      'सबसे ज़्यादा बोली वाला GameLead है — उसकी सूट ट्रंप है, और उसके साथी के सारे पत्ते सबको दिखते हैं। GameLead अपने साथी के लिए पत्ते खेलता है; साथी एक पत्ता सुझा सकता है।',
      'हाथ तुरंत खत्म हो जाता है जब GameLead की टीम अपनी बोली पूरी कर ले, या दूसरी टीम इतनी चालें जीत ले कि यह नामुमकिन हो जाए — सिवाय जब दूसरी टीम की एक भी चाल न हो, तब खेल तब तक चलता है जब तक पूरी 13 चालें ("तेरी") या उनकी पहली चाल न आ जाए।',
      'GameLead की टीम को सामान्य जीत पर +बोली, बिना बताए पूरी 13 जीतने पर +26, और 13 बोलकर जीतने पर +39 मिलते हैं। हारने पर -2x बोली, या 13 बोलकर हारने पर -39।',
      "एक ही स्कोर चलता है, जो मौजूदा 'शफलर' के साथ जुड़ा है — हर हाथ के बाद उसकी अपनी टीम के नतीजे के हिसाब से बढ़ता-घटता है। नेगेटिव होने पर भूमिका अगले खिलाड़ी को मिलती है, स्कोर पॉज़िटिव पलट जाता है; 52 पार होने पर भूमिका अपने साथी को मिलती है, स्कोर 0 हो जाता है। जब एक टीम के दोनों खिलाड़ी ऐसा कर चुके हों, तो खेल खत्म — दूसरी टीम जीतती है।"
    ]
  },
  tutorial: {
    en: [
      { title: 'Bid in Two Rounds', body: 'The first player must state a number (7-13) and a suit. Every turn after that, going around twice, you either pass or bid higher. Once you pass, you\'re out.' },
      { title: "GameLead Plays a Dummy Hand", body: "Highest bidder becomes GameLead — their suit is trump. Their partner's entire hand flips face-up for everyone to see, and GameLead chooses every card their partner plays (the partner can suggest one, but GameLead decides)." },
      { title: 'Hands Can End Early — or Go All the Way', body: "The moment GameLead's team reaches their bid (or the defenders make it mathematically impossible), the hand ends right there. Exception: if the other side hasn't won a single trick yet, play continues until either a full 13-trick sweep — a \"Teri\" — or their first trick." },
      { title: 'One Score, One Shuffler', body: "There's a single running score tied to whoever is the current \"shuffler.\" It moves with their own team's fortunes each hand. Drop below zero and the role — and a flipped-positive score — passes to the next player. Cross 52 and it passes to your own partner at zero instead. Once both players on one team have crossed 52, the other team wins the match." }
    ],
    hi: [
      { title: 'दो राउंड में बोली', body: 'पहला खिलाड़ी एक नंबर (7-13) और एक सूट ज़रूर बोलता है। इसके बाद हर बारी में, दो बार चक्कर लगाकर, आप या तो पास करें या ज़्यादा बोलें। एक बार पास किया तो बाहर।' },
      { title: 'GameLead डमी हाथ खेलता है', body: 'सबसे ज़्यादा बोली वाला GameLead बनता है — उसकी सूट ट्रंप है। उसके साथी के सारे पत्ते सबके लिए खुल जाते हैं, और GameLead ही तय करता है कि साथी कौन सा पत्ता खेलेगा (साथी एक सुझा सकता है, पर फैसला GameLead का है)।' },
      { title: 'हाथ जल्दी भी खत्म हो सकता है — या पूरा भी चल सकता है', body: 'जैसे ही GameLead की टीम अपनी बोली पूरी कर ले (या दूसरी टीम के लिए यह नामुमकिन हो जाए), हाथ वहीं खत्म। अपवाद: अगर दूसरी टीम ने अभी तक एक भी चाल नहीं जीती, तो खेल तब तक चलता है जब तक पूरी 13 चालें — "तेरी" — या उनकी पहली चाल न आ जाए।' },
      { title: 'एक स्कोर, एक शफलर', body: 'एक ही चलता हुआ स्कोर है, जो मौजूदा "शफलर" से जुड़ा है। यह हर हाथ के बाद उसकी अपनी टीम के नतीजे के साथ बढ़ता-घटता है। शून्य से नीचे जाए तो भूमिका — और पलटा हुआ पॉज़िटिव स्कोर — अगले खिलाड़ी को मिलती है। 52 पार करे तो भूमिका अपने साथी को शून्य पर मिलती है। जब एक टीम के दोनों खिलाड़ी 52 पार कर चुके हों, तो दूसरी टीम खेल जीत जाती है।' }
    ]
  }
}
