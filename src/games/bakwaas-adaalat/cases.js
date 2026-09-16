/**
 * Ridiculous courtroom "cases" — a silly accusation each round's two
 * lawyers argue for/against out loud. Pure content, no logic.
 */
export const CASES = [
  { id: 'cake', en: 'The accused ate the last piece of cake and blamed the family dog.', hi: 'आरोपी ने आख़िरी पीस केक खा लिया और घर के कुत्ते पर इल्ज़ाम लगाया।' },
  { id: 'clocks', en: 'The accused set every clock in the house 10 minutes fast without telling anyone.', hi: 'आरोपी ने घर की सारी घड़ियाँ बिना बताए 10 मिनट आगे कर दीं।' },
  { id: 'wifi', en: 'The accused changed the WiFi password and pretended not to remember it.', hi: 'आरोपी ने वाईफाई का पासवर्ड बदल दिया और याद न होने का नाटक किया।' },
  { id: 'lastauto', en: 'The accused took the last auto-rickshaw while everyone else was still bargaining.', hi: 'जब बाकी सब मोलभाव कर रहे थे, आरोपी ने आख़िरी ऑटो पकड़ लिया।' },
  { id: 'group', en: 'The accused left the family WhatsApp group and rejoined the very next day.', hi: 'आरोपी ने फैमिली व्हाट्सएप ग्रुप छोड़ा और अगले ही दिन वापस आ गया।' },
  { id: 'aircon', en: 'The accused hid the AC remote to win an argument about room temperature.', hi: 'कमरे के तापमान की बहस जीतने के लिए आरोपी ने AC का रिमोट छुपा दिया।' },
  { id: 'ghosting', en: 'The accused left a friend on "seen" for three days and then said "sorry, network issue."', hi: 'आरोपी ने दोस्त का मैसेज तीन दिन तक सिर्फ "सीन" किया और फिर कहा "सॉरी, नेटवर्क इशू था।"' },
  { id: 'lastword', en: 'The accused always has to have the last word, even when they are clearly wrong.', hi: 'आरोपी को हमेशा आखिरी बात खुद कहनी होती है, चाहे वो गलत ही क्यों न हो।' },
  { id: 'parking', en: 'The accused parked their scooter across two spots "just for two minutes."', hi: 'आरोपी ने अपनी स्कूटी "बस दो मिनट के लिए" दो पार्किंग स्पॉट पर लगा दी।' },
  { id: 'spoiler', en: 'The accused revealed the ending of a movie nobody else had watched yet.', hi: 'आरोपी ने उस फिल्म का अंत बता दिया जो बाकी सबने अभी देखी भी नहीं थी।' },
  { id: 'lastbite', en: 'The accused ordered "just a taste" and finished half the plate.', hi: 'आरोपी ने "बस थोड़ा सा चखना है" कहकर आधी प्लेट खत्म कर दी।' },
  { id: 'volume', en: 'The accused played music on speaker in a public place at full volume.', hi: 'आरोपी ने सार्वजनिक जगह पर पूरी आवाज़ में स्पीकर पर गाना बजाया।' },
  { id: 'borrow', en: 'The accused borrowed a charger three weeks ago and it has not been seen since.', hi: 'आरोपी ने तीन हफ्ते पहले चार्जर उधार लिया था, तब से वो गायब है।' },
  { id: 'latereply', en: 'The accused takes two days to reply "ok" to a simple question.', hi: 'आरोपी एक सीधे सवाल का जवाब "ठीक है" देने में भी दो दिन लगा देता है।' },
  { id: 'foodphoto', en: 'The accused made everyone wait to eat so they could photograph the food first.', hi: 'आरोपी ने खाने की फोटो खींचने के लिए सबको इंतज़ार करवाया।' },
  { id: 'splitbill', en: 'The accused ordered the most expensive dish and then suggested splitting the bill equally.', hi: 'आरोपी ने सबसे महंगी डिश ऑर्डर की और फिर बिल बराबर बाँटने का सुझाव दिया।' },
  { id: 'alarm', en: 'The accused set fifteen alarms and snoozed every single one.', hi: 'आरोपी ने पंद्रह अलार्म लगाए और हर एक को स्नूज़ कर दिया।' },
  { id: 'directions', en: 'The accused gave confident directions that were completely wrong.', hi: 'आरोपी ने पूरे विश्वास से रास्ता बताया, जो पूरी तरह गलत था।' },
  { id: 'selfie', en: 'The accused took twenty minutes to pick the "right" selfie while everyone waited.', hi: 'आरोपी ने "सही" सेल्फी चुनने में बीस मिनट लगा दिए, जबकि सब इंतज़ार कर रहे थे।' },
  { id: 'gift', en: 'The accused re-gifted a present without removing the original name tag.', hi: 'आरोपी ने तोहफा किसी और को दे दिया, वो भी बिना पुराना नाम-टैग हटाए।' },
  { id: 'queue', en: 'The accused saved five spots in line for friends who arrived an hour late.', hi: 'आरोपी ने लाइन में पाँच जगह उन दोस्तों के लिए रोकीं जो एक घंटा देरी से आए।' },
  { id: 'remote', en: 'The accused changed the TV channel mid-episode without asking anyone.', hi: 'आरोपी ने बिना किसी से पूछे एपिसोड के बीच में ही चैनल बदल दिया।' },
  { id: 'snacks', en: 'The accused brought their own snacks to a potluck and did not share them.', hi: 'आरोपी पॉटलक में अपना खाना लाया और किसी के साथ बाँटा भी नहीं।' },
  { id: 'plans', en: 'The accused made group plans and then cancelled thirty minutes before, "something came up."', hi: 'आरोपी ने ग्रुप प्लान बनाया और फिर तीस मिनट पहले "कुछ काम आ गया" कहकर कैंसिल कर दिया।' }
]
