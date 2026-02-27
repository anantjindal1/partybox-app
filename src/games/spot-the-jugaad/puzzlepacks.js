/**
 * Spot the Jugaad — puzzle packs. Each puzzle has 4 items; 3 share a category, 1 is odd.
 * items[correctIndex] is the odd one out. No duplicate puzzles.
 */

function shuffleArray(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** All puzzles: { items (words or image URLs), correctIndex, category, difficulty }. correctIndex = odd one out. */
const ALL_PUZZLES = [
  // --- Animals vs Object ---
  { items: ['Dog', 'Cat', 'Cow', 'Car'], correctIndex: 3, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Lion', 'Tiger', 'Bear', 'Phone'], correctIndex: 3, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Frog', 'Fox', 'Rabbit', 'Bulb'], correctIndex: 3, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Tooth', 'Dog', 'Cat', 'Cow'], correctIndex: 0, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Eagle', 'Bird', 'Chick', 'Key'], correctIndex: 3, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Book', 'Elephant', 'Giraffe', 'Deer'], correctIndex: 0, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Dog', 'Horse', 'Sheep', 'Chair'], correctIndex: 3, category: 'Animals vs Object', difficulty: 'medium' },
  { items: ['Crab', 'Fish', 'Trout', 'Clock'], correctIndex: 3, category: 'Animals vs Object', difficulty: 'medium' },
  { items: ['Bag', 'Parrot', 'Turtle', 'Snake'], correctIndex: 0, category: 'Animals vs Object', difficulty: 'medium' },
  { items: ['Mouse', 'Hamster', 'Squirrel', 'TV'], correctIndex: 3, category: 'Animals vs Object', difficulty: 'medium' },
  { items: ['Owl', 'Bat', 'Wolf', 'Sofa'], correctIndex: 3, category: 'Animals vs Object', difficulty: 'hard' },
  { items: ['Teddy', 'Panda', 'Sloth', 'Koala'], correctIndex: 0, category: 'Animals vs Object', difficulty: 'hard' },
  { items: ['Dog', 'Cat', 'Mirror', 'Cow'], correctIndex: 2, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Flamingo', 'Crocodile', 'Lizard', 'Phone'], correctIndex: 3, category: 'Animals vs Object', difficulty: 'medium' },
  { items: ['Ant', 'Bee', 'Butterfly', 'Pencil'], correctIndex: 3, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Table', 'Dog', 'Cat', 'Cow'], correctIndex: 0, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Cow', 'Ox', 'Buffalo', 'Bus'], correctIndex: 3, category: 'Animals vs Object', difficulty: 'medium' },
  { items: ['Beetle', 'Cricket', 'Ladybug', 'Camera'], correctIndex: 3, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Dog', 'Box', 'Cat', 'Cow'], correctIndex: 1, category: 'Animals vs Object', difficulty: 'easy' },
  // --- Indian Food vs Non-food ---
  { items: ['Rice', 'Curry', 'Dal', 'Phone'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Noodles', 'Momos', 'Soup', 'Laptop'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Chair', 'Roti', 'Butter', 'Milk'], correctIndex: 0, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Biscuit', 'Cake', 'Donut', 'Car'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Banana', 'Mango', 'Grapes', 'Wrench'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Roti', 'Bread', 'Loaf', 'Book'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Carrot', 'Potato', 'Tomato', 'Toy'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Chai', 'Coffee', 'Juice', 'Chair'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Ice', 'Rice', 'Curry', 'Dal'], correctIndex: 0, category: 'Indian Food vs Non-food', difficulty: 'medium' },
  { items: ['Honey', 'Butter', 'Milk', 'Screen'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'medium' },
  { items: ['Pepper', 'Chilli', 'Cucumber', 'Phone'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'medium' },
  { items: ['Chicken', 'Mutton', 'Meat', 'Guitar'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'medium' },
  { items: ['Peanut', 'Lentil', 'Walnut', 'Clock'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'medium' },
  { items: ['Rice', 'Box', 'Curry', 'Dal'], correctIndex: 1, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Onion', 'Mushroom', 'Cabbage', 'Key'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Stew', 'Soup', 'Bowl', 'Bulb'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'medium' },
  { items: ['Dumpling', 'Pasta', 'Noodles', 'Mirror'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'medium' },
  { items: ['Chocolate', 'Sweet', 'Candy', 'TV'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Cake', 'Pastry', 'Birthday', 'Sofa'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Milk', 'Juice', 'Drink', 'Pencil'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'medium' },
  // --- Cricket vs random ---
  { items: ['Bat', 'Ball', 'Stadium', 'Apple'], correctIndex: 3, category: 'Cricket vs Object', difficulty: 'easy' },
  { items: ['Jersey', 'Bat', 'Ball', 'Bat'], correctIndex: 0, category: 'Cricket vs Object', difficulty: 'easy' },
  { items: ['Trophy', 'Medal', 'Bat', 'Phone'], correctIndex: 3, category: 'Cricket vs Object', difficulty: 'medium' },
  { items: ['Leg', 'Bat', 'Ball', 'Glove'], correctIndex: 0, category: 'Cricket vs Object', difficulty: 'hard' },
  { items: ['Stadium', 'Shoe', 'Bat', 'Ball'], correctIndex: 1, category: 'Cricket vs Object', difficulty: 'medium' },
  { items: ['Bat', 'TV', 'Ball', 'Stadium'], correctIndex: 1, category: 'Cricket vs Object', difficulty: 'easy' },
  { items: ['Ball', 'Bat', 'Chair', 'Stadium'], correctIndex: 2, category: 'Cricket vs Object', difficulty: 'easy' },
  { items: ['Person', 'Bat', 'Ball', 'Stadium'], correctIndex: 0, category: 'Cricket vs Object', difficulty: 'hard' },
  { items: ['Bat', 'Ball', 'Cap', 'Stadium'], correctIndex: 2, category: 'Cricket vs Object', difficulty: 'medium' },
  { items: ['Bat', 'Ball', 'Stadium', 'Laptop'], correctIndex: 3, category: 'Cricket vs Object', difficulty: 'easy' },
  { items: ['Mic', 'Bat', 'Ball', 'Stadium'], correctIndex: 0, category: 'Cricket vs Object', difficulty: 'medium' },
  { items: ['Bat', 'Stopwatch', 'Ball', 'Stadium'], correctIndex: 1, category: 'Cricket vs Object', difficulty: 'medium' },
  { items: ['Bat', 'Ball', 'Chart', 'Stadium'], correctIndex: 2, category: 'Cricket vs Object', difficulty: 'medium' },
  { items: ['Bed', 'Bat', 'Ball', 'Stadium'], correctIndex: 0, category: 'Cricket vs Object', difficulty: 'easy' },
  { items: ['Bat', 'Ball', 'Stadium', 'Torch'], correctIndex: 3, category: 'Cricket vs Object', difficulty: 'easy' },
  // --- Bollywood vs non-actor ---
  { items: ['Film', 'Drama', 'Singer', 'Pizza'], correctIndex: 3, category: 'Bollywood vs Non-actor', difficulty: 'easy' },
  { items: ['Camera', 'Film', 'Drama', 'Chair'], correctIndex: 3, category: 'Bollywood vs Non-actor', difficulty: 'medium' },
  { items: ['Guitar', 'Film', 'Drama', 'Singer'], correctIndex: 0, category: 'Bollywood vs Non-actor', difficulty: 'medium' },
  { items: ['Film', 'Drama', 'Phone', 'Singer'], correctIndex: 2, category: 'Bollywood vs Non-actor', difficulty: 'easy' },
  { items: ['Film', 'Cart', 'Drama', 'Singer'], correctIndex: 1, category: 'Bollywood vs Non-actor', difficulty: 'easy' },
  { items: ['Star', 'Hero', 'Film', 'Bicycle'], correctIndex: 3, category: 'Bollywood vs Non-actor', difficulty: 'easy' },
  { items: ['Movie', 'Film', 'Drama', 'Briefcase'], correctIndex: 3, category: 'Bollywood vs Non-actor', difficulty: 'medium' },
  { items: ['TV', 'Film', 'Drama', 'Singer'], correctIndex: 0, category: 'Bollywood vs Non-actor', difficulty: 'hard' },
  { items: ['Film', 'Drama', 'Singer', 'Tool'], correctIndex: 3, category: 'Bollywood vs Non-actor', difficulty: 'easy' },
  { items: ['Mirror', 'Film', 'Drama', 'Singer'], correctIndex: 0, category: 'Bollywood vs Non-actor', difficulty: 'medium' },
  { items: ['Film', 'Pencil', 'Drama', 'Singer'], correctIndex: 1, category: 'Bollywood vs Non-actor', difficulty: 'easy' },
  { items: ['Film', 'Drama', 'Book', 'Singer'], correctIndex: 2, category: 'Bollywood vs Non-actor', difficulty: 'medium' },
  { items: ['Film', 'Drama', 'Singer', 'Chair'], correctIndex: 3, category: 'Bollywood vs Non-actor', difficulty: 'easy' },
  { items: ['Ice', 'Film', 'Drama', 'Singer'], correctIndex: 0, category: 'Bollywood vs Non-actor', difficulty: 'medium' },
  { items: ['Film', 'Drama', 'Singer', 'Clock'], correctIndex: 3, category: 'Bollywood vs Non-actor', difficulty: 'easy' },
  // --- States / Places vs random ---
  { items: ['Map', 'Capital', 'Palm', 'Burger'], correctIndex: 3, category: 'States vs City', difficulty: 'easy' },
  { items: ['Auto', 'Train', 'Bus', 'Statue'], correctIndex: 3, category: 'Vehicles India vs Foreign', difficulty: 'easy' },
  { items: ['Diwali', 'Fireworks', 'Diya', 'Calendar'], correctIndex: 3, category: 'Festivals vs Normal day', difficulty: 'easy' },
  { items: ['Cop', 'Doctor', 'Chef', 'Guitar'], correctIndex: 3, category: 'Professions vs Object', difficulty: 'easy' },
  { items: ['Burger', 'Map', 'Capital', 'Palm'], correctIndex: 0, category: 'States vs City', difficulty: 'medium' },
  { items: ['Auto', 'Train', 'Bike', 'Statue'], correctIndex: 3, category: 'Vehicles India vs Foreign', difficulty: 'easy' },
  { items: ['Diwali', 'Fireworks', 'Calendar', 'Diya'], correctIndex: 2, category: 'Festivals vs Normal day', difficulty: 'easy' },
  { items: ['Cop', 'Doctor', 'Guitar', 'Chef'], correctIndex: 2, category: 'Professions vs Object', difficulty: 'easy' },
  { items: ['Map', 'Box', 'Capital', 'Palm'], correctIndex: 1, category: 'States vs City', difficulty: 'medium' },
  { items: ['Auto', 'Car', 'Train', 'Bus'], correctIndex: 1, category: 'Vehicles India vs Foreign', difficulty: 'medium' },
  { items: ['Diwali', 'Fireworks', 'Diya', 'Clock'], correctIndex: 3, category: 'Festivals vs Normal day', difficulty: 'easy' },
  { items: ['Cop', 'Phone', 'Doctor', 'Chef'], correctIndex: 1, category: 'Professions vs Object', difficulty: 'easy' },
  { items: ['Map', 'Capital', 'Palm', 'Key'], correctIndex: 3, category: 'States vs City', difficulty: 'easy' },
  { items: ['Auto', 'Train', 'Bus', 'Pencil'], correctIndex: 3, category: 'Vehicles India vs Foreign', difficulty: 'medium' },
  { items: ['Diwali', 'Sparkler', 'Diya', 'Diya'], correctIndex: 1, category: 'Festivals vs Normal day', difficulty: 'hard' },
  { items: ['Cop', 'Doctor', 'Chef', 'Chair'], correctIndex: 3, category: 'Professions vs Object', difficulty: 'easy' },
  { items: ['Map', 'Capital', 'Bulb', 'Palm'], correctIndex: 2, category: 'States vs City', difficulty: 'medium' },
  { items: ['Auto', 'Cycle', 'Train', 'Bus'], correctIndex: 1, category: 'Vehicles India vs Foreign', difficulty: 'hard' },
  { items: ['Calendar', 'Diwali', 'Fireworks', 'Diya'], correctIndex: 0, category: 'Festivals vs Normal day', difficulty: 'medium' },
  { items: ['Cop', 'Doctor', 'Chef', 'TV'], correctIndex: 3, category: 'Professions vs Object', difficulty: 'easy' },
  // --- More variety to reach 150+ ---
  { items: ['Dog', 'Cat', 'Car', 'Cow'], correctIndex: 2, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Rice', 'Phone', 'Curry', 'Dal'], correctIndex: 1, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Bat', 'Ball', 'Apple', 'Stadium'], correctIndex: 2, category: 'Cricket vs Object', difficulty: 'easy' },
  { items: ['Film', 'Pizza', 'Drama', 'Singer'], correctIndex: 1, category: 'Bollywood vs Non-actor', difficulty: 'easy' },
  { items: ['Dog', 'Cat', 'Cow', 'Book'], correctIndex: 3, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Banana', 'Mango', 'Wrench', 'Grapes'], correctIndex: 2, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Chair', 'Bat', 'Ball', 'Stadium'], correctIndex: 0, category: 'Cricket vs Object', difficulty: 'easy' },
  { items: ['Star', 'Bicycle', 'Hero', 'Film'], correctIndex: 1, category: 'Bollywood vs Non-actor', difficulty: 'easy' },
  { items: ['Lion', 'Phone', 'Tiger', 'Bear'], correctIndex: 1, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Roti', 'Book', 'Bread', 'Loaf'], correctIndex: 1, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Bat', 'Ball', 'Stadium', 'Chair'], correctIndex: 3, category: 'Cricket vs Object', difficulty: 'easy' },
  { items: ['Movie', 'Briefcase', 'Film', 'Drama'], correctIndex: 1, category: 'Bollywood vs Non-actor', difficulty: 'medium' },
  { items: ['Frog', 'Fox', 'Bulb', 'Rabbit'], correctIndex: 2, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Carrot', 'Toy', 'Potato', 'Tomato'], correctIndex: 1, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Jersey', 'Bat', 'Ball', 'Stadium'], correctIndex: 0, category: 'Cricket vs Object', difficulty: 'easy' },
  { items: ['Film', 'Drama', 'Singer', 'Burger'], correctIndex: 3, category: 'Bollywood vs Non-actor', difficulty: 'easy' },
  { items: ['Eagle', 'Bird', 'Key', 'Chick'], correctIndex: 2, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Chai', 'Coffee', 'Chair', 'Juice'], correctIndex: 2, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Trophy', 'Medal', 'Phone', 'Bat'], correctIndex: 2, category: 'Cricket vs Object', difficulty: 'medium' },
  { items: ['Camera', 'Chair', 'Film', 'Drama'], correctIndex: 1, category: 'Bollywood vs Non-actor', difficulty: 'medium' },
  { items: ['Book', 'Elephant', 'Giraffe', 'Deer'], correctIndex: 0, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Biscuit', 'Cake', 'Car', 'Donut'], correctIndex: 2, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Bat', 'TV', 'Ball', 'Stadium'], correctIndex: 1, category: 'Cricket vs Object', difficulty: 'easy' },
  { items: ['Film', 'Drama', 'Phone', 'Singer'], correctIndex: 2, category: 'Bollywood vs Non-actor', difficulty: 'easy' },
  { items: ['Dog', 'Horse', 'Chair', 'Sheep'], correctIndex: 2, category: 'Animals vs Object', difficulty: 'medium' },
  { items: ['Honey', 'Butter', 'Screen', 'Milk'], correctIndex: 2, category: 'Indian Food vs Non-food', difficulty: 'medium' },
  { items: ['Leg', 'Bat', 'Ball', 'Glove'], correctIndex: 0, category: 'Cricket vs Object', difficulty: 'hard' },
  { items: ['Guitar', 'Film', 'Drama', 'Singer'], correctIndex: 0, category: 'Bollywood vs Non-actor', difficulty: 'medium' },
  { items: ['Crab', 'Fish', 'Clock', 'Trout'], correctIndex: 2, category: 'Animals vs Object', difficulty: 'medium' },
  { items: ['Noodles', 'Momos', 'Laptop', 'Soup'], correctIndex: 2, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Stadium', 'Shoe', 'Bat', 'Ball'], correctIndex: 1, category: 'Cricket vs Object', difficulty: 'medium' },
  { items: ['Star', 'Hero', 'Bicycle', 'Film'], correctIndex: 2, category: 'Bollywood vs Non-actor', difficulty: 'easy' },
  { items: ['Bag', 'Parrot', 'Turtle', 'Snake'], correctIndex: 0, category: 'Animals vs Object', difficulty: 'medium' },
  { items: ['Roti', 'Bread', 'Book', 'Loaf'], correctIndex: 2, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Bat', 'Ball', 'Cap', 'Stadium'], correctIndex: 2, category: 'Cricket vs Object', difficulty: 'medium' },
  { items: ['Movie', 'Film', 'Briefcase', 'Drama'], correctIndex: 2, category: 'Bollywood vs Non-actor', difficulty: 'medium' },
  { items: ['Mouse', 'Hamster', 'TV', 'Squirrel'], correctIndex: 2, category: 'Animals vs Object', difficulty: 'medium' },
  { items: ['Peanut', 'Lentil', 'Clock', 'Walnut'], correctIndex: 2, category: 'Indian Food vs Non-food', difficulty: 'medium' },
  { items: ['Mic', 'Bat', 'Ball', 'Stadium'], correctIndex: 0, category: 'Cricket vs Object', difficulty: 'medium' },
  { items: ['Mirror', 'Film', 'Drama', 'Singer'], correctIndex: 0, category: 'Bollywood vs Non-actor', difficulty: 'medium' },
  { items: ['Owl', 'Bat', 'Sofa', 'Wolf'], correctIndex: 2, category: 'Animals vs Object', difficulty: 'hard' },
  { items: ['Chicken', 'Mutton', 'Guitar', 'Meat'], correctIndex: 2, category: 'Indian Food vs Non-food', difficulty: 'medium' },
  { items: ['Bat', 'Stopwatch', 'Ball', 'Stadium'], correctIndex: 1, category: 'Cricket vs Object', difficulty: 'medium' },
  { items: ['Film', 'Pencil', 'Drama', 'Singer'], correctIndex: 1, category: 'Bollywood vs Non-actor', difficulty: 'easy' },
  { items: ['Teddy', 'Panda', 'Sloth', 'Koala'], correctIndex: 0, category: 'Animals vs Object', difficulty: 'hard' },
  { items: ['Stew', 'Soup', 'Bulb', 'Bowl'], correctIndex: 2, category: 'Indian Food vs Non-food', difficulty: 'medium' },
  { items: ['Bat', 'Ball', 'Chart', 'Stadium'], correctIndex: 2, category: 'Cricket vs Object', difficulty: 'medium' },
  { items: ['Film', 'Drama', 'Book', 'Singer'], correctIndex: 2, category: 'Bollywood vs Non-actor', difficulty: 'medium' },
  { items: ['Cow', 'Ox', 'Bus', 'Buffalo'], correctIndex: 2, category: 'Animals vs Object', difficulty: 'medium' },
  { items: ['Dumpling', 'Pasta', 'Mirror', 'Noodles'], correctIndex: 2, category: 'Indian Food vs Non-food', difficulty: 'medium' },
  { items: ['Bed', 'Bat', 'Ball', 'Stadium'], correctIndex: 0, category: 'Cricket vs Object', difficulty: 'easy' },
  { items: ['Ice', 'Film', 'Drama', 'Singer'], correctIndex: 0, category: 'Bollywood vs Non-actor', difficulty: 'medium' },
  { items: ['Duck', 'Swan', 'Radio', 'Penguin'], correctIndex: 2, category: 'Animals vs Object', difficulty: 'medium' },
  { items: ['Chocolate', 'Sweet', 'TV', 'Candy'], correctIndex: 2, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Bat', 'Ball', 'Stadium', 'Torch'], correctIndex: 3, category: 'Cricket vs Object', difficulty: 'easy' },
  { items: ['TV', 'Film', 'Drama', 'Singer'], correctIndex: 0, category: 'Bollywood vs Non-actor', difficulty: 'hard' },
  { items: ['Beetle', 'Cricket', 'Camera', 'Ladybug'], correctIndex: 2, category: 'Animals vs Object', difficulty: 'easy' },
  { items: ['Cake', 'Pastry', 'Sofa', 'Birthday'], correctIndex: 2, category: 'Indian Food vs Non-food', difficulty: 'easy' },
  { items: ['Person', 'Bat', 'Ball', 'Stadium'], correctIndex: 0, category: 'Cricket vs Object', difficulty: 'hard' },
  { items: ['Film', 'Drama', 'Singer', 'Tool'], correctIndex: 3, category: 'Bollywood vs Non-actor', difficulty: 'easy' },
  { items: ['Flamingo', 'Crocodile', 'Phone', 'Lizard'], correctIndex: 2, category: 'Animals vs Object', difficulty: 'medium' },
  { items: ['Pepper', 'Chilli', 'Phone', 'Cucumber'], correctIndex: 2, category: 'Indian Food vs Non-food', difficulty: 'medium' },
  { items: ['Map', 'Capital', 'Burger', 'Palm'], correctIndex: 2, category: 'States vs City', difficulty: 'easy' },
  { items: ['Auto', 'Train', 'Statue', 'Bus'], correctIndex: 2, category: 'Vehicles India vs Foreign', difficulty: 'easy' },
  { items: ['Diwali', 'Calendar', 'Fireworks', 'Diya'], correctIndex: 1, category: 'Festivals vs Normal day', difficulty: 'easy' },
  { items: ['Cop', 'Phone', 'Doctor', 'Chef'], correctIndex: 1, category: 'Professions vs Object', difficulty: 'easy' },
  { items: ['Map', 'Box', 'Capital', 'Palm'], correctIndex: 1, category: 'States vs City', difficulty: 'medium' },
  { items: ['Auto', 'Car', 'Train', 'Bus'], correctIndex: 1, category: 'Vehicles India vs Foreign', difficulty: 'medium' },
  { items: ['Diwali', 'Fireworks', 'Clock', 'Diya'], correctIndex: 2, category: 'Festivals vs Normal day', difficulty: 'easy' },
  { items: ['Cop', 'Doctor', 'Chair', 'Chef'], correctIndex: 2, category: 'Professions vs Object', difficulty: 'easy' },
  { items: ['Map', 'Capital', 'Key', 'Palm'], correctIndex: 2, category: 'States vs City', difficulty: 'easy' },
  { items: ['Auto', 'Train', 'Pencil', 'Bus'], correctIndex: 2, category: 'Vehicles India vs Foreign', difficulty: 'medium' },
  { items: ['Calendar', 'Diwali', 'Fireworks', 'Diya'], correctIndex: 0, category: 'Festivals vs Normal day', difficulty: 'medium' },
  { items: ['Cop', 'Doctor', 'Chef', 'TV'], correctIndex: 3, category: 'Professions vs Object', difficulty: 'easy' },
  { items: ['Map', 'Capital', 'Bulb', 'Palm'], correctIndex: 2, category: 'States vs City', difficulty: 'medium' },
  { items: ['Auto', 'Cycle', 'Train', 'Bus'], correctIndex: 1, category: 'Vehicles India vs Foreign', difficulty: 'hard' },
  { items: ['Diwali', 'Sparkler', 'Diya', 'Diya'], correctIndex: 1, category: 'Festivals vs Normal day', difficulty: 'hard' },
  // --- Extra unique for 10+ per difficulty ---
  { items: ['Beaver', 'Badger', 'Rabbit', 'Printer'], correctIndex: 3, category: 'Animals vs Object', difficulty: 'hard' },
  { items: ['Ram', 'Goat', 'Llama', 'Pager'], correctIndex: 3, category: 'Animals vs Object', difficulty: 'hard' },
  { items: ['Beaver', 'Badger', 'Printer', 'Rabbit'], correctIndex: 2, category: 'Animals vs Object', difficulty: 'hard' },
  { items: ['Salad', 'Pizza', 'Taco', 'Bell'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'hard' },
  { items: ['Mate', 'Sake', 'Whisky', 'Disc'], correctIndex: 3, category: 'Indian Food vs Non-food', difficulty: 'hard' },
  { items: ['Bat', 'Ball', 'Sofa', 'Stadium'], correctIndex: 2, category: 'Cricket vs Object', difficulty: 'hard' },
  { items: ['Film', 'Drama', 'Pager', 'Singer'], correctIndex: 2, category: 'Bollywood vs Non-actor', difficulty: 'hard' },
  { items: ['Map', 'Capital', 'Disc', 'Palm'], correctIndex: 2, category: 'States vs City', difficulty: 'hard' },
  { items: ['Auto', 'Train', 'Disc', 'Bus'], correctIndex: 2, category: 'Vehicles India vs Foreign', difficulty: 'hard' },
  { items: ['Diwali', 'Fireworks', 'Disc', 'Diya'], correctIndex: 2, category: 'Festivals vs Normal day', difficulty: 'hard' },
  { items: ['Cop', 'Doctor', 'Disc', 'Chef'], correctIndex: 2, category: 'Professions vs Object', difficulty: 'hard' },
]

/** Get puzzles filtered by difficulty */
export function getPuzzlesByDifficulty(difficulty) {
  return ALL_PUZZLES.filter(p => p.difficulty === difficulty)
}

/**
 * Generate a session of unique puzzles (no repeat within session).
 * @param {'easy'|'medium'|'hard'} difficulty
 * @param {number} count default 10
 */
export function generateSessionPuzzles(difficulty, count = 10) {
  const pool = getPuzzlesByDifficulty(difficulty)
  const seen = new Set()
  const out = []
  let maxRounds = 5
  while (out.length < count && maxRounds > 0) {
    const shuffled = shuffleArray([...pool])
    for (let i = 0; i < shuffled.length && out.length < count; i++) {
      const p = shuffled[i]
      const key = p.items.join('|') + '|' + p.correctIndex
      if (seen.has(key)) continue
      seen.add(key)
      out.push(p)
    }
    maxRounds--
  }
  return out.slice(0, count)
}

export { ALL_PUZZLES }
