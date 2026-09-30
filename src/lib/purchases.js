import { Capacitor } from '@capacitor/core'
import { Purchases } from '@revenuecat/purchases-capacitor'

const isNative = Capacitor.isNativePlatform()
const API_KEY = 'goog_IbCejiuaxDINpQEtQwYxcikxeNJ' // RevenueCat public SDK key
const ENTITLEMENT = 'no_ads'
// Last known answer, so ads don't flash on launch for someone who paid.
// RevenueCat stays the source of truth and overwrites it on every start.
const CACHE_KEY = 'partybox_ads_removed'

let adsRemoved = readCache()
let ready = null
const listeners = new Set()

function readCache() {
  try { return localStorage.getItem(CACHE_KEY) === '1' } catch { return false }
}

function applyCustomerInfo(customerInfo) {
  const next = !!customerInfo?.entitlements?.active?.[ENTITLEMENT]
  try { localStorage.setItem(CACHE_KEY, next ? '1' : '0') } catch {}
  if (next !== adsRemoved) {
    adsRemoved = next
    listeners.forEach(l => l())
  }
}

export function initPurchases() {
  if (!isNative) return Promise.resolve()
  if (ready) return ready
  ready = (async () => {
    await Purchases.configure({ apiKey: API_KEY })
    await Purchases.addCustomerInfoUpdateListener(applyCustomerInfo)
    const { customerInfo } = await Purchases.getCustomerInfo()
    applyCustomerInfo(customerInfo)
  })().catch(() => { ready = null })
  return ready
}

export function getAdsRemoved() {
  return adsRemoved
}

export function subscribeAdsRemoved(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// The Remove Ads package from the current RevenueCat offering, or null when
// the store isn't reachable or the product isn't set up yet.
export async function getRemoveAdsPackage() {
  if (!isNative) return null
  await initPurchases()
  const offerings = await Purchases.getOfferings()
  return offerings.current?.availablePackages?.[0] ?? null
}

// Resolves true on success, false if the user backed out; throws otherwise.
export async function buyRemoveAds(aPackage) {
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage })
    applyCustomerInfo(customerInfo)
    return adsRemoved
  } catch (e) {
    if (e?.userCancelled) return false
    throw e
  }
}

export async function restorePurchases() {
  await initPurchases()
  const { customerInfo } = await Purchases.restorePurchases()
  applyCustomerInfo(customerInfo)
  return adsRemoved
}
