import { getConsent } from './consent'
import { AdMob, AdmobConsentStatus, BannerAdPluginEvents, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob'

// Google's published test units. Real IDs come from env once the AdMob
// account is approved; until then every request is a test request.
const BANNER_ID = import.meta.env.VITE_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111'
const INTERSTITIAL_ID = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/1033173712'
const isTesting = !import.meta.env.VITE_ADMOB_BANNER_ID

const INTERSTITIAL_GAP_MS = 3 * 60 * 1000

let ready = null
let lastInterstitial = Date.now()
let interstitialLoaded = false

// Called once the user has answered PartyBox's own consent banner (either
// way — declining means non-personalised ads). UMP then adds Google's form on
// top where the law requires it (EEA/UK).
export function initNativeAds() {
  if (ready) return ready
  ready = (async () => {
    await AdMob.initialize({ initializeForTesting: isTesting })
    // UMP fails until a privacy message is published in AdMob (and always
    // with the test app ID); ads must still work outside the EEA/UK.
    try {
      const info = await AdMob.requestConsentInfo()
      if (info.status === AdmobConsentStatus.REQUIRED && info.isConsentFormAvailable) {
        await AdMob.showConsentForm()
      }
    } catch {}
    AdMob.addListener(BannerAdPluginEvents.SizeChanged, ({ height }) => {
      document.body.style.paddingBottom = height ? `${height}px` : ''
    })
    loadInterstitial()
  })().catch(() => {
    ready = null
  })
  return ready
}

function loadInterstitial() {
  AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID, isTesting, npa: getConsent() !== 'granted' })
    .then(() => { interstitialLoaded = true })
    .catch(() => {})
}

export async function showNativeBanner() {
  await initNativeAds()
  AdMob.showBanner({
    adId: BANNER_ID,
    isTesting,
    npa: getConsent() !== 'granted',
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
  }).catch(() => {})
}

export function hideNativeBanner() {
  if (!ready) return
  AdMob.removeBanner().catch(() => {})
  document.body.style.paddingBottom = ''
}

export function maybeShowInterstitial() {
  if (!ready || !interstitialLoaded || getConsent() === null) return
  if (Date.now() - lastInterstitial < INTERSTITIAL_GAP_MS) return
  lastInterstitial = Date.now()
  interstitialLoaded = false
  AdMob.showInterstitial().catch(() => {}).finally(loadInterstitial)
}
