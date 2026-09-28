import { Capacitor } from '@capacitor/core'

export const PUBLIC_ORIGIN = 'https://partybox-app.vercel.app'

// Inside the native app window.location is https://localhost, which is useless
// to a browser guest — shared links must always point at the public site.
export function publicUrl(path = window.location.pathname + window.location.search) {
  const origin = Capacitor.isNativePlatform() ? PUBLIC_ORIGIN : window.location.origin
  return origin + path
}
