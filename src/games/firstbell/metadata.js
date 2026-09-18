export default {
  slug: 'firstbell',
  title: { en: 'FirstBell', hi: 'फर्स्टबेल' },
  icon: '⚡',
  minPlayers: 2,
  maxPlayers: 6,
  noAutoClose: true,
  // Already fires its own game_start/game_complete/game_abandon/rematch
  // via src/lib/analytics/core.js directly — Room.jsx's generic tracking
  // must skip this game to avoid double-counting.
  analyticsSelfInstrumented: true,
}
