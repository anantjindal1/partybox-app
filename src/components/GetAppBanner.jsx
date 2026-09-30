import { useState } from 'react'
import { Capacitor } from '@capacitor/core'

// Off until the app is in production on Play: closed-test links 404 for
// anyone who isn't an opted-in tester.
const PLAY_STORE_LIVE = false
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.anantjindal.partybox'
const DISMISS_KEY = 'partybox_get_app_dismissed'

function wasDismissed() {
  try { return localStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
}

// Android browsers only; the app has no iOS build.
export default function GetAppBanner() {
  const [hidden, setHidden] = useState(wasDismissed)
  if (!PLAY_STORE_LIVE || hidden || Capacitor.isNativePlatform() || !/Android/i.test(navigator.userAgent)) return null

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
    setHidden(true)
  }

  return (
    <div className="mb-5 flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <p className="flex-1 text-sm text-textPrimary">PartyBox is on Google Play. Faster, full screen, works with invite links.</p>
      <a href={PLAY_URL} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg bg-maroon px-3 py-2 text-sm font-bold text-onMaroon">
        Get the app
      </a>
      <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-textMuted hover:text-textPrimary text-lg leading-none px-1">×</button>
    </div>
  )
}
