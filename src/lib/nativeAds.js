import { getConsent } from './consent'
import { getAdsRemoved } from './purchases'
import { AdMob, AdmobConsentStatus, BannerAdPluginEvents, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob'

const BANNER_ID = 'ca-app-pub-3358980300827715/8976694040'
const INTERSTITIAL_ID = 'ca-app-pub-3358980300827715/1601515337'
// Our own devices get test ads from the real units, so development never
// counts as invalid traffic. Hashed IDs come from the "Use
// RequestConfiguration...setTestDeviceIds" line in logcat.
const TEST_DEVICES = [
  '92925F21FE994A78DDB066E682E88132', // Samsung tablet SM-X216B
]

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
    await AdMob.initialize({ initializeForTesting: true, testingDevices: TEST_DEVICES })
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
  AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID, npa: getConsent() !== 'granted' })
    .then(() => { interstitialLoaded = true })
    .catch(() => {})
}

export async function showNativeBanner() {
  await initNativeAds()
  AdMob.showBanner({
    adId: BANNER_ID,
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
  if (!ready || !interstitialLoaded || getConsent() === null || getAdsRemoved()) return
  if (Date.now() - lastInterstitial < INTERSTITIAL_GAP_MS) return
  lastInterstitial = Date.now()
  interstitialLoaded = false
  AdMob.showInterstitial().catch(() => {}).finally(loadInterstitial)
}
