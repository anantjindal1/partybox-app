import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import '@fontsource/rozha-one'
import './index.css'

// Auto-activate a new build the instant one's available, rather than
// waiting for the next full navigation — otherwise an already-open tab
// keeps running old JS until manually reloaded, which read as "stale
// cache" during active development.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true)
  },
  onOfflineReady() {}
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
