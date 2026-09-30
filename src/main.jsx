import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { Capacitor } from '@capacitor/core'
import { initCrashReporting } from './lib/crashReporting'
import { initPurchases } from './lib/purchases'
import App from './App'
import '@fontsource/rozha-one'
import './index.css'

// Auto-activate a new build the instant one's available, rather than
// waiting for the next full navigation — otherwise an already-open tab
// keeps running old JS until manually reloaded, which read as "stale
// cache" during active development. The native app ships its assets in
// the APK, so a service worker there would only serve stale copies.
if (!Capacitor.isNativePlatform()) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateSW(true)
    },
    onOfflineReady() {}
  })
}

initCrashReporting()
initPurchases()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
