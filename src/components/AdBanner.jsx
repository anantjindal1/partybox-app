import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { useConsent } from '../hooks/useConsent'
import { useAdsRemoved } from '../hooks/useAdsRemoved'
import { showNativeBanner, hideNativeBanner } from '../lib/nativeAds'

const isDev = import.meta.env.DEV
const isNative = Capacitor.isNativePlatform()
const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT
const ADSENSE_SLOT = import.meta.env.VITE_ADSENSE_SLOT

function loadAdSenseScript() {
  if (document.querySelector('script[data-adsense]')) return
  const script = document.createElement('script')
  script.async = true
  script.crossOrigin = 'anonymous'
  script.dataset.adsense = 'true'
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`
  document.head.appendChild(script)
}

/**
 * AdBanner — AdMob inside the native app, a Google AdSense slot on the web.
 * On the web it renders nothing (and loads nothing from
 * Google) until BOTH are true: VITE_ADSENSE_CLIENT / VITE_ADSENSE_SLOT are
 * set, and the user has answered the consent banner (declining gets
 * non-personalised ads). In dev it shows a
 * labelled placeholder so the layout stays visible.
 *
 * Props:
 *   slot      {string}  — unique slot identifier, e.g. "home-bottom"
 *   className {string}  — optional extra Tailwind classes
 */
export default function AdBanner(props) {
  return isNative ? <NativeAdBanner /> : <WebAdBanner {...props} />
}

// AdMob banners are a native overlay pinned to the bottom of the screen, not
// an inline element — mounting this just shows it for as long as the screen
// is open.
function NativeAdBanner() {
  const consent = useConsent()
  const adsRemoved = useAdsRemoved()

  useEffect(() => {
    if (consent === null || adsRemoved) return
    let cancelled = false
    showNativeBanner().then(() => {
      if (cancelled) hideNativeBanner()
    })
    return () => {
      cancelled = true
      hideNativeBanner()
    }
  }, [consent, adsRemoved])

  return null
}

function WebAdBanner({ slot, className = '' }) {
  const consent = useConsent()
  const live = !!ADSENSE_CLIENT && !!ADSENSE_SLOT && consent !== null
  const pushedRef = useRef(false)

  useEffect(() => {
    if (!live) return
    // Must be set before the first ad request; declined users get
    // non-personalised ads.
    ;(window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = consent === 'granted' ? 0 : 1
    loadAdSenseScript()
    if (pushedRef.current) return
    pushedRef.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // Ad blockers and script errors must never break the page.
    }
  }, [live, consent])

  if (live) {
    return (
      <div className={`w-full ${className}`} data-ad-slot={slot}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={ADSENSE_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    )
  }

  if (!isDev) return null

  return (
    <div
      data-ad-slot={slot}
      className={`w-full h-[60px] bg-surfaceMuted border border-dashed border-border rounded-xl flex items-center justify-center ${className}`}
    >
      <span className="text-textMuted text-xs select-none">Ad slot: {slot}</span>
    </div>
  )
}
