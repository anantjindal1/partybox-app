import { useState } from 'react'
import { getSavedState, clearSavedState } from '../services/gameStatePersistence'

/**
 * Encapsulates the save/resume boilerplate shared by every offline game.
 *
 * @param {string} slug - Game slug, used as the localStorage key.
 * @param {function} onRestore - Called with the saved state when the player taps Resume.
 *   Typically: (saved) => dispatch({ type: ACTIONS.RESTORE_STATE, payload: saved })
 *
 * @returns {{ showResumeGate: boolean, resume: function, startNew: function }}
 *   - showResumeGate: true when a saved game exists AND the gate hasn't been dismissed
 *   - resume: dismisses gate and restores state
 *   - startNew: clears save and dismisses gate
 */
export function useGamePersistence(slug, onRestore) {
  const [savedState] = useState(() => getSavedState(slug))
  const [showResumeGate, setShowResumeGate] = useState(!!savedState)

  function resume() {
    if (savedState) onRestore(savedState)
    setShowResumeGate(false)
  }

  function startNew() {
    clearSavedState(slug)
    setShowResumeGate(false)
  }

  return {
    showResumeGate: showResumeGate && !!savedState,
    resume,
    startNew
  }
}
