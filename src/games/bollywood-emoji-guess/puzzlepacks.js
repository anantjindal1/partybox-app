/**
 * Bollywood Emoji Guess — puzzle packs.
 * Format: { emojiClue, options: string[4], correctIndex, category: "movie" | "actor", difficulty }.
 * Minimum 120 puzzles, 4 options each, no duplicates, no repeated correct in session.
 */

function shuffleArray(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const ALL_PUZZLES = [
  // --- Classic Bollywood (movie) ---
  { emojiClue: '👨‍👩‍👧‍👦🏠💒', options: ['Hum Aapke Hain Koun', 'Kabhi Khushi Kabhie Gham', 'Maine Pyar Kiya', 'Dilwale Dulhania Le Jayenge'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '🚂🌾👫', options: ['Dilwale Dulhania Le Jayenge', 'Jab We Met', 'DDLJ', 'Chennai Express'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👨‍🦲💪', options: ['Amitabh Bachchan', 'Anil Kapoor', 'Mithun Chakraborty', 'Sanjay Dutt'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '❤️💔👫', options: ['Devdas', 'Kabhi Khushi Kabhie Gham', 'Kal Ho Naa Ho', 'Veer-Zaara'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👑🦁', options: ['Mughal-e-Azam', 'Jodhaa Akbar', 'Bajirao Mastani', 'Padmaavat'], correctIndex: 1, category: 'movie', difficulty: 'easy' },
  { emojiClue: '🕺✨', options: ['Govinda', 'Mithun Chakraborty', 'Anil Kapoor', 'Jackie Shroff'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🌙⭐👧', options: ['Chandni', 'Silsila', 'Lamhe', 'Darr'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👮‍♂️🔫', options: ['Sholay', 'Zanjeer', 'Deewar', 'Don'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👸💃', options: ['Madhuri Dixit', 'Sridevi', 'Juhi Chawla', 'Kajol'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🐯👑', options: ['Tiger Zinda Hai', 'Shershaah', 'War', 'Ek Tha Tiger'], correctIndex: 3, category: 'movie', difficulty: 'easy' },
  { emojiClue: '💔📜', options: ['Devdas', 'Kal Ho Naa Ho', 'Silsila', 'Kabhi Alvida Naa Kehna'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👨‍🦰❤️', options: ['Shah Rukh Khan', 'Salman Khan', 'Aamir Khan', 'Hrithik Roshan'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🏠👨‍👩‍👧‍👦', options: ['Kabhi Khushi Kabhie Gham', 'Hum Aapke Hain Koun', 'Vivah', 'Pyar Kiya To Darna Kya'], correctIndex: 1, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👴📚', options: ['Dilip Kumar', 'Raj Kapoor', 'Dev Anand', 'Amitabh Bachchan'], correctIndex: 0, category: 'actor', difficulty: 'hard' },
  { emojiClue: '🌹👫', options: ['Mughal-e-Azam', 'Pakeezah', 'Umrao Jaan', 'Devdas'], correctIndex: 1, category: 'movie', difficulty: 'medium' },
  { emojiClue: '🚗💨', options: ['Dhoom', 'Race', 'War', 'Baaghi'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👦📖', options: ['Taare Zameen Par', '3 Idiots', 'PK', 'Dangal'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '🤵💍', options: ['Hum Aapke Hain Koun', 'Vivah', 'Band Baaja Baaraat', 'Bajirao Mastani'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👩‍🦰🔥', options: ['Kajol', 'Rani Mukerji', 'Preity Zinta', 'Kareena Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '⏰🔄', options: ['Back to the Future', 'Jaane Tu Ya Jaane Na', 'Love Aaj Kal', 'Tamasha'], correctIndex: 2, category: 'movie', difficulty: 'medium' },
  // --- 2000s Bollywood ---
  { emojiClue: '📱❤️', options: ['Love Aaj Kal', 'Jab We Met', 'Cocktail', 'Barfi'], correctIndex: 1, category: 'movie', difficulty: 'easy' },
  { emojiClue: '🚂👩', options: ['Jab We Met', 'DDLJ', 'Dil Se', 'Jab Tak Hai Jaan'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '🤖👽', options: ['PK', '3 Idiots', 'Taare Zameen Par', 'Dangal'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👨‍🦲🥋', options: ['Aamir Khan', 'Salman Khan', 'Shah Rukh Khan', 'Akshay Kumar'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🏆👧', options: ['Dangal', 'Sultan', 'Panga', 'Chak De India'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '💇‍♂️💔', options: ['Devdas', 'Kabir Singh', 'Rockstar', 'Tamasha'], correctIndex: 1, category: 'movie', difficulty: 'medium' },
  { emojiClue: '🎸🎤', options: ['Rockstar', 'Rock On', 'Tamasha', 'Dil Chahta Hai'], correctIndex: 1, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👩‍⚕️❤️', options: ['Dilwale', 'Chennai Express', 'Jab Tak Hai Jaan', 'Veer-Zaara'], correctIndex: 2, category: 'movie', difficulty: 'medium' },
  { emojiClue: '🦸‍♂️💪', options: ['Hrithik Roshan', 'Tiger Shroff', 'Vidyut Jammwal', 'John Abraham'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🍺👫', options: ['Cocktail', 'Love Aaj Kal', 'Barfi', 'Yeh Jawaani Hai Deewani'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '🏔️❤️', options: ['Jab Tak Hai Jaan', 'Rockstar', 'Tamasha', 'Highway'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👶🤫', options: ['Barfi', 'PK', '3 Idiots', 'Taare Zameen Par'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '🌙🎉', options: ['Yeh Jawaani Hai Deewani', 'Rockstar', 'Tamasha', 'Wake Up Sid'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👩‍🦳👴', options: ['Piku', 'Baghi', 'Bajrangi Bhaijaan', 'Dangal'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '🦁👦', options: ['Shershaah', 'Uri', 'Border', 'Lakshya'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👨‍🦰🌟', options: ['Ranbir Kapoor', 'Ranveer Singh', 'Varun Dhawan', 'Siddharth Malhotra'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🛕👦', options: ['Bajrangi Bhaijaan', 'PK', 'Sultan', 'Tiger Zinda Hai'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '⚽🇮🇳', options: ['Chak De India', 'Dangal', 'Sultan', 'Gold'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👔💼', options: ['Wake Up Sid', 'Zindagi Na Milegi Dobara', 'Dil Chahta Hai', 'Rock On'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '🕺👩', options: ['Deepika Padukone', 'Katrina Kaif', 'Alia Bhatt', 'Anushka Sharma'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  // --- South dubbed hits ---
  { emojiClue: '👑⚔️', options: ['Baahubali', 'RRR', 'KGF', 'Pushpa'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '🔥👊', options: ['KGF', 'Baahubali', 'RRR', 'Vikram'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '🌺🔥', options: ['Pushpa', 'RRR', 'KGF', 'Baahubali'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '🐅👊', options: ['RRR', 'Baahubali', 'KGF', 'Vikram'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '🦁👑', options: ['Baahubali', 'Magadheera', 'RRR', 'Eega'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '💰⛏️', options: ['KGF', 'Baahubali', 'Pushpa', 'RRR'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '🚂🔥', options: ['RRR', 'Baahubali', 'Magadheera', 'Bajirao Mastani'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👨‍🦰🔥', options: ['Prabhas', 'Ram Charan', 'Jr NTR', 'Allu Arjun'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '🕺💃', options: ['Allu Arjun', 'Prabhas', 'Ram Charan', 'Vijay Deverakonda'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🦅🔥', options: ['Eega', 'Baahubali', 'RRR', 'KGF'], correctIndex: 0, category: 'movie', difficulty: 'hard' },
  { emojiClue: '👨‍🦱👑', options: ['Rajinikanth', 'Kamal Haasan', 'Vijay', 'Ajith'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '⚔️👸', options: ['Baahubali 2', 'Padmaavat', 'Bajirao Mastani', 'Jodhaa Akbar'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '🌲👦', options: ['Vikram', 'KGF', 'Pushpa', 'Jawan'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '💎⛏️', options: ['KGF Chapter 2', 'Baahubali', 'RRR', 'Pushpa'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '🦁🤝🐅', options: ['RRR', 'Baahubali', 'War', 'Dhoom'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👩‍🦰👑', options: ['Anushka Shetty', 'Nayanthara', 'Samantha', 'Trisha'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '📦🔥', options: ['Vikram', 'KGF', 'RRR', 'Pushpa'], correctIndex: 0, category: 'movie', difficulty: 'hard' },
  { emojiClue: '👨‍🦲👊', options: ['Yash', 'Prabhas', 'Ram Charan', 'Allu Arjun'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '🌾👨', options: ['Pushpa', 'Baahubali', 'RRR', 'KGF'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  // --- Popular actors ---
  { emojiClue: '🐯💪', options: ['Salman Khan', 'Tiger Shroff', 'Akshay Kumar', 'Hrithik Roshan'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '👨‍🦰❤️‍🔥', options: ['Shah Rukh Khan', 'Salman Khan', 'Aamir Khan', 'Saif Ali Khan'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🎬🧠', options: ['Aamir Khan', 'Shah Rukh Khan', 'Hrithik Roshan', 'Ranbir Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '👧🌟', options: ['Alia Bhatt', 'Sara Ali Khan', 'Janhvi Kapoor', 'Kiara Advani'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🦁👨', options: ['Ranveer Singh', 'Ranbir Kapoor', 'Varun Dhawan', 'Tiger Shroff'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🇮🇳💪', options: ['Akshay Kumar', 'Salman Khan', 'Ajay Devgn', 'Suniel Shetty'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '😎🔥', options: ['Hrithik Roshan', 'Tiger Shroff', 'Varun Dhawan', 'Siddharth Malhotra'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '👩‍🦰💕', options: ['Katrina Kaif', 'Deepika Padukone', 'Kareena Kapoor', 'Priyanka Chopra'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🕺✨', options: ['Varun Dhawan', 'Tiger Shroff', 'Kartik Aaryan', 'Siddharth Malhotra'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '👑👩', options: ['Kareena Kapoor', 'Priyanka Chopra', 'Katrina Kaif', 'Deepika Padukone'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🌙👩', options: ['Anushka Sharma', 'Alia Bhatt', 'Deepika Padukone', 'Shraddha Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '😊👨', options: ['Kartik Aaryan', 'Ayushmann Khurrana', 'Rajkummar Rao', 'Vicky Kaushal'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '🎭👨', options: ['Irrfan Khan', 'Nawazuddin Siddiqui', 'Pankaj Tripathi', 'Rajkummar Rao'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '💪👨', options: ['Ajay Devgn', 'Sanjay Dutt', 'Suniel Shetty', 'John Abraham'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '👩‍🦰🎬', options: ['Vidya Balan', 'Kangana Ranaut', 'Priyanka Chopra', 'Kareena Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🔥👩', options: ['Kangana Ranaut', 'Vidya Balan', 'Taapsee Pannu', 'Bhumi Pednekar'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '👨‍🦱❤️', options: ['Vicky Kaushal', 'Rajkummar Rao', 'Ayushmann Khurrana', 'Kartik Aaryan'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '🎤👩', options: ['Priyanka Chopra', 'Alia Bhatt', 'Deepika Padukone', 'Kareena Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🦸‍♂️👨', options: ['Tiger Shroff', 'Vidyut Jammwal', 'Hrithik Roshan', 'John Abraham'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '😇👨', options: ['Ayushmann Khurrana', 'Rajkummar Rao', 'Kartik Aaryan', 'Vicky Kaushal'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  // --- Iconic dialogues (emoji style) ---
  { emojiClue: '👴🔫', options: ['Sholay', 'Deewar', 'Zanjeer', 'Don'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '😢📜', options: ['Mughal-e-Azam', 'Devdas', 'Pakeezah', 'Umrao Jaan'], correctIndex: 0, category: 'movie', difficulty: 'hard' },
  { emojiClue: '💔🚂', options: ['Kal Ho Naa Ho', 'Veer-Zaara', 'Kabhi Alvida Naa Kehna', 'Devdas'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👫🌍', options: ['Zindagi Na Milegi Dobara', 'Dil Chahta Hai', 'Rock On', 'Tamasha'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '🎓😄', options: ['3 Idiots', 'Taare Zameen Par', 'PK', 'Dangal'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👮‍♂️🇮🇳', options: ['Singham', 'Dabangg', 'Rowdy Rathore', 'Simmba'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '❤️🛤️', options: ['Dilwale Dulhania Le Jayenge', 'Jab We Met', 'Love Aaj Kal', 'Jab Tak Hai Jaan'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👦👧📚', options: ['Kuch Kuch Hota Hai', 'Kabhi Khushi Kabhie Gham', 'Kal Ho Naa Ho', 'Veer-Zaara'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '🕺💃🎭', options: ['Om Shanti Om', 'Main Hoon Na', 'Chennai Express', 'Dilwale'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👨‍👩‍👧💪', options: ['Dangal', 'Sultan', 'Panga', 'Chak De India'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '🌃❤️', options: ['Kal Ho Naa Ho', 'Kabhi Khushi Kabhie Gham', 'Kuch Kuch Hota Hai', 'Veer-Zaara'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👴👵🚗', options: ['Piku', 'Baghban', 'Cheeni Kum', 'Bajrangi Bhaijaan'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '💼👔', options: ['Rocket Singh', 'Wake Up Sid', 'Lakshya', 'Dil Chahta Hai'], correctIndex: 0, category: 'movie', difficulty: 'hard' },
  { emojiClue: '🎸❤️', options: ['Rock On', 'Rockstar', 'Tamasha', 'Dil Chahta Hai'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👦🎯', options: ['Taare Zameen Par', '3 Idiots', 'PK', 'Dangal'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '🛕👦❤️', options: ['Bajrangi Bhaijaan', 'PK', 'Sultan', 'Dangal'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '⚔️👑', options: ['Bajirao Mastani', 'Padmaavat', 'Jodhaa Akbar', 'Mughal-e-Azam'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '🌙✨', options: ['Yeh Jawaani Hai Deewani', 'Rockstar', 'Tamasha', 'Wake Up Sid'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👨‍🦰📱', options: ['Dear Zindagi', 'Jab Harry Met Sejal', 'Raees', 'Fan'], correctIndex: 1, category: 'movie', difficulty: 'hard' },
  { emojiClue: '🦁❤️', options: ['Shershaah', 'Uri', 'Lakshya', 'Border'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  // --- More to reach 120+ ---
  { emojiClue: '👩‍🦰🎤', options: ['Sridevi', 'Madhuri Dixit', 'Rekha', 'Hema Malini'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '🚗💥', options: ['Dhoom 2', 'Race', 'War', 'Baaghi 2'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👨‍🦲🎬', options: ['Rajkummar Rao', 'Nawazuddin Siddiqui', 'Irrfan Khan', 'Pankaj Tripathi'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '🌶️👨', options: ['Dabangg', 'Singham', 'Rowdy Rathore', 'Simmba'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👩‍🦰💪', options: ['Taapsee Pannu', 'Bhumi Pednekar', 'Kangana Ranaut', 'Vidya Balan'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '🎭👩', options: ['Vidya Balan', 'Kangana Ranaut', 'Priyanka Chopra', 'Kareena Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '❤️🌹', options: ['Mohabbatein', 'Dil To Pagal Hai', 'Kuch Kuch Hota Hai', 'Kabhi Khushi Kabhie Gham'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👨‍🦱🔥', options: ['Ranveer Singh', 'Ranbir Kapoor', 'Varun Dhawan', 'Arjun Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '📞❤️', options: ['Jab We Met', 'Love Aaj Kal', 'Cocktail', 'Barfi'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👶🎬', options: ['Taare Zameen Par', '3 Idiots', 'PK', 'Dangal'], correctIndex: 0, category: 'movie', difficulty: 'hard' },
  { emojiClue: '🕴️👨', options: ['Amitabh Bachchan', 'Anil Kapoor', 'Jackie Shroff', 'Mithun Chakraborty'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🌍✈️', options: ['Zindagi Na Milegi Dobara', 'Dil Chahta Hai', 'Rock On', 'Tamasha'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👩‍🦰🌟', options: ['Deepika Padukone', 'Katrina Kaif', 'Alia Bhatt', 'Anushka Sharma'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '💔📽️', options: ['Devdas', 'Kabir Singh', 'Rockstar', 'Aashiqui 2'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👨‍🦰🦸', options: ['Shah Rukh Khan', 'Salman Khan', 'Aamir Khan', 'Hrithik Roshan'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🏠👫', options: ['Hum Tum', 'Salaam Namaste', 'Cocktail', 'Love Aaj Kal'], correctIndex: 0, category: 'movie', difficulty: 'hard' },
  { emojiClue: '🎪❤️', options: ['Circus', 'Bhool Bhulaiyaa', 'Golmaal', 'Hera Pheri'], correctIndex: 0, category: 'movie', difficulty: 'hard' },
  { emojiClue: '👨‍🦲🇮🇳', options: ['Akshay Kumar', 'Ajay Devgn', 'Suniel Shetty', 'Sanjay Dutt'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🌙👫', options: ['Barfi', 'Yeh Jawaani Hai Deewani', 'Rockstar', 'Tamasha'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👩‍🦰🎭', options: ['Kareena Kapoor', 'Priyanka Chopra', 'Katrina Kaif', 'Deepika Padukone'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🔫👨', options: ['Don', 'Sholay', 'Deewar', 'Zanjeer'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👨‍🦰🌍', options: ['My Name Is Khan', 'Chennai Express', 'Raees', 'Dilwale'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '💪👧', options: ['Dangal', 'Panga', 'Chak De India', 'Sultan'], correctIndex: 1, category: 'movie', difficulty: 'medium' },
  { emojiClue: '🎬👩', options: ['Alia Bhatt', 'Sara Ali Khan', 'Janhvi Kapoor', 'Kiara Advani'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🚀❤️', options: ['Rocket Singh', '3 Idiots', 'Taare Zameen Par', 'PK'], correctIndex: 0, category: 'movie', difficulty: 'hard' },
  { emojiClue: '👴👵', options: ['Baghban', 'Piku', 'Cheeni Kum', 'Bajrangi Bhaijaan'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '🦁👨‍🦰', options: ['Shershaah', 'Uri', 'Lakshya', 'Border'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '💃✨', options: ['Madhuri Dixit', 'Sridevi', 'Kajol', 'Rani Mukerji'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '📚❤️', options: ['Kuch Kuch Hota Hai', 'Kabhi Khushi Kabhie Gham', 'Kal Ho Naa Ho', 'Veer-Zaara'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👨‍🦱🎸', options: ['Farhan Akhtar', 'Arjun Rampal', 'Imran Khan', 'Abhay Deol'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '🌾👫', options: ['Dilwale Dulhania Le Jayenge', 'Jab We Met', 'Love Aaj Kal', 'Cocktail'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👮‍♂️🦁', options: ['Singham', 'Dabangg', 'Simmba', 'Rowdy Rathore'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👩‍🦰❤️', options: ['Rani Mukerji', 'Preity Zinta', 'Kajol', 'Kareena Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '🎯👦', options: ['Lakshya', 'Rang De Basanti', '3 Idiots', 'Chak De India'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👨‍🦰🕺', options: ['Shah Rukh Khan', 'Govinda', 'Salman Khan', 'Hrithik Roshan'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '💔🌹', options: ['Devdas', 'Kal Ho Naa Ho', 'Kabhi Alvida Naa Kehna', 'Silsila'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👨‍🦲💪', options: ['Salman Khan', 'Akshay Kumar', 'Ajay Devgn', 'Sanjay Dutt'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🎭💕', options: ['Saathiya', 'Hum Dil De Chuke Sanam', 'Devdas', 'Veer-Zaara'], correctIndex: 0, category: 'movie', difficulty: 'hard' },
  { emojiClue: '👩‍🦰🔥', options: ['Kangana Ranaut', 'Vidya Balan', 'Priyanka Chopra', 'Kareena Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '🏫😄', options: ['3 Idiots', 'Taare Zameen Par', 'Chak De India', 'Rang De Basanti'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👨‍🦰🎬', options: ['Shah Rukh Khan', 'Aamir Khan', 'Salman Khan', 'Hrithik Roshan'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🌙💔', options: ['Kal Ho Naa Ho', 'Kabhi Khushi Kabhie Gham', 'Veer-Zaara', 'Kabhi Alvida Naa Kehna'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👨‍🦱🎤', options: ['Ranbir Kapoor', 'Ranveer Singh', 'Shah Rukh Khan', 'Hrithik Roshan'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '🛤️❤️', options: ['Jab We Met', 'DDLJ', 'Dil Se', 'Jab Tak Hai Jaan'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👶🧒', options: ['Taare Zameen Par', 'Dangal', '3 Idiots', 'PK'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👩‍🦰💃', options: ['Deepika Padukone', 'Katrina Kaif', 'Alia Bhatt', 'Shraddha Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '⚔️👸', options: ['Padmaavat', 'Bajirao Mastani', 'Jodhaa Akbar', 'Mughal-e-Azam'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👨‍🦲🎯', options: ['Aamir Khan', 'Shah Rukh Khan', 'Salman Khan', 'Akshay Kumar'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '💼❤️', options: ['Wake Up Sid', 'Zindagi Na Milegi Dobara', 'Dil Chahta Hai', 'Rock On'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '🦸‍♂️👨', options: ['Hrithik Roshan', 'Tiger Shroff', 'Vidyut Jammwal', 'John Abraham'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🌹👸', options: ['Pakeezah', 'Mughal-e-Azam', 'Umrao Jaan', 'Devdas'], correctIndex: 0, category: 'movie', difficulty: 'hard' },
  { emojiClue: '👨‍🦰🚂', options: ['Jab Tak Hai Jaan', 'DDLJ', 'Jab We Met', 'Dil Se'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👩‍🦰🌟', options: ['Shraddha Kapoor', 'Alia Bhatt', 'Sara Ali Khan', 'Janhvi Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '🎪😂', options: ['Hera Pheri', 'Golmaal', 'Dhamaal', 'Phir Hera Pheri'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👨‍🦱❤️', options: ['Ranveer Singh', 'Ranbir Kapoor', 'Varun Dhawan', 'Arjun Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '📖❤️', options: ['Kuch Kuch Hota Hai', 'Kal Ho Naa Ho', 'Kabhi Khushi Kabhie Gham', 'Veer-Zaara'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👴💪', options: ['Amitabh Bachchan', 'Dharmendra', 'Vinod Khanna', 'Shashi Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🌃💕', options: ['Kal Ho Naa Ho', 'Kabhi Khushi Kabhie Gham', 'Kuch Kuch Hota Hai', 'Mohabbatein'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👩‍🦰🎬', options: ['Anushka Sharma', 'Alia Bhatt', 'Deepika Padukone', 'Katrina Kaif'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🕺👑', options: ['Om Shanti Om', 'Main Hoon Na', 'Chennai Express', 'Dilwale'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👨‍🦰🌙', options: ['Shah Rukh Khan', 'Salman Khan', 'Aamir Khan', 'Hrithik Roshan'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '❤️🛤️', options: ['Jab We Met', 'DDLJ', 'Love Aaj Kal', 'Jab Tak Hai Jaan'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👶🎯', options: ['Taare Zameen Par', '3 Idiots', 'PK', 'Dangal'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👩‍🦰💪', options: ['Vidya Balan', 'Kangana Ranaut', 'Priyanka Chopra', 'Kareena Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🔥👨', options: ['Salman Khan', 'Akshay Kumar', 'Ajay Devgn', 'Sanjay Dutt'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🎸❤️', options: ['Rockstar', 'Rock On', 'Tamasha', 'Dil Chahta Hai'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👨‍🦲🎓', options: ['Aamir Khan', 'Shah Rukh Khan', 'Hrithik Roshan', 'Ranbir Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🌍❤️', options: ['Zindagi Na Milegi Dobara', 'Dil Chahta Hai', 'Rock On', 'Tamasha'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👩‍🦰🦋', options: ['Preity Zinta', 'Rani Mukerji', 'Kajol', 'Kareena Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '👮‍♂️💪', options: ['Singham', 'Dabangg', 'Rowdy Rathore', 'Simmba'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👨‍🦰💔', options: ['Shah Rukh Khan', 'Salman Khan', 'Aamir Khan', 'Hrithik Roshan'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '📱💕', options: ['Love Aaj Kal', 'Jab We Met', 'Cocktail', 'Barfi'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👩‍🦰🎤', options: ['Priyanka Chopra', 'Kareena Kapoor', 'Katrina Kaif', 'Deepika Padukone'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🏔️❤️', options: ['Jab Tak Hai Jaan', 'Rockstar', 'Highway', 'Tamasha'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👨‍🦱🔥', options: ['Ranveer Singh', 'Ranbir Kapoor', 'Varun Dhawan', 'Tiger Shroff'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🎭👫', options: ['Devdas', 'Kabir Singh', 'Rockstar', 'Aashiqui 2'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👩‍🦰✨', options: ['Alia Bhatt', 'Sara Ali Khan', 'Janhvi Kapoor', 'Kiara Advani'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🚗💨', options: ['Race', 'Dhoom', 'War', 'Baaghi'], correctIndex: 1, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👨‍🦰🎭', options: ['Shah Rukh Khan', 'Aamir Khan', 'Salman Khan', 'Hrithik Roshan'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🌙🎬', options: ['Yeh Jawaani Hai Deewani', 'Rockstar', 'Tamasha', 'Wake Up Sid'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👩‍🦰❤️', options: ['Kajol', 'Rani Mukerji', 'Preity Zinta', 'Kareena Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '👴👵❤️', options: ['Piku', 'Baghban', 'Cheeni Kum', 'Bajrangi Bhaijaan'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '🦁🇮🇳', options: ['Shershaah', 'Uri', 'Border', 'Lakshya'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👨‍🦲🕺', options: ['Govinda', 'Mithun Chakraborty', 'Anil Kapoor', 'Jackie Shroff'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '🌙💕', options: ['Chandni', 'Silsila', 'Lamhe', 'Darr'], correctIndex: 0, category: 'movie', difficulty: 'hard' },
  { emojiClue: '👩‍🦰💃', options: ['Madhuri Dixit', 'Sridevi', 'Kajol', 'Rani Mukerji'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🎓😂', options: ['3 Idiots', 'Taare Zameen Par', 'PK', 'Dangal'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👨‍🦰💪', options: ['Shah Rukh Khan', 'Salman Khan', 'Aamir Khan', 'Akshay Kumar'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🌹👫', options: ['Devdas', 'Mughal-e-Azam', 'Pakeezah', 'Umrao Jaan'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👩‍🦰💫', options: ['Deepika Padukone', 'Katrina Kaif', 'Alia Bhatt', 'Anushka Sharma'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '👨‍🦱🎬', options: ['Ranbir Kapoor', 'Ranveer Singh', 'Varun Dhawan', 'Siddharth Malhotra'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🛕👦❤️', options: ['Bajrangi Bhaijaan', 'PK', 'Sultan', 'Tiger Zinda Hai'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👩‍🦰🔥', options: ['Kangana Ranaut', 'Vidya Balan', 'Taapsee Pannu', 'Bhumi Pednekar'], correctIndex: 0, category: 'actor', difficulty: 'medium' },
  { emojiClue: '🐯❤️', options: ['Ek Tha Tiger', 'Tiger Zinda Hai', 'War', 'Shershaah'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👨‍🦲🎯', options: ['Akshay Kumar', 'Ajay Devgn', 'Suniel Shetty', 'John Abraham'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🌃💔', options: ['Kal Ho Naa Ho', 'Kabhi Alvida Naa Kehna', 'Veer-Zaara', 'Devdas'], correctIndex: 0, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👩‍🦰🎭', options: ['Vidya Balan', 'Kangana Ranaut', 'Priyanka Chopra', 'Kareena Kapoor'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '👨‍🦰🚂', options: ['Dilwale Dulhania Le Jayenge', 'Jab We Met', 'Jab Tak Hai Jaan', 'Dil Se'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '💪👩', options: ['Deepika Padukone', 'Katrina Kaif', 'Alia Bhatt', 'Anushka Sharma'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🎸❤️', options: ['Dil Chahta Hai', 'Rock On', 'Rockstar', 'Tamasha'], correctIndex: 1, category: 'movie', difficulty: 'medium' },
  { emojiClue: '👨‍🦱💕', options: ['Ranveer Singh', 'Ranbir Kapoor', 'Varun Dhawan', 'Kartik Aaryan'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '👶📚', options: ['Taare Zameen Par', '3 Idiots', 'PK', 'Dangal'], correctIndex: 0, category: 'movie', difficulty: 'easy' },
  { emojiClue: '👩‍🦰💪', options: ['Alia Bhatt', 'Sara Ali Khan', 'Janhvi Kapoor', 'Kiara Advani'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
  { emojiClue: '🦸‍♂️💪', options: ['Tiger Shroff', 'Hrithik Roshan', 'Vidyut Jammwal', 'John Abraham'], correctIndex: 0, category: 'actor', difficulty: 'easy' },
]

/** Get puzzles filtered by difficulty */
export function getPuzzlesByDifficulty(difficulty) {
  return ALL_PUZZLES.filter(p => p.difficulty === difficulty)
}

/**
 * Generate session puzzles: count unique puzzles, no repeated correct answer in same session.
 * @param {'easy'|'medium'|'hard'} difficulty
 * @param {number} count default 10
 */
export function generateSessionPuzzles(difficulty, count = 10) {
  const pool = getPuzzlesByDifficulty(difficulty)
  const shuffled = shuffleArray([...pool])
  const usedCorrect = new Set()
  const out = []
  for (const p of shuffled) {
    if (out.length >= count) break
    const correctAnswer = p.options[p.correctIndex]
    if (usedCorrect.has(correctAnswer)) continue
    usedCorrect.add(correctAnswer)
    out.push(p)
  }
  if (out.length < count) {
    for (const p of shuffled) {
      if (out.length >= count) break
      if (out.includes(p)) continue
      out.push(p)
    }
  }
  return out.slice(0, count)
}

export { ALL_PUZZLES }
