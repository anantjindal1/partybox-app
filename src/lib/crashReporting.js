import { Capacitor } from '@capacitor/core'
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics'

const isNative = Capacitor.isNativePlatform()

// Crashlytics only sees native crashes on its own; in a WebView app nearly
// every real bug is a JS error, so those are forwarded as non-fatals.
export function reportError(error, context) {
  if (!isNative) return
  const message = `${context}: ${error?.message ?? String(error)}`.slice(0, 500)
  const stack = (error?.stack ?? '').split('\n').slice(0, 8).join('\n')
  FirebaseCrashlytics.recordException({
    message,
    keysAndValues: [
      { key: 'js_stack', value: stack, type: 'string' },
      { key: 'route', value: window.location.pathname, type: 'string' },
    ],
  }).catch(() => {})
}

export function initCrashReporting() {
  if (!isNative) return
  window.addEventListener('error', e => reportError(e.error ?? e.message, 'window.error'))
  window.addEventListener('unhandledrejection', e => reportError(e.reason, 'unhandledrejection'))
}
