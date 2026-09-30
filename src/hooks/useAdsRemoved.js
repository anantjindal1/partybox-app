import { useSyncExternalStore } from 'react'
import { getAdsRemoved, subscribeAdsRemoved } from '../lib/purchases'

export function useAdsRemoved() {
  return useSyncExternalStore(subscribeAdsRemoved, getAdsRemoved, () => false)
}
