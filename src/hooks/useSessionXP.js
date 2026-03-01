import { useRef, useState, useEffect } from 'react'
import { clearSavedState } from '../services/gameStatePersistence'
import { checkAndUpdateHighScore } from '../services/highScores'
import { awardXP } from '../services/xp'

/**
 * Encapsulates the session-end XP award + high score check pattern shared by
 * quiz-style games (TezHisab, SpotTheJugaad, BollywoodEmojiGuess).
 *
 * Fires exactly once when `phase === endPhase`, then resets when phase changes away.
 *
 * @param {object} params
 * @param {string}   params.phase     - Current game phase from state
 * @param {string}   params.endPhase  - The phase that triggers the end (e.g. 'session_end')
 * @param {number}   params.score     - Final score used for high score comparison
 * @param {string}   params.slug      - Game slug for high score key and save clearing
 * @param {function} params.computeXP - () => number — returns XP to award; called once at end
 *
 * @returns {{ isNewRecord: boolean }}
 */
export function useSessionXP({ phase, endPhase, score, slug, computeXP }) {
  const xpAwardedRef = useRef(false)
  const [isNewRecord, setIsNewRecord] = useState(false)

  useEffect(() => {
    if (phase !== endPhase) {
      xpAwardedRef.current = false
      return
    }
    if (xpAwardedRef.current) return
    xpAwardedRef.current = true

    clearSavedState(slug)

    const xp = computeXP()
    if (xp > 0) awardXP(xp).catch(() => {})

    const { isNewRecord: rec } = checkAndUpdateHighScore(slug, score)
    setIsNewRecord(rec)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  return { isNewRecord }
}
