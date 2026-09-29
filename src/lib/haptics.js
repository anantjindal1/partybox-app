import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

const isNative = Capacitor.isNativePlatform()

export function tapHaptic() {
  if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
}

export function turnHaptic() {
  if (isNative) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {})
}
