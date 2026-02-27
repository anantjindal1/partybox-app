import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LangProvider } from './store/LangContext'
import { GameThemeProvider } from './store/GameThemeContext'
import Home from './pages/Home'
import Room from './pages/Room'
import Profile from './pages/Profile'
import PlayOffline from './pages/PlayOffline'

export default function App() {
  return (
    <LangProvider>
      <GameThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:code" element={<Room />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/play/:slug" element={<PlayOffline />} />
          </Routes>
        </BrowserRouter>
      </GameThemeProvider>
    </LangProvider>
  )
}
