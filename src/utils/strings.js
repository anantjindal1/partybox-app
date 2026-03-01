/**
 * Resolve a game title to a plain string.
 * Titles are either plain strings or { en, hi } objects — handle both.
 */
export function resolveTitle(gameTitle, lang = 'en') {
  if (!gameTitle) return ''
  if (typeof gameTitle === 'string') return gameTitle
  return gameTitle[lang] || gameTitle.en || gameTitle.hi || ''
}
