import { useEffect, useRef } from 'react'
import { useConsent } from '../hooks/useConsent'

const isDev = import.meta.env.DEV
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
 * AdBanner — a Google AdSense slot. Renders nothing (and loads nothing from
 * Google) until BOTH are true: VITE_ADSENSE_CLIENT / VITE_ADSENSE_SLOT are
 * set, and the user has accepted the consent banner. In dev it shows a
 * labelled placeholder so the layout stays visible.
 *
 * Props:
 *   slot      {string}  — unique slot identifier, e.g. "home-bottom"
 *   className {string}  — optional extra Tailwind classes
 */
export default function AdBanner({ slot, className = '' }) {
  const consent = useConsent()
  const live = !!ADSENSE_CLIENT && !!ADSENSE_SLOT && consent === 'granted'
  const pushedRef = useRef(false)

  useEffect(() => {
    if (!live) return
    loadAdSenseScript()
    if (pushedRef.current) return
    pushedRef.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // Ad blockers and script errors must never break the page.
    }
  }, [live])

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
