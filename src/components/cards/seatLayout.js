/**
 * Pure table-geometry helpers — no Firebase, no React. Shared by
 * CardTable.jsx so every card game's "seats around a table" layout and
 * hand-fan sizing come from the same tuned formulas.
 */

/**
 * Distributes `total` opponent seats across the table's top arc (155°
 * down to 25°, standard math angle where 90° is top-center) so "me" —
 * always rendered below/outside the table — never collides with an
 * opponent seat. Returns CSS percentage coordinates relative to the
 * table surface.
 */
export function getSeatPosition(index, total) {
  if (total <= 1) return { left: '50%', top: '20%' }
  const angle = 155 - index * (130 / (total - 1))
  const rad = (angle * Math.PI) / 180
  return {
    left: `${50 + 40 * Math.cos(rad)}%`,
    top: `${50 - 34 * Math.sin(rad)}%`
  }
}

/**
 * Distributes `total` seats evenly around the FULL oval (360°, starting
 * at the top and going clockwise) — for the pre-game lobby, where every
 * player is just "a seat at the table" with no viewer-relative "me"
 * position to keep clear, unlike getSeatPosition's top-arc-only layout.
 */
export function getLobbySeatPosition(index, total) {
  if (total <= 1) return { left: '50%', top: '50%' }
  const angle = (360 / total) * index - 90
  const rad = (angle * Math.PI) / 180
  return {
    left: `${50 + 42 * Math.cos(rad)}%`,
    top: `${50 + 38 * Math.sin(rad)}%`
  }
}

/**
 * Picks a horizontal card-to-card step that keeps a hand of `count`
 * cards within `targetWidth`, without over-tightening a small hand
 * that would already fit comfortably at a natural spacing.
 */
export function getHandStep(count, cardWidth, targetWidth = 340) {
  if (count <= 1) return cardWidth
  const comfortable = cardWidth - 10
  const required = (targetWidth - cardWidth) / (count - 1)
  return Math.min(comfortable, required)
}
