import { logEvent } from 'firebase/analytics'
import { analytics } from '../firebase'

/**
 * Tracks an event to Firebase Analytics.
 * No-ops when Analytics is not configured (offline or missing measurementId).
 */
export function trackEvent(name, params = {}) {
  if (!analytics) return
  try {
    logEvent(analytics, name, params)
  } catch (e) {
    // Silent fail — analytics is non-critical
  }
}
