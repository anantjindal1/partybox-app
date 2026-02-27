/**
 * Theme definitions for Desi Memory Master.
 * Each theme has at least 12 unique items for board generation (easy 8, medium 10, hard 12 pairs).
 */

const THEMES = [
  {
    theme: 'Indian Food',
    items: [
      'Biryani', 'Samosa', 'Dosa', 'Chole', 'Pav Bhaji', 'Pani Puri',
      'Butter Chicken', 'Dal Makhani', 'Idli', 'Vada', 'Upma', 'Poha',
      'Jalebi', 'Gulab Jamun', 'Rasmalai', 'Kheer'
    ]
  },
  {
    theme: 'Bollywood Actors',
    items: [
      'Amitabh', 'Shah Rukh', 'Aamir', 'Salman', 'Hrithik', 'Ranbir',
      'Deepika', 'Priyanka', 'Alia', 'Katrina', 'Ranveer', 'Akshay',
      'Vidya', 'Kareena', 'Saif', 'Irrfan'
    ]
  },
  {
    theme: 'Cricket',
    items: [
      'Sachin', 'Dhoni', 'Kohli', 'Rohit', 'Rahul', 'Bumrah',
      'Jadeja', 'Ashwin', 'Shami', 'Gavaskar', 'Kapil', 'Dravid',
      'Ganguly', 'Sehwag', 'Zaheer', 'Harbhajan'
    ]
  },
  {
    theme: 'Indian Monuments',
    items: [
      'Taj Mahal', 'Red Fort', 'Qutub Minar', 'India Gate', 'Gateway',
      'Hawa Mahal', 'Charminar', 'Victoria Memorial', 'Ajanta', 'Ellora',
      'Konark', 'Khajuraho', 'Sanchi', 'Fatehpur Sikri', 'Meenakshi', 'Golden Temple'
    ]
  },
  {
    theme: 'Vehicles India',
    items: [
      'Auto Rickshaw', 'Ola', 'Uber', 'Bullet', 'Splendor', 'Activa',
      'Innova', 'Alto', 'Swift', 'Indica', 'Tata Nano', 'Eicher',
      'Ashok Leyland', 'Vikram', 'Tempo', 'Cycle Rickshaw'
    ]
  }
]

export function getThemes() {
  return THEMES
}

export function getThemeByName(themeName) {
  return THEMES.find(t => t.theme === themeName) || null
}
