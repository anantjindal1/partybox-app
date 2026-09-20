import { useEffect, useRef } from 'react'

const TURN_PATTERN = [120, 60, 120]

/**
 * Buzzes the phone when `isMyTurn` flips from false to true. A no-op
 * wherever the Vibration API isn't available (iOS Safari, desktop).
 */
export function useTurnVibration(isMyTurn) {
  const wasMyTurn = useRef(false)
  useEffect(() => {
    if (isMyTurn && !wasMyTurn.current) navigator.vibrate?.(TURN_PATTERN)
    wasMyTurn.current = isMyTurn
  }, [isMyTurn])
}
