/**
 * Rapid Fire Battle — question bank.
 * Format: { question, options: [string x4], correctIdx: 0|1|2|3, category }
 * Categories: 'gk' | 'bollywood' | 'cricket' | 'science'
 * ~37–38 questions per category.
 */

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const QUESTIONS = [
  // ─── GK ───────────────────────────────────────────────────────────────────
  { category: 'gk', question: 'What is the capital of India?', options: ['New Delhi', 'Mumbai', 'Kolkata', 'Chennai'], correctIdx: 0 },
  { category: 'gk', question: 'How many states does India have?', options: ['28', '29', '27', '30'], correctIdx: 0 },
  { category: 'gk', question: 'Who was the first Prime Minister of India?', options: ['Jawaharlal Nehru', 'Sardar Patel', 'Rajendra Prasad', 'Subhas Bose'], correctIdx: 0 },
  { category: 'gk', question: 'Which is the national bird of India?', options: ['Peacock', 'Parrot', 'Sparrow', 'Eagle'], correctIdx: 0 },
  { category: 'gk', question: 'Which festival is known as the festival of lights?', options: ['Diwali', 'Holi', 'Eid', 'Christmas'], correctIdx: 0 },
  { category: 'gk', question: 'What is the national animal of India?', options: ['Tiger', 'Lion', 'Elephant', 'Peacock'], correctIdx: 0 },
  { category: 'gk', question: 'Which state has the longest coastline?', options: ['Gujarat', 'Andhra Pradesh', 'Tamil Nadu', 'Maharashtra'], correctIdx: 0 },
  { category: 'gk', question: 'In which year did India become a republic?', options: ['1950', '1947', '1952', '1948'], correctIdx: 0 },
  { category: 'gk', question: 'Which city is known as the Pink City?', options: ['Jaipur', 'Jodhpur', 'Udaipur', 'Jaisalmer'], correctIdx: 0 },
  { category: 'gk', question: 'Who wrote the national anthem of India?', options: ['Rabindranath Tagore', 'Bankim Chandra', 'Sarojini Naidu', 'Subhas Bose'], correctIdx: 0 },
  { category: 'gk', question: 'Which is the largest state by area in India?', options: ['Rajasthan', 'Madhya Pradesh', 'Maharashtra', 'Uttar Pradesh'], correctIdx: 0 },
  { category: 'gk', question: 'Which river is considered the holiest in India?', options: ['Ganga', 'Yamuna', 'Brahmaputra', 'Godavari'], correctIdx: 0 },
  { category: 'gk', question: 'What is the currency of India?', options: ['Rupee', 'Taka', 'Rupiah', 'Peso'], correctIdx: 0 },
  { category: 'gk', question: 'Which monument is located in Agra?', options: ['Taj Mahal', 'Red Fort', 'Qutub Minar', 'India Gate'], correctIdx: 0 },
  { category: 'gk', question: 'Which city is known as the financial capital of India?', options: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai'], correctIdx: 0 },
  { category: 'gk', question: 'Which state produces the most tea in India?', options: ['Assam', 'West Bengal', 'Kerala', 'Tamil Nadu'], correctIdx: 0 },
  { category: 'gk', question: 'Which article of the Indian constitution abolished untouchability?', options: ['Article 17', 'Article 15', 'Article 14', 'Article 16'], correctIdx: 0 },
  { category: 'gk', question: 'Who designed the Indian national flag?', options: ['Pingali Venkayya', 'Mahatma Gandhi', 'Nehru', 'Sardar Patel'], correctIdx: 0 },
  { category: 'gk', question: 'How many union territories does India have?', options: ['8', '7', '9', '6'], correctIdx: 0 },
  { category: 'gk', question: 'Which state has the highest population in India?', options: ['Uttar Pradesh', 'Maharashtra', 'Bihar', 'West Bengal'], correctIdx: 0 },
  { category: 'gk', question: 'Who was the first President of India?', options: ['Rajendra Prasad', 'Jawaharlal Nehru', 'Radhakrishnan', 'Zakir Hussain'], correctIdx: 0 },
  { category: 'gk', question: 'Which mountain range separates India from Tibet?', options: ['Himalayas', 'Western Ghats', 'Vindhyas', 'Aravallis'], correctIdx: 0 },
  { category: 'gk', question: 'In which year was the first Lok Sabha election held?', options: ['1952', '1950', '1947', '1951'], correctIdx: 0 },
  { category: 'gk', question: 'Which river flows through the city of Delhi?', options: ['Yamuna', 'Ganga', 'Sutlej', 'Brahmaputra'], correctIdx: 0 },
  { category: 'gk', question: 'Which festival is played with colors?', options: ['Holi', 'Diwali', 'Eid', 'Pongal'], correctIdx: 0 },
  { category: 'gk', question: 'What is the name of India\'s space agency?', options: ['ISRO', 'NASA', 'ESA', 'DRDO'], correctIdx: 0 },
  { category: 'gk', question: 'Which city hosted the 2010 Commonwealth Games?', options: ['Delhi', 'Mumbai', 'Bangalore', 'Chennai'], correctIdx: 0 },
  { category: 'gk', question: 'The Sundarbans mangrove forest is shared between India and which country?', options: ['Bangladesh', 'Myanmar', 'Sri Lanka', 'Nepal'], correctIdx: 0 },
  { category: 'gk', question: 'Which state is known as the "Spice Garden of India"?', options: ['Kerala', 'Goa', 'Karnataka', 'Tamil Nadu'], correctIdx: 0 },
  { category: 'gk', question: 'Which Indian city is known as the "City of Joy"?', options: ['Kolkata', 'Mumbai', 'Delhi', 'Chennai'], correctIdx: 0 },
  { category: 'gk', question: 'What is the highest civilian award in India?', options: ['Bharat Ratna', 'Padma Vibhushan', 'Padma Bhushan', 'Padma Shri'], correctIdx: 0 },
  { category: 'gk', question: 'Which ocean lies to the south of India?', options: ['Indian Ocean', 'Pacific Ocean', 'Atlantic Ocean', 'Arctic Ocean'], correctIdx: 0 },
  { category: 'gk', question: 'Which dam on the Bhakra River is the highest in India?', options: ['Bhakra Dam', 'Hirakud Dam', 'Nagarjunasagar Dam', 'Tehri Dam'], correctIdx: 0 },
  { category: 'gk', question: 'Who gave the slogan "Jai Hind"?', options: ['Subhas Chandra Bose', 'Mahatma Gandhi', 'Nehru', 'Bhagat Singh'], correctIdx: 0 },
  { category: 'gk', question: 'Which is the smallest state of India by area?', options: ['Goa', 'Sikkim', 'Tripura', 'Nagaland'], correctIdx: 0 },
  { category: 'gk', question: 'Which Indian ruler built the Red Fort in Delhi?', options: ['Shah Jahan', 'Aurangzeb', 'Akbar', 'Babur'], correctIdx: 0 },
  { category: 'gk', question: 'Which sport is India\'s national game?', options: ['Hockey', 'Cricket', 'Football', 'Kabaddi'], correctIdx: 0 },
  { category: 'gk', question: 'Which Indian city is the Silicon Valley of India?', options: ['Bangalore', 'Hyderabad', 'Pune', 'Chennai'], correctIdx: 0 },

  // ─── BOLLYWOOD ────────────────────────────────────────────────────────────
  { category: 'bollywood', question: 'Who directed the film "3 Idiots"?', options: ['Rajkumar Hirani', 'Karan Johar', 'Farhan Akhtar', 'Anurag Kashyap'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which actor played the lead role in "Dangal"?', options: ['Aamir Khan', 'Salman Khan', 'Akshay Kumar', 'Hrithik Roshan'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which OTT platform streams "Sacred Games"?', options: ['Netflix', 'Amazon Prime', 'Disney+ Hotstar', 'ZEE5'], correctIdx: 0 },
  { category: 'bollywood', question: 'Who directed "Bahubali"?', options: ['S.S. Rajamouli', 'Shankar', 'Trivikram', 'Koratala Siva'], correctIdx: 0 },
  { category: 'bollywood', question: 'Who composed the music for "Rockstar"?', options: ['A.R. Rahman', 'Pritam', 'Amit Trivedi', 'Vishal-Shekhar'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which web series features Pratik Gandhi as Harshad Mehta?', options: ['Scam 1992', 'The Family Man', 'Made in Heaven', 'Delhi Crime'], correctIdx: 0 },
  { category: 'bollywood', question: 'Who played the antagonist in "Jawan" (2023)?', options: ['Vijay Sethupathi', 'Nawazuddin Siddiqui', 'Kay Kay Menon', 'John Abraham'], correctIdx: 0 },
  { category: 'bollywood', question: 'Who directed "Taare Zameen Par"?', options: ['Aamir Khan', 'Ashutosh Gowariker', 'Rajkumar Hirani', 'Nitesh Tiwari'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which actress played Geet in "Jab We Met"?', options: ['Kareena Kapoor', 'Katrina Kaif', 'Deepika Padukone', 'Priyanka Chopra'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which film features the song "Gerua"?', options: ['Dilwale', 'Chennai Express', 'Jab Tak Hai Jaan', 'Raees'], correctIdx: 0 },
  { category: 'bollywood', question: 'Who directed "Gully Boy"?', options: ['Zoya Akhtar', 'Farhan Akhtar', 'Reema Kagti', 'Kabir Khan'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which film has the song "Badtameez Dil"?', options: ['Yeh Jawaani Hai Deewani', 'Rockstar', 'Barfi', 'Tamasha'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which actor played the role of PK in the 2014 film?', options: ['Aamir Khan', 'Shah Rukh Khan', 'Salman Khan', 'Ranbir Kapoor'], correctIdx: 0 },
  { category: 'bollywood', question: 'In which film did Sushant Singh Rajput play the lead?', options: ['Chhichhore', 'Stree', 'Bard of Blood', 'Raazi'], correctIdx: 0 },
  { category: 'bollywood', question: 'Who won Best Actress National Award for "Queen"?', options: ['Kangana Ranaut', 'Deepika Padukone', 'Priyanka Chopra', 'Alia Bhatt'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which film is based on the 26/11 Mumbai attacks?', options: ['A Wednesday', 'Neerja', 'Hotel Mumbai', 'The Attacks of 26/11'], correctIdx: 3 },
  { category: 'bollywood', question: 'Who directed "Dil Dhadakne Do"?', options: ['Zoya Akhtar', 'Karan Johar', 'Farhan Akhtar', 'Imtiaz Ali'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which Bollywood film won the Oscar for Best Foreign Language Film?', options: ['None — no Indian film has won', 'Lagaan', 'Mother India', 'Salaam Bombay'], correctIdx: 0 },
  { category: 'bollywood', question: 'Who starred in both "Kabhi Khushi Kabhie Gham" and "Kal Ho Naa Ho"?', options: ['Shah Rukh Khan', 'Hrithik Roshan', 'Salman Khan', 'Aamir Khan'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which streaming show is set in the city of Mirzapur?', options: ['Mirzapur', 'Panchayat', 'TVF Pitchers', 'Kota Factory'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which film starred Alia Bhatt as an undercover agent?', options: ['Raazi', 'Udta Punjab', 'Highway', 'Kapoor & Sons'], correctIdx: 0 },
  { category: 'bollywood', question: 'Who played Alauddin Khilji in "Padmaavat"?', options: ['Ranveer Singh', 'Ranbir Kapoor', 'Shahid Kapoor', 'Arjun Kapoor'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which film had Vidya Balan playing a Bihari woman detective?', options: ['Kahaani', 'Dirty Picture', 'Tumhari Sulu', 'Shakuntala Devi'], correctIdx: 0 },
  { category: 'bollywood', question: 'In "DDLJ", what does Raj (SRK) give Simran at the end?', options: ['His hand (on the train)', 'A letter', 'A rose', 'A ring'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which Bollywood actor is also known as "Bhai" by fans?', options: ['Salman Khan', 'Aamir Khan', 'Shah Rukh Khan', 'Akshay Kumar'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which film stars Ayushmann Khurrana as a sperm donor?', options: ['Vicky Donor', 'Badhaai Ho', 'Article 15', 'Dream Girl'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which director made "Gangs of Wasseypur"?', options: ['Anurag Kashyap', 'Vishal Bhardwaj', 'Dibakar Banerjee', 'Tigmanshu Dhulia'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which 2022 RRR song won the Academy Award (Oscar)?', options: ['Naatu Naatu', 'Komuram Bheemudo', 'Janani', 'Dosti'], correctIdx: 0 },
  { category: 'bollywood', question: 'Who played the role of Sardar Patel in the film "Sardar"?', options: ['Paresh Rawal', 'Manoj Bajpayee', 'Naseeruddin Shah', 'Om Puri'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which Bollywood movie is a remake of the Hollywood film "Hitch"?', options: ['Partner', 'Pyaar Ka Punchnama', 'Ek Main Aur Ekk Tu', 'Ishq Vishk'], correctIdx: 0 },
  { category: 'bollywood', question: 'Who directed "The Lunchbox" (2013)?', options: ['Ritesh Batra', 'Anurag Basu', 'Vishal Bhardwaj', 'Dibakar Banerjee'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which actor made his debut in "Ishq Vishk" (2003)?', options: ['Shahid Kapoor', 'Ranbir Kapoor', 'Imran Khan', 'Sharman Joshi'], correctIdx: 0 },
  { category: 'bollywood', question: 'In "Deewar" (1975), what does Amitabh\'s character say about his mother?', options: ['Mere paas maa hai', 'Main aaj bhi feke hue paise…', 'Tumhara paap mujhe maloom hai', 'Saat saal baad dekha'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which music director composed for "Sholay"?', options: ['R.D. Burman', 'S.D. Burman', 'Naushad', 'Laxmikant-Pyarelal'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which film features the iconic "Ek Do Teen" song performed by Madhuri Dixit?', options: ['Tezaab', 'Ram Lakhan', 'Beta', 'Khalnayak'], correctIdx: 0 },
  { category: 'bollywood', question: 'Who directed "Mughal-e-Azam" (1960)?', options: ['K. Asif', 'Mehboob Khan', 'Bimal Roy', 'Guru Dutt'], correctIdx: 0 },
  { category: 'bollywood', question: 'Deepika Padukone\'s debut Bollywood film was?', options: ['Om Shanti Om', 'Love Aaj Kal', 'Bachna Ae Haseeno', 'Cocktail'], correctIdx: 0 },
  { category: 'bollywood', question: 'Which film stars Ranveer Singh as a Maratha warrior?', options: ['Bajirao Mastani', 'Ram-Leela', 'Padmaavat', 'Simmba'], correctIdx: 0 },

  // ─── CRICKET ──────────────────────────────────────────────────────────────
  { category: 'cricket', question: 'How many runs is a six worth?', options: ['6', '4', '2', '1'], correctIdx: 0 },
  { category: 'cricket', question: 'How many players are in a cricket team?', options: ['11', '10', '12', '9'], correctIdx: 0 },
  { category: 'cricket', question: 'Who is known as "Captain Cool" in cricket?', options: ['MS Dhoni', 'Virat Kohli', 'Rohit Sharma', 'Rahul Dravid'], correctIdx: 0 },
  { category: 'cricket', question: 'In which year did India win the first ODI World Cup?', options: ['1983', '2011', '2007', '1996'], correctIdx: 0 },
  { category: 'cricket', question: 'Who took all 10 wickets in a Test innings for India?', options: ['Anil Kumble', 'Kapil Dev', 'Harbhajan Singh', 'Ashwin'], correctIdx: 0 },
  { category: 'cricket', question: 'Which country has won the most ODI World Cups?', options: ['Australia', 'India', 'West Indies', 'England'], correctIdx: 0 },
  { category: 'cricket', question: 'Who scored 400 not out in a Test match?', options: ['Brian Lara', 'Matthew Hayden', 'Sehwag', 'Sachin'], correctIdx: 0 },
  { category: 'cricket', question: 'Who was India\'s captain in the 1983 World Cup?', options: ['Kapil Dev', 'Sunil Gavaskar', 'Mohinder Amarnath', 'Kirti Azad'], correctIdx: 0 },
  { category: 'cricket', question: 'Which team has won the most IPL titles?', options: ['Mumbai Indians', 'Chennai Super Kings', 'Kolkata Knight Riders', 'Rajasthan Royals'], correctIdx: 0 },
  { category: 'cricket', question: 'How many balls are there in one over?', options: ['6', '4', '8', '5'], correctIdx: 0 },
  { category: 'cricket', question: 'Who has the most runs in international cricket?', options: ['Sachin Tendulkar', 'Ricky Ponting', 'Jacques Kallis', 'Virat Kohli'], correctIdx: 0 },
  { category: 'cricket', question: 'Who hit six sixes in one over in T20 World Cup?', options: ['Yuvraj Singh', 'Herschelle Gibbs', 'Kieron Pollard', 'Chris Gayle'], correctIdx: 0 },
  { category: 'cricket', question: 'Which Indian city hosts the Royal Challengers IPL team?', options: ['Bangalore', 'Mumbai', 'Chennai', 'Kolkata'], correctIdx: 0 },
  { category: 'cricket', question: 'What does LBW stand for?', options: ['Leg Before Wicket', 'Long Ball Wide', 'Left Behind Wicket', 'Leg Bye Wicket'], correctIdx: 0 },
  { category: 'cricket', question: 'Who was the first Indian to score a triple century in Tests?', options: ['Virender Sehwag', 'Sachin Tendulkar', 'Rahul Dravid', 'Karun Nair'], correctIdx: 0 },
  { category: 'cricket', question: 'Which format has 20 overs per side?', options: ['T20', 'ODI', 'Test', 'T10'], correctIdx: 0 },
  { category: 'cricket', question: 'Who won the 2023 Cricket World Cup?', options: ['Australia', 'India', 'England', 'New Zealand'], correctIdx: 0 },
  { category: 'cricket', question: 'Which Indian batter has the most IPL runs?', options: ['Virat Kohli', 'Rohit Sharma', 'MS Dhoni', 'Suresh Raina'], correctIdx: 0 },
  { category: 'cricket', question: 'What is a "duck" in cricket?', options: ['Out for zero', 'A type of shot', 'A field position', 'No ball'], correctIdx: 0 },
  { category: 'cricket', question: 'Who is known as "Hitman" in cricket?', options: ['Rohit Sharma', 'Virat Kohli', 'MS Dhoni', 'Hardik Pandya'], correctIdx: 0 },
  { category: 'cricket', question: 'Which country hosted the first T20 World Cup?', options: ['South Africa', 'England', 'India', 'West Indies'], correctIdx: 0 },
  { category: 'cricket', question: 'Who took a hat-trick in the 1987 World Cup for India?', options: ['Chetan Sharma', 'Kapil Dev', 'Maninder Singh', 'Ravi Shastri'], correctIdx: 0 },
  { category: 'cricket', question: 'What is the length of a cricket pitch in yards?', options: ['22', '20', '24', '18'], correctIdx: 0 },
  { category: 'cricket', question: 'Which Indian bowler has taken the most Test wickets?', options: ['Anil Kumble', 'Kapil Dev', 'Ravichandran Ashwin', 'Harbhajan Singh'], correctIdx: 0 },
  { category: 'cricket', question: 'Who won the 2011 Cricket World Cup?', options: ['India', 'Sri Lanka', 'Pakistan', 'Australia'], correctIdx: 0 },
  { category: 'cricket', question: 'In which city is the Eden Gardens cricket stadium?', options: ['Kolkata', 'Mumbai', 'Delhi', 'Chennai'], correctIdx: 0 },
  { category: 'cricket', question: 'Who holds the record for highest individual Test score in cricket?', options: ['Brian Lara (400*)', 'Sachin Tendulkar (248*)', 'Matthew Hayden (380)', 'Wally Hammond (336*)'], correctIdx: 0 },
  { category: 'cricket', question: 'How many wickets are on a cricket pitch in total (both ends)?', options: ['6', '3', '9', '4'], correctIdx: 0 },
  { category: 'cricket', question: 'Which country invented cricket?', options: ['England', 'Australia', 'India', 'West Indies'], correctIdx: 0 },
  { category: 'cricket', question: 'Which Indian cricketer is called "The Wall"?', options: ['Rahul Dravid', 'Sachin Tendulkar', 'VVS Laxman', 'Anil Kumble'], correctIdx: 0 },
  { category: 'cricket', question: 'What is the maximum number of overs in an ODI match per team?', options: ['50', '40', '60', '45'], correctIdx: 0 },
  { category: 'cricket', question: 'In which city is the Wankhede Stadium located?', options: ['Mumbai', 'Delhi', 'Chennai', 'Pune'], correctIdx: 0 },
  { category: 'cricket', question: 'Who was the first Indian captain to win a Test series in Australia?', options: ['Virat Kohli', 'Anil Kumble', 'MS Dhoni', 'Sourav Ganguly'], correctIdx: 0 },
  { category: 'cricket', question: 'Which team won the inaugural IPL in 2008?', options: ['Rajasthan Royals', 'Mumbai Indians', 'Chennai Super Kings', 'Delhi Daredevils'], correctIdx: 0 },
  { category: 'cricket', question: 'What is Sachin Tendulkar\'s jersey number?', options: ['10', '7', '18', '11'], correctIdx: 0 },
  { category: 'cricket', question: 'Who hit the winning six in the 2011 World Cup final?', options: ['MS Dhoni', 'Virat Kohli', 'Yuvraj Singh', 'Suresh Raina'], correctIdx: 0 },
  { category: 'cricket', question: 'Which country does Jasprit Bumrah represent?', options: ['India', 'Pakistan', 'Sri Lanka', 'Bangladesh'], correctIdx: 0 },
  { category: 'cricket', question: 'What is the name of the fielding position behind the batsman?', options: ['Wicket-keeper', 'Mid-on', 'Slip', 'Fine Leg'], correctIdx: 0 },

  // ─── SCIENCE ──────────────────────────────────────────────────────────────
  { category: 'science', question: 'What is the chemical symbol for water?', options: ['H₂O', 'CO₂', 'NaCl', 'O₂'], correctIdx: 0 },
  { category: 'science', question: 'How many planets are in our solar system?', options: ['8', '9', '7', '10'], correctIdx: 0 },
  { category: 'science', question: 'What is the speed of light (approx) in km/s?', options: ['300,000', '150,000', '450,000', '100,000'], correctIdx: 0 },
  { category: 'science', question: 'Which gas do plants absorb during photosynthesis?', options: ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen'], correctIdx: 0 },
  { category: 'science', question: 'What is the powerhouse of the cell?', options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Chloroplast'], correctIdx: 0 },
  { category: 'science', question: 'What is the atomic number of hydrogen?', options: ['1', '2', '0', '8'], correctIdx: 0 },
  { category: 'science', question: 'Which planet is closest to the Sun?', options: ['Mercury', 'Venus', 'Earth', 'Mars'], correctIdx: 0 },
  { category: 'science', question: 'What is the chemical symbol for gold?', options: ['Au', 'Ag', 'Gd', 'Go'], correctIdx: 0 },
  { category: 'science', question: 'How many bones are in an adult human body?', options: ['206', '208', '200', '212'], correctIdx: 0 },
  { category: 'science', question: 'What force keeps planets in orbit around the Sun?', options: ['Gravity', 'Magnetism', 'Friction', 'Electrostatic force'], correctIdx: 0 },
  { category: 'science', question: 'What is the boiling point of water at sea level?', options: ['100°C', '90°C', '80°C', '120°C'], correctIdx: 0 },
  { category: 'science', question: 'Which is the largest planet in our solar system?', options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], correctIdx: 0 },
  { category: 'science', question: 'What is the most abundant gas in Earth\'s atmosphere?', options: ['Nitrogen', 'Oxygen', 'Carbon dioxide', 'Argon'], correctIdx: 0 },
  { category: 'science', question: 'DNA stands for?', options: ['Deoxyribonucleic Acid', 'Dioxynuclear Acid', 'Dinuclear Acid', 'Deoxynuclear Amino'], correctIdx: 0 },
  { category: 'science', question: 'What is the unit of electric current?', options: ['Ampere', 'Volt', 'Watt', 'Ohm'], correctIdx: 0 },
  { category: 'science', question: 'Which planet is known as the Red Planet?', options: ['Mars', 'Jupiter', 'Venus', 'Saturn'], correctIdx: 0 },
  { category: 'science', question: 'What is the chemical symbol for iron?', options: ['Fe', 'Ir', 'In', 'Fr'], correctIdx: 0 },
  { category: 'science', question: 'What type of energy does the Sun primarily produce?', options: ['Nuclear fusion energy', 'Nuclear fission energy', 'Chemical energy', 'Kinetic energy'], correctIdx: 0 },
  { category: 'science', question: 'How many chambers does a human heart have?', options: ['4', '2', '3', '6'], correctIdx: 0 },
  { category: 'science', question: 'What is the SI unit of force?', options: ['Newton', 'Joule', 'Pascal', 'Watt'], correctIdx: 0 },
  { category: 'science', question: 'Which organ produces insulin in the human body?', options: ['Pancreas', 'Liver', 'Kidney', 'Spleen'], correctIdx: 0 },
  { category: 'science', question: 'What is the speed of sound in air (approx) in m/s?', options: ['343', '300', '200', '400'], correctIdx: 0 },
  { category: 'science', question: 'Which vitamin is produced by the body in sunlight?', options: ['Vitamin D', 'Vitamin C', 'Vitamin A', 'Vitamin B12'], correctIdx: 0 },
  { category: 'science', question: 'What is the chemical symbol for sodium?', options: ['Na', 'So', 'Sd', 'Sn'], correctIdx: 0 },
  { category: 'science', question: 'How many chromosomes do humans normally have?', options: ['46', '48', '44', '23'], correctIdx: 0 },
  { category: 'science', question: 'What is the hardest natural substance on Earth?', options: ['Diamond', 'Quartz', 'Topaz', 'Corundum'], correctIdx: 0 },
  { category: 'science', question: 'The study of stars and galaxies is called?', options: ['Astronomy', 'Astrology', 'Astrophysics', 'Cosmology'], correctIdx: 0 },
  { category: 'science', question: 'What is the smallest unit of matter?', options: ['Atom', 'Molecule', 'Electron', 'Quark'], correctIdx: 0 },
  { category: 'science', question: 'Which blood type is called the "universal donor"?', options: ['O negative', 'AB positive', 'A positive', 'B negative'], correctIdx: 0 },
  { category: 'science', question: 'What is the formula for Newton\'s second law of motion?', options: ['F = ma', 'E = mc²', 'P = mv', 'W = Fd'], correctIdx: 0 },
  { category: 'science', question: 'Which element has the highest melting point?', options: ['Tungsten', 'Iron', 'Carbon', 'Platinum'], correctIdx: 0 },
  { category: 'science', question: 'What is the approximate age of the Earth?', options: ['4.5 billion years', '13.8 billion years', '1 billion years', '6000 years'], correctIdx: 0 },
  { category: 'science', question: 'What is the pH of pure water?', options: ['7', '0', '14', '5'], correctIdx: 0 },
  { category: 'science', question: 'Which planet has the most moons?', options: ['Saturn', 'Jupiter', 'Uranus', 'Neptune'], correctIdx: 0 },
  { category: 'science', question: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Processing Unit', 'Core Processing Unit', 'Central Peripheral Unit'], correctIdx: 0 },
  { category: 'science', question: 'Light travels in a?', options: ['Straight line', 'Curved path', 'Zigzag path', 'Wave pattern only'], correctIdx: 0 },
  { category: 'science', question: 'How many teeth does an adult human have (including wisdom teeth)?', options: ['32', '28', '30', '34'], correctIdx: 0 },
  { category: 'science', question: 'What is the chemical formula for table salt?', options: ['NaCl', 'KCl', 'CaCl₂', 'MgCl₂'], correctIdx: 0 },
]

export const CATEGORY_LABELS = {
  gk: { en: 'India GK', hi: 'भारत GK' },
  bollywood: { en: 'Bollywood', hi: 'बॉलीवुड' },
  cricket: { en: 'Cricket', hi: 'क्रिकेट' },
  science: { en: 'Science', hi: 'विज्ञान' },
}

export const CATEGORIES = Object.keys(CATEGORY_LABELS)

/**
 * Get `count` random questions for the given category.
 * Category 'random' picks from all categories.
 */
export function getQuestions(category, count = 10) {
  const pool = category === 'random'
    ? QUESTIONS
    : QUESTIONS.filter(q => q.category === category)
  return shuffle(pool).slice(0, count)
}
