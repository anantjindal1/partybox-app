import { createContext, useContext, useState } from 'react'

const strings = {
  en: {
    createRoom: 'Create Room',
    joinRoom: 'Join Room',
    profile: 'Profile',
    enterCode: 'Enter Code',
    start: 'Start',
    back: 'Back',
    xp: 'XP',
    badges: 'Badges',
    name: 'Your Name',
    avatar: 'Pick Avatar',
    waiting: 'Waiting for players...',
    noGames: 'No games available',
    pickGame: 'Pick a Game',
    players: 'Players',
    rules: 'Rules',
    guess: 'Your Guess',
    submit: 'Submit Guess',
    reveal: 'Reveal Answer',
    winner: 'Winner!',
    score: 'Score',
    play: 'Play',
    comingSoon: 'Coming Soon',
    roomNotFound: 'Room not found. Check the code and try again.',
    pause: 'Pause',
    returnHome: 'Return Home',
    resume: 'Resume',
    newGame: 'New Game',
    resumeGame: 'Resume Game',
    gamesInProgress: 'Continue playing',
    save: 'Save',
    savedSuccess: 'Saved!',
    noBadgesYet: 'Play games to earn badges!',
    onlineGames: 'Online Games',
    needsInternet: 'Needs internet',
    createRoomFailed: 'Failed to create room. Check your connection.'
  },
  hi: {
    createRoom: 'कमरा बनाएं',
    joinRoom: 'कमरे में जाएं',
    profile: 'प्रोफाइल',
    enterCode: 'कोड डालें',
    start: 'शुरू करें',
    back: 'वापस',
    xp: 'XP',
    badges: 'बैज',
    name: 'आपका नाम',
    avatar: 'अवतार चुनें',
    waiting: 'खिलाड़ियों का इंतज़ार...',
    noGames: 'कोई खेल नहीं',
    pickGame: 'खेल चुनें',
    players: 'खिलाड़ी',
    rules: 'नियम',
    guess: 'आपका अनुमान',
    submit: 'अनुमान भेजें',
    reveal: 'जवाब देखें',
    winner: 'विजेता!',
    score: 'अंक',
    play: 'खेलें',
    comingSoon: 'जल्द आ रहा है',
    roomNotFound: 'कमरा नहीं मिला। कोड जाँचें और दोबारा कोशिश करें।',
    pause: 'रोकें',
    returnHome: 'घर वापस',
    resume: 'जारी रखें',
    newGame: 'नया खेल',
    resumeGame: 'खेल जारी रखें',
    gamesInProgress: 'खेल जारी रखें',
    save: 'सेव करें',
    savedSuccess: 'सेव हो गया!',
    noBadgesYet: 'बैज कमाने के लिए खेलें!',
    onlineGames: 'ऑनलाइन गेम',
    needsInternet: 'इंटरनेट चाहिए',
    createRoomFailed: 'कमरा नहीं बना। कनेक्शन जाँचें।'
  }
}

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en')
  const t = (key) => strings[lang][key] ?? key
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
