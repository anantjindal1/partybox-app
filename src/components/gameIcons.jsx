/**
 * Shared per-game SVG icon components. Real icons only, never emoji — the
 * design system's non-negotiable rule. Extracted out of Home.jsx so
 * CreateRoomSheet (and any future consumer) can share the same set instead of
 * each re-deriving its own from metadata.icon emoji strings.
 */

export function BoltIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  )
}
export function ClapperboardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 8l1.5-4h4L7 8" /><path d="M7 8l1.5-4h4L11 8" /><path d="M11 8l1.5-4h4L15 8" />
      <rect x="3" y="8" width="18" height="12" rx="1.5" />
    </svg>
  )
}
export function BellIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 01-3.4 0" />
    </svg>
  )
}
export function CrownIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 8l4 3 5-6 5 6 4-3-1.5 10h-15L3 8z" />
      <path d="M6.5 18h11" />
    </svg>
  )
}
export function SoloIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <circle cx="12" cy="8" r="3.2" /><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  )
}
export function PartyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <circle cx="9" cy="8" r="3" /><circle cx="16" cy="9" r="2.6" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M14 20c.3-2.6 2-4.6 4.3-5.4" />
    </svg>
  )
}
export function SignalIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M4 10a12 12 0 0116 0" /><path d="M7.5 13.5a7.5 7.5 0 019 0" />
      <circle cx="12" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}
export function DiceIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** slug -> icon component, for anywhere a game needs its icon outside Home.jsx's own card layout. */
export const GAME_ICONS = {
  'thinkfast': BoltIcon,
  'dumb-charades-offline': ClapperboardIcon,
  'dumb-charades': ClapperboardIcon,
  'firstbell': BellIcon,
  'raja-mantri': CrownIcon,
}

export function getGameIcon(slug) {
  return GAME_ICONS[slug] ?? DiceIcon
}
