import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LangProvider } from './store/LangContext'
import { ThemeProvider } from './store/ThemeContext'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { initAnalytics } from './services/analyticsSetup'
import Home from './pages/Home'
import Room from './pages/Room'
import Profile from './pages/Profile'
import PlayOffline from './pages/PlayOffline'
import TestLab from './pages/TestLab'
import Tables from './pages/Tables'

// Mounts globally so XP syncs whenever the device comes back online,
// regardless of which page the user is currently on.
function GlobalXPSync() {
  useOnlineStatus()
  return null
}

// Fires once per app load — wires the analytics module to this app's
// Firebase/device-identity, then starts the app-level session-time clock.
initAnalytics()

export default function App() {
  return (
    <LangProvider>
      <ThemeProvider>
        <BrowserRouter>
          <GlobalXPSync />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:code" element={<Room />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/play/:slug" element={<PlayOffline />} />
            <Route path="/tables" element={<Tables />} />
            <Route path="/test-lab" element={<TestLab />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </LangProvider>
  )
}
