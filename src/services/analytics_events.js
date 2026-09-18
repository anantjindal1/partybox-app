/**
 * Thin PartyBox-specific re-export of the portable analytics core
 * (src/lib/analytics/core.js), kept so existing call sites that import
 * `trackEvent` from here don't need to change. New code should prefer
 * importing directly from '../lib/analytics/core'.
 */
export { trackEvent } from '../lib/analytics/core'
