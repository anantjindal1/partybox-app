import { useEffect, useRef } from 'react'

/**
 * Abstracts tap / swipe / volume input into onCorrect / onPass callbacks.
 * Tap mode: attach handlers to buttons directly — this hook does nothing extra.
 * Swipe mode: listens to touch events on window.
 * Volume mode: listens to keyboard AudioVolume keys (best-effort on Android).
 */
export function useInputController(mode, onCorrect, onPass, enabled = true) {
  const touchStartX = useRef(null)
  const onCorrectRef = useRef(onCorrect)
  const onPassRef = useRef(onPass)

  // Keep refs current without re-registering listeners
  useEffect(() => { onCorrectRef.current = onCorrect }, [onCorrect])
  useEffect(() => { onPassRef.current = onPass }, [onPass])

  useEffect(() => {
    if (!enabled) return

    if (mode === 'swipe') {
      const onTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX
      }
      const onTouchEnd = (e) => {
        if (touchStartX.current === null) return
        const deltaX = e.changedTouches[0].clientX - touchStartX.current
        touchStartX.current = null
        if (Math.abs(deltaX) < 60) return   // too short — ignore
        if (deltaX > 0) onCorrectRef.current()
        else onPassRef.current()
      }
      window.addEventListener('touchstart', onTouchStart, { passive: true })
      window.addEventListener('touchend', onTouchEnd)
      return () => {
        window.removeEventListener('touchstart', onTouchStart)
        window.removeEventListener('touchend', onTouchEnd)
      }
    }

    if (mode === 'volume') {
      const onKeyDown = (e) => {
        if (e.code === 'AudioVolumeUp' || e.key === 'AudioVolumeUp') {
          e.preventDefault()
          onCorrectRef.current()
        } else if (e.code === 'AudioVolumeDown' || e.key === 'AudioVolumeDown') {
          e.preventDefault()
          onPassRef.current()
        }
      }
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    }
    // tap mode — nothing to register; buttons handle it directly
  }, [mode, enabled])
}
