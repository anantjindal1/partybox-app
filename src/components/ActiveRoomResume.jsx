import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { findActiveRoom } from '../services/activeRoom'

let checkedThisLoad = false

// On a cold start at Home, puts a player straight back at the table they
// were seated at. Runs once per app load only, so pressing Back to Home
// mid-game isn't immediately undone (Home's own Rejoin card covers that).
export default function ActiveRoomResume() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (checkedThisLoad) return
    checkedThisLoad = true
    if (location.pathname !== '/') return
    findActiveRoom().then(room => {
      // A deep link (invite URL) may have navigated elsewhere meanwhile.
      if (room && window.location.pathname === '/') navigate(`/room/${room.code}`)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
