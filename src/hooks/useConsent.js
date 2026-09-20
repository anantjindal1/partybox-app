import { useSyncExternalStore } from 'react'
import { getConsent, subscribeConsent } from '../lib/consent'

export function useConsent() {
  return useSyncExternalStore(subscribeConsent, getConsent, () => null)
}
