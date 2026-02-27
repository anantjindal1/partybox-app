/**
 * Tez Dimaag Challenge — question packs. ~150 questions across 6 categories.
 * Format: { category, difficulty, question, options[4], correctIndex }.
 */

function shuffleArray(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const CATEGORIES = [
  'Bollywood & OTT',
  'Cricket',
  'India GK',
  'Food & Daily Life',
  'Modern India',
  'Brain Teasers'
]

const ALL_QUESTIONS = [
  // --- Bollywood & OTT ---
  { category: 'Bollywood & OTT', difficulty: 'easy', question: 'Who directed "3 Idiots"?', options: ['Rajkumar Hirani', 'Karan Johar', 'Farhan Akhtar', 'Anurag Kashyap'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'easy', question: 'Which actor played the lead in "Dangal"?', options: ['Aamir Khan', 'Salman Khan', 'Akshay Kumar', 'Hrithik Roshan'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'easy', question: 'What is the name of the tiger in "Ek Tha Tiger"?', options: ['Tiger', 'Sher', 'Baagh', 'No name'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'easy', question: 'Which film has the song "Tujh Mein Rab Dikhta Hai"?', options: ['Rab Ne Bana Di Jodi', 'Veer-Zaara', 'Mohabbatein', 'Kal Ho Naa Ho'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'easy', question: 'Who played the role of PK?', options: ['Aamir Khan', 'Shah Rukh Khan', 'Salman Khan', 'Ranbir Kapoor'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'easy', question: 'Which OTT platform streams "Sacred Games"?', options: ['Netflix', 'Amazon Prime', 'Disney+ Hotstar', 'ZEE5'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'easy', question: 'Who directed "Bahubali"?', options: ['S.S. Rajamouli', 'Shankar', 'Trivikram', 'Koratala Siva'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'easy', question: 'Which film won Best Film at 2023 National Awards?', options: ['RRR', 'Kashmir Files', 'Kantara', 'Gangubai'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'medium', question: 'Who composed the music for "Rockstar"?', options: ['A.R. Rahman', 'Pritam', 'Amit Trivedi', 'Vishal-Shekhar'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'medium', question: 'Which actor made his debut in "Ishq Vishk"?', options: ['Shahid Kapoor', 'Ranbir Kapoor', 'Imran Khan', 'Sharman Joshi'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'medium', question: 'Which web series features Pratik Gandhi as Harshad Mehta?', options: ['Scam 1992', 'The Family Man', 'Made in Heaven', 'Delhi Crime'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'medium', question: 'Who played the antagonist in "Jawan"?', options: ['Vijay Sethupathi', 'Nawazuddin', 'Kay Kay Menon', 'John Abraham'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'medium', question: 'Which film is set in the world of stand-up comedy?', options: ['Comedy Circus', 'Comedy Nights', 'Jolly LLB', 'Munna Bhai MBBS'], correctIndex: 2 },
  { category: 'Bollywood & OTT', difficulty: 'medium', question: 'Who directed "Taare Zameen Par"?', options: ['Aamir Khan', 'Ashutosh Gowariker', 'Rajkumar Hirani', 'Nitesh Tiwari'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'hard', question: 'Which film won the first Best Picture Oscar for India?', options: ['Gandhi', 'Slumdog Millionaire', 'Lagaan', 'None yet'], correctIndex: 1 },
  { category: 'Bollywood & OTT', difficulty: 'hard', question: 'Who wrote the dialogues for "Gangs of Wasseypur"?', options: ['Zeishan Quadri', 'Anurag Kashyap', 'Varun Grover', 'Akshat Verma'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'hard', question: 'Which 90s film had the tagline "A Love Legend"?', options: ['Dilwale Dulhania Le Jayenge', 'Hum Aapke Hain Koun', 'Raja Hindustani', 'Kuch Kuch Hota Hai'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'easy', question: 'Which actress played Geet in "Jab We Met"?', options: ['Kareena Kapoor', 'Katrina Kaif', 'Deepika Padukone', 'Priyanka Chopra'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'easy', question: 'What is Shah Rukh Khan\'s character name in "Chennai Express"?', options: ['Rahul', 'Rohan', 'Raj', 'Rahul (different)'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'medium', question: 'Which film features the song "Gerua"?', options: ['Dilwale', 'Chennai Express', 'Jab Tak Hai Jaan', 'Raees'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'medium', question: 'Who directed "Gully Boy"?', options: ['Zoya Akhtar', 'Farhan Akhtar', 'Reema Kagti', 'Farhan Akhtar'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'easy', question: 'Which streaming show has "Mirzapur" as setting?', options: ['Mirzapur', 'Sacred Games', 'Delhi Crime', 'Paatal Lok'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'easy', question: 'Who played Chhichhore\'s lead?', options: ['Sushant Singh Rajput', 'Rajkummar Rao', 'Kartik Aaryan', 'Vicky Kaushal'], correctIndex: 0 },
  { category: 'Bollywood & OTT', difficulty: 'hard', question: 'Which film did not feature Amitabh Bachchan?', options: ['Deewar', 'Sholay', 'Don', 'Mughal-e-Azam'], correctIndex: 3 },
  { category: 'Bollywood & OTT', difficulty: 'medium', question: 'Which film has "Badtameez Dil" song?', options: ['Yeh Jawaani Hai Deewani', 'Rockstar', 'Barfi', 'Tamasha'], correctIndex: 0 },
  // --- Cricket ---
  { category: 'Cricket', difficulty: 'easy', question: 'How many runs is a six worth?', options: ['6', '4', '2', '1'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'easy', question: 'How many players are in a cricket team?', options: ['11', '10', '12', '9'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'easy', question: 'Who hit the "Desert Storm" innings?', options: ['Sachin Tendulkar', 'Rahul Dravid', 'Sourav Ganguly', 'Virender Sehwag'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'easy', question: 'Which country has won the most ODI World Cups?', options: ['Australia', 'India', 'West Indies', 'England'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'easy', question: 'Who is known as "Captain Cool"?', options: ['MS Dhoni', 'Virat Kohli', 'Rohit Sharma', 'Rahul Dravid'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'medium', question: 'In which year did India win the first ODI World Cup?', options: ['1983', '2011', '2007', '1996'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'medium', question: 'Who took 10 wickets in an innings in Test cricket?', options: ['Anil Kumble', 'Kapil Dev', 'Harbhajan Singh', 'Ravichandran Ashwin'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'medium', question: 'Which Indian bowler has most Test wickets?', options: ['Anil Kumble', 'Kapil Dev', 'Ravichandran Ashwin', 'Harbhajan Singh'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'medium', question: 'Who scored 400 in a Test innings?', options: ['Brian Lara', 'Matthew Hayden', 'Sehwag', 'Sachin'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'medium', question: 'What is the length of a cricket pitch in yards?', options: ['22', '20', '24', '18'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'hard', question: 'Who was India\'s captain in 1983 World Cup?', options: ['Kapil Dev', 'Sunil Gavaskar', 'Mohinder Amarnath', 'Kirti Azad'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'hard', question: 'Which team has won the most IPL titles?', options: ['Mumbai Indians', 'Chennai Super Kings', 'Kolkata Knight Riders', 'Rajasthan Royals'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'easy', question: 'How many balls in one over?', options: ['6', '4', '8', '5'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'easy', question: 'Who has most runs in international cricket?', options: ['Sachin Tendulkar', 'Ricky Ponting', 'Jacques Kallis', 'Virat Kohli'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'medium', question: 'Who hit six sixes in an over in T20?', options: ['Yuvraj Singh', 'Herschelle Gibbs', 'Kieron Pollard', 'Chris Gayle'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'medium', question: 'Which Indian city hosts IPL team "Royal Challengers"?', options: ['Bangalore', 'Mumbai', 'Chennai', 'Kolkata'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'easy', question: 'What does LBW stand for?', options: ['Leg Before Wicket', 'Long Ball Wide', 'Left Behind Wicket', 'Leg Bye Wicket'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'hard', question: 'Who was the first Indian to score a triple century in Tests?', options: ['Virender Sehwag', 'Sachin Tendulkar', 'Rahul Dravid', 'Karun Nair'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'easy', question: 'Which format has 20 overs per side?', options: ['T20', 'ODI', 'Test', 'T10'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'medium', question: 'Who won the 2023 Cricket World Cup?', options: ['Australia', 'India', 'England', 'New Zealand'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'medium', question: 'Which Indian has most IPL runs?', options: ['Virat Kohli', 'Rohit Sharma', 'MS Dhoni', 'Suresh Raina'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'hard', question: 'Who took a hat-trick in 1987 World Cup for India?', options: ['Chetan Sharma', 'Kapil Dev', 'Maninder Singh', 'Ravi Shastri'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'easy', question: 'What is a "duck" in cricket?', options: ['Out for zero', 'A type of shot', 'A field position', 'No ball'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'medium', question: 'Who is known as "Hitman" in cricket?', options: ['Rohit Sharma', 'Virat Kohli', 'MS Dhoni', 'Hardik Pandya'], correctIndex: 0 },
  { category: 'Cricket', difficulty: 'hard', question: 'Which country hosted the first T20 World Cup?', options: ['South Africa', 'England', 'India', 'West Indies'], correctIndex: 0 },
  // --- India GK ---
  { category: 'India GK', difficulty: 'easy', question: 'What is the capital of India?', options: ['New Delhi', 'Mumbai', 'Kolkata', 'Chennai'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'easy', question: 'How many states does India have?', options: ['28', '29', '27', '30'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'easy', question: 'Which river is considered holy in India?', options: ['Ganga', 'Yamuna', 'Brahmaputra', 'Godavari'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'easy', question: 'Who was the first Prime Minister of India?', options: ['Jawaharlal Nehru', 'Sardar Patel', 'Rajendra Prasad', 'Subhas Bose'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'easy', question: 'Which festival is known as the festival of lights?', options: ['Diwali', 'Holi', 'Eid', 'Christmas'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'medium', question: 'Which state has the longest coastline?', options: ['Gujarat', 'Andhra Pradesh', 'Tamil Nadu', 'Maharashtra'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'medium', question: 'In which year did India become a republic?', options: ['1950', '1947', '1952', '1948'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'medium', question: 'Which mountain range separates India from Tibet?', options: ['Himalayas', 'Western Ghats', 'Vindhyas', 'Aravallis'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'medium', question: 'What is the national animal of India?', options: ['Tiger', 'Lion', 'Elephant', 'Peacock'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'medium', question: 'Which city is known as the Pink City?', options: ['Jaipur', 'Jodhpur', 'Udaipur', 'Jaisalmer'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'hard', question: 'Which article abolished untouchability?', options: ['Article 17', 'Article 15', 'Article 14', 'Article 16'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'hard', question: 'Who wrote the national anthem of India?', options: ['Rabindranath Tagore', 'Bankim Chandra', 'Sarojini Naidu', 'Subhas Bose'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'easy', question: 'What is the national bird of India?', options: ['Peacock', 'Parrot', 'Sparrow', 'Eagle'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'easy', question: 'Which is the largest state by area?', options: ['Rajasthan', 'Madhya Pradesh', 'Maharashtra', 'Uttar Pradesh'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'medium', question: 'Which city is the financial capital of India?', options: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'medium', question: 'How many union territories does India have?', options: ['8', '7', '9', '6'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'easy', question: 'Which monument is in Agra?', options: ['Taj Mahal', 'Red Fort', 'Qutub Minar', 'India Gate'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'hard', question: 'Who designed the Indian flag?', options: ['Pingali Venkayya', 'Mahatma Gandhi', 'Nehru', 'Sardar Patel'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'medium', question: 'Which state produces the most tea?', options: ['Assam', 'West Bengal', 'Kerala', 'Tamil Nadu'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'easy', question: 'What is the currency of India?', options: ['Rupee', 'Taka', 'Rupiah', 'Peso'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'medium', question: 'Which river flows through Delhi?', options: ['Yamuna', 'Ganga', 'Sutlej', 'Brahmaputra'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'hard', question: 'In which year was the first Lok Sabha election held?', options: ['1952', '1950', '1947', '1951'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'easy', question: 'Which festival is played with colors?', options: ['Holi', 'Diwali', 'Eid', 'Pongal'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'medium', question: 'Which state has the highest population?', options: ['Uttar Pradesh', 'Maharashtra', 'Bihar', 'West Bengal'], correctIndex: 0 },
  { category: 'India GK', difficulty: 'hard', question: 'Who was the first President of India?', options: ['Rajendra Prasad', 'Nehru', 'Radhakrishnan', 'Prasad'], correctIndex: 0 },
  // --- Food & Daily Life ---
  { category: 'Food & Daily Life', difficulty: 'easy', question: 'What is the main ingredient in idli?', options: ['Rice', 'Wheat', 'Maize', 'Barley'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'easy', question: 'Which drink is often called "chai"?', options: ['Tea', 'Coffee', 'Milk', 'Lassi'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'easy', question: 'What is paneer made from?', options: ['Milk', 'Soy', 'Wheat', 'Rice'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'easy', question: 'Which grain is used to make roti?', options: ['Wheat', 'Rice', 'Maize', 'Bajra'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'easy', question: 'What is the main spice in biryani?', options: ['Saffron', 'Turmeric', 'Cumin', 'Coriander'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'medium', question: 'Which state is famous for dosa?', options: ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'medium', question: 'What is jalebi made of?', options: ['Maida and sugar syrup', 'Rice flour', 'Besan', 'Wheat'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'medium', question: 'Which fruit is used to make aamras?', options: ['Mango', 'Banana', 'Papaya', 'Guava'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'medium', question: 'What is the main ingredient of halwa?', options: ['Semolina', 'Wheat', 'Rice', 'Besan'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'medium', question: 'Which city is famous for vada pav?', options: ['Mumbai', 'Delhi', 'Pune', 'Nagpur'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'hard', question: 'What is "sarson da saag" made from?', options: ['Mustard leaves', 'Spinach', 'Fenugreek', 'Bathua'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'hard', question: 'Which state is known for dhokla?', options: ['Gujarat', 'Rajasthan', 'Maharashtra', 'MP'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'easy', question: 'What is lassi?', options: ['Yogurt drink', 'Milk shake', 'Juice', 'Tea'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'easy', question: 'Which vegetable is used in aloo gobi?', options: ['Potato and cauliflower', 'Peas', 'Brinjal', 'Okra'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'medium', question: 'What is upma made from?', options: ['Semolina', 'Rice', 'Wheat', 'Oats'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'medium', question: 'Which sweet is from West Bengal?', options: ['Rasgulla', 'Gulab jamun', 'Jalebi', 'Ladoo'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'easy', question: 'What is samosa usually filled with?', options: ['Potato and peas', 'Paneer', 'Meat', 'Cheese'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'hard', question: 'Which rice is used for biryani in Hyderabad?', options: ['Basmati', 'Sona Masoori', 'Ponni', 'Jeerakasala'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'medium', question: 'What is the main ingredient of kheer?', options: ['Rice and milk', 'Wheat', 'Vermicelli', 'Semolina'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'easy', question: 'Which leaf is used to wrap paan?', options: ['Betel', 'Banana', 'Mango', 'Tulsi'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'medium', question: 'Which state is famous for pongal dish?', options: ['Tamil Nadu', 'Kerala', 'Andhra', 'Karnataka'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'hard', question: 'What is "bisi bele bath"?', options: ['Rice dish from Karnataka', 'Gujarati thali', 'Bengali sweet', 'Punjabi curry'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'easy', question: 'What is chaat?', options: ['Savory snack', 'Sweet', 'Drink', 'Main course'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'medium', question: 'Which nut is used in kaju katli?', options: ['Cashew', 'Almond', 'Pistachio', 'Walnut'], correctIndex: 0 },
  { category: 'Food & Daily Life', difficulty: 'hard', question: 'What is "pav" in pav bhaji?', options: ['Bread roll', 'Rice', 'Roti', 'Bun'], correctIndex: 0 },
  // --- Modern India ---
  { category: 'Modern India', difficulty: 'easy', question: 'Which app is commonly used for UPI payments?', options: ['PhonePe', 'WhatsApp', 'Instagram', 'Twitter'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'easy', question: 'Who founded Reliance Industries?', options: ['Dhirubhai Ambani', 'Mukesh Ambani', 'Anil Ambani', 'Ratan Tata'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'easy', question: 'Which city is known as Silicon Valley of India?', options: ['Bangalore', 'Hyderabad', 'Pune', 'Chennai'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'easy', question: 'When was Aadhaar launched?', options: ['2009', '2010', '2011', '2012'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'medium', question: 'Which scheme provides free LPG connections?', options: ['Ujjwala', 'Ayushman', 'PM Awas', 'Jan Dhan'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'medium', question: 'Who founded Infosys?', options: ['N.R. Narayana Murthy', 'Azim Premji', 'Ratan Tata', 'Anil Ambani'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'medium', question: 'Which Indian state has the first metro?', options: ['Kolkata', 'Delhi', 'Mumbai', 'Chennai'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'medium', question: 'What does ONDC stand for?', options: ['Open Network for Digital Commerce', 'Online National Digital', 'Open National Data', 'Other'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'hard', question: 'In which year did India launch its first satellite?', options: ['1975', '1980', '1972', '1983'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'hard', question: 'Who is the founder of Zomato?', options: ['Deepinder Goyal', 'Bhavish Aggarwal', 'Vijay Shekhar', 'Kunal Bahl'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'easy', question: 'Which company owns Jio?', options: ['Reliance', 'Airtel', 'Vodafone', 'BSNL'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'easy', question: 'What is the name of India\'s space agency?', options: ['ISRO', 'NASA', 'ESA', 'DRDO'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'medium', question: 'Which city hosts the Indian F1 Grand Prix?', options: ['Greater Noida', 'Mumbai', 'Bangalore', 'Hyderabad'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'medium', question: 'Who founded Ola Cabs?', options: ['Bhavish Aggarwal', 'Travis Kalanick', 'Ritesh Agarwal', 'Kunal Bahl'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'easy', question: 'Which year did Digital India start?', options: ['2015', '2014', '2016', '2017'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'hard', question: 'Who founded Flipkart?', options: ['Sachin and Binny Bansal', 'Kunal Bahl', 'Vijay Shekhar', 'Nandan Nilekani'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'medium', question: 'Which state launched the first electric vehicle policy?', options: ['Delhi', 'Karnataka', 'Maharashtra', 'Gujarat'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'easy', question: 'What does Aadhaar provide?', options: ['Unique ID number', 'Bank account', 'Passport', 'Driving license'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'medium', question: 'Which Indian city has the busiest airport?', options: ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'hard', question: 'When was the GST launched in India?', options: ['2017', '2016', '2018', '2015'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'easy', question: 'Which app is used for train booking?', options: ['IRCTC', 'Paytm', 'MakeMyTrip', 'Goibibo'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'medium', question: 'Who founded Paytm?', options: ['Vijay Shekhar Sharma', 'Kunal Bahl', 'Ritesh Agarwal', 'Nandan Nilekani'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'hard', question: 'Which Indian state has the highest GDP?', options: ['Maharashtra', 'Tamil Nadu', 'Gujarat', 'Karnataka'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'easy', question: 'What is CoWIN used for?', options: ['Vaccination registration', 'Train booking', 'Aadhaar', 'Banking'], correctIndex: 0 },
  { category: 'Modern India', difficulty: 'medium', question: 'Which Indian company acquired Jaguar Land Rover?', options: ['Tata Motors', 'Mahindra', 'Maruti', 'Ashok Leyland'], correctIndex: 0 },
  // --- Brain Teasers ---
  { category: 'Brain Teasers', difficulty: 'easy', question: 'What comes next: 2, 4, 6, 8, ?', options: ['10', '9', '12', '7'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'easy', question: 'How many days are in a leap year?', options: ['366', '365', '364', '367'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'easy', question: 'What is 15 + 27?', options: ['42', '41', '43', '40'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'easy', question: 'Which shape has 6 sides?', options: ['Hexagon', 'Pentagon', 'Octagon', 'Square'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'easy', question: 'What is half of 100?', options: ['50', '25', '75', '60'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'medium', question: 'What comes next: 1, 1, 2, 3, 5, 8, ?', options: ['13', '11', '12', '14'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'medium', question: 'If A=1, B=2, what is C?', options: ['3', '2', '4', '0'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'medium', question: 'How many squares on a chessboard?', options: ['204', '64', '128', '256'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'medium', question: 'What is 12 × 12?', options: ['144', '124', '134', '154'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'medium', question: 'Which number is the odd one out: 2, 4, 6, 7, 8?', options: ['7', '2', '4', '8'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'hard', question: 'What is the next prime after 17?', options: ['19', '18', '21', '20'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'hard', question: 'If 3x + 6 = 15, what is x?', options: ['3', '2', '4', '5'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'hard', question: 'How many faces does a cube have?', options: ['6', '4', '8', '12'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'easy', question: 'What is 20% of 80?', options: ['16', '18', '14', '20'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'easy', question: 'Which is larger: 0.5 or 0.05?', options: ['0.5', '0.05', 'Same', 'Cannot say'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'medium', question: 'What is 2 to the power of 5?', options: ['32', '16', '64', '10'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'medium', question: 'How many months have 30 days?', options: ['4', '5', '6', '3'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'medium', question: 'What is the square root of 81?', options: ['9', '8', '7', '10'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'hard', question: 'What is 15% of 200?', options: ['30', '25', '35', '20'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'easy', question: 'How many hours in a day?', options: ['24', '12', '48', '20'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'medium', question: 'What comes next: 3, 6, 9, 12, ?', options: ['15', '14', '16', '18'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'hard', question: 'How many diagonals in a pentagon?', options: ['5', '4', '6', '3'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'easy', question: 'What is 7 × 8?', options: ['56', '54', '58', '64'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'medium', question: 'Which is not a prime number?', options: ['9', '2', '3', '5'], correctIndex: 0 },
  { category: 'Brain Teasers', difficulty: 'hard', question: 'What is the sum of angles in a triangle?', options: ['180 degrees', '90 degrees', '360 degrees', '270 degrees'], correctIndex: 0 }
]

function byCategory(cat) {
  return ALL_QUESTIONS.filter(q => q.category === cat)
}

export function getCategories() {
  return [...CATEGORIES]
}

export function getQuestionsByCategory(category) {
  return byCategory(category)
}

/**
 * Generate 5 unique questions for a round in the given category.
 */
export function generateRoundQuestions(category, count = 5) {
  const pool = byCategory(category)
  const shuffled = shuffleArray([...pool])
  return shuffled.slice(0, count)
}

export { ALL_QUESTIONS }
