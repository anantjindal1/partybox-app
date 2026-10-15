import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Card } from './Card'
import { useAdsRemoved } from '../hooks/useAdsRemoved'
import { getRemoveAdsPackage, buyRemoveAds, restorePurchases } from '../lib/purchases'
import { useLang } from '../store/LangContext'

// Purchases only exist in the Android app; on the web this renders nothing.
export default function RemoveAdsCard() {
  const { t } = useLang()
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
      setMessage('playUnreachable')
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
      if (!restored) setMessage('noPurchaseFound')
    })
  }

  return (
    <Card className="p-5 space-y-3">
      <p className="text-textMuted text-sm uppercase tracking-wider">{t('removeAds')}</p>
      {adsRemoved ? (
        <p className="text-sm text-textPrimary">{t('adsRemoved')}</p>
      ) : (
        <>
          <p className="text-sm text-textPrimary">
            {t('removeAdsDesc')}{' '}
            <a href="/refund.html" target="_blank" rel="noopener noreferrer" className="underline text-textMuted">{t('refundPolicy')}</a>
          </p>
          <button
            onClick={handleBuy}
            disabled={!pkg || busy}
            className="w-full min-h-[44px] rounded-xl bg-maroon text-onMaroon font-bold disabled:opacity-50"
          >
            {busy ? t('pleaseWait') : pkg ? t('removeAdsPrice', { price: pkg.product.priceString }) : t('removeAdsUnavailable')}
          </button>
        </>
      )}
      <button onClick={handleRestore} disabled={busy} className="text-sm underline text-textPrimary disabled:opacity-50">
        {t('restorePurchase')}
      </button>
      {message && <p className="text-sm text-textMuted">{t(message)}</p>}
    </Card>
  )
}
