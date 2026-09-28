import { useConsent } from '../hooks/useConsent'
import { setConsent } from '../lib/consent'

export function ConsentBanner() {
  const consent = useConsent()
  if (consent !== null) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] px-3 pb-3 pointer-events-none">
      <div className="max-w-lg mx-auto rounded-2xl bg-surfaceElevated border border-border shadow-card p-4 pointer-events-auto">
        <p className="text-sm text-textPrimary">
          PartyBox is free and shows ads. With your OK we personalise those ads and use Google Analytics, which may set
          identifiers on your device. If you decline, you still see ads, just not personalised ones.
          {' '}
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="underline text-textMuted">Privacy Policy</a>
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setConsent('denied')}
            className="flex-1 min-h-[44px] rounded-xl border-[1.5px] border-border text-textPrimary font-semibold"
          >
            Decline
          </button>
          <button
            onClick={() => setConsent('granted')}
            className="flex-1 min-h-[44px] rounded-xl bg-maroon text-onMaroon font-bold"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
