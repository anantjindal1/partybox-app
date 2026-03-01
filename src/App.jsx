import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LangProvider } from './store/LangContext'
import { GameThemeProvider } from './store/GameThemeContext'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import Home from './pages/Home'
import Room from './pages/Room'
import Profile from './pages/Profile'
import PlayOffline from './pages/PlayOffline'

// Mounts globally so XP syncs whenever the device comes back online,
// regardless of which page the user is currently on.
function GlobalXPSync() {
  useOnlineStatus()
  return null
}

export default function App() {
  return (
    <LangProvider>
      <GameThemeProvider>
        <BrowserRouter>
          <GlobalXPSync />
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
