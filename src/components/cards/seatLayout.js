/**
 * Pure table-geometry helpers — no Firebase, no React. Shared by
 * CardTable.jsx so every card game's "seats around a table" layout and
 * hand-fan sizing come from the same tuned formulas.
 */

/**
 * Distributes `total` opponent seats across the table's top arc
 * (170° down to 10°, standard math angle where 90° is top-center) so
 * "me" — always rendered below/outside the table — never collides
 * with an opponent seat. Returns CSS percentage coordinates relative
 * to the table surface.
 */
export function getSeatPosition(index, total) {
  if (total <= 1) return { left: '50%', top: '20%' }
  const angle = 155 - index * (130 / (total - 1))
  const rad = (angle * Math.PI) / 180
  return {
    left: `${50 + 38 * Math.cos(rad)}%`,
    top: `${50 - 34 * Math.sin(rad)}%`
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
