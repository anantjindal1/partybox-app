/**
 * Pure speed-lock resolution — no Firebase, no React, fully unit-testable.
 * Determines the winner of a speed round based on who submitted a valid action first.
 *
 * Actions must have shape: { playerId, createdAt: { seconds }, ... }
 * validateFn(action) → boolean — returns true for valid actions.
 */

export function resolveSpeedRound(actions, validateFn) {
  const sorted = [...actions].sort(
    (a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0)
  )

  let winnerId = null
  let resolvedAt = null
  const lateActions = []
  const invalidActions = []

  for (const action of sorted) {
    if (!validateFn(action)) {
      invalidActions.push(action)
    } else if (winnerId === null) {
      winnerId = action.playerId
      resolvedAt = action.createdAt
    } else {
      lateActions.push(action)
    }
  }

  return { winnerId, resolvedAt, lateActions, invalidActions }
}
