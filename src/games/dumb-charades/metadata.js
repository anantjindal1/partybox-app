export default {
  slug: 'dumb-charades',
  title: { en: 'Dumb Charades', hi: 'डम्ब शरेड्स' },
  icon: '🎭',
  minPlayers: 2,
  maxPlayers: 20,
  offline: true,
  singleDevice: true,
  onlineEnabled: true,
  resultsDurationMs: 20000,
  // Already fires its own game_start/game_complete/game_abandon via
  // src/lib/analytics/core.js directly (DumbCharades.jsx) — Room.jsx's
  // generic tracking must skip this game to avoid double-counting.
  analyticsSelfInstrumented: true,
}
