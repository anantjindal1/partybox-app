import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Card } from './Card'
import { useAdsRemoved } from '../hooks/useAdsRemoved'
import { getRemoveAdsPackage, buyRemoveAds, restorePurchases } from '../lib/purchases'

// Purchases only exist in the Android app; on the web this renders nothing.
export default function RemoveAdsCard() {
  const adsRemoved = useAdsRemoved()
  const [pkg, setPkg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || adsRemoved) return
    getRemoveAdsPackage().then(setPkg).catch(() => setPkg(null))
  }, [adsRemoved])

  if (!Capacitor.isNativePlatform()) return null

  async function run(action) {
    setBusy(true)
    setMessage('')
    try {
      await action()
    } catch {
      setMessage("Couldn't reach Google Play. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  function handleBuy() {
    run(() => buyRemoveAds(pkg))
  }

  function handleRestore() {
    run(async () => {
      const restored = await restorePurchases()
      if (!restored) setMessage('No previous Remove Ads purchase found on this Google account.')
    })
  }

  return (
    <Card className="p-5 space-y-3">
      <p className="text-textMuted text-sm uppercase tracking-wider">Remove ads</p>
      {adsRemoved ? (
        <p className="text-sm text-textPrimary">Ads are removed on this Google account. Thanks for supporting PartyBox!</p>
      ) : (
        <>
          <p className="text-sm text-textPrimary">One-time purchase. No banners, no ads between games, every game still free.</p>
          <button
            onClick={handleBuy}
            disabled={!pkg || busy}
            className="w-full min-h-[44px] rounded-xl bg-maroon text-onMaroon font-bold disabled:opacity-50"
          >
            {busy ? 'Please wait…' : pkg ? `Remove ads · ${pkg.product.priceString}` : 'Remove ads (unavailable)'}
          </button>
        </>
      )}
      <button onClick={handleRestore} disabled={busy} className="text-sm underline text-textPrimary disabled:opacity-50">
        Restore purchase
      </button>
      {message && <p className="text-sm text-textMuted">{message}</p>}
    </Card>
  )
}
