import { useState } from 'react'

export function useDevMode() {
  const [devMode, setDevModeState] = useState(
    () => localStorage.getItem('partybox_dev_mode') === '1'
  )
  function toggleDevMode() {
    const next = !devMode
    localStorage.setItem('partybox_dev_mode', next ? '1' : '0')
    setDevModeState(next)
  }
  return { devMode, toggleDevMode }
}
