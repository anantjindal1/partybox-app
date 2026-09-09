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
export function RaisedHandIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 12V5a1.5 1.5 0 013 0v5" />
      <path d="M11 10V4a1.5 1.5 0 013 0v6" />
      <path d="M14 10V5a1.5 1.5 0 013 0v7" />
      <path d="M17 12V9a1.5 1.5 0 013 0v6c0 3.9-3.1 7-7 7h-2c-2.5 0-4-1-5.5-3L3 16.5c-.6-.8-.3-2 .7-2.3.6-.2 1.3 0 1.7.5L8 17" />
    </svg>
  )
}

export function TicketIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 9.5h19M2.5 14.5h19" />
      <path d="M7.5 5v4.5M12 5v4.5M16.5 5v4.5M7.5 14.5V19M12 14.5V19M16.5 14.5V19" />
    </svg>
  )
}

export function MagnifyingGlassIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.8-4.8" />
    </svg>
  )
}

export function MaskIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3c-4.5 0-8 1.8-8 5 0 5 3 10 8 10s8-5 8-10c0-3.2-3.5-5-8-5z" />
      <path d="M7.5 10.5c0-1 .8-1.5 1.8-1.5s1.7.5 1.7 1.5" />
      <path d="M13 10.5c0-1 .8-1.5 1.8-1.5s1.7.5 1.7 1.5" />
      <path d="M9 15c1 .8 2 .8 3 0" />
    </svg>
  )
}

export function SpeechBubbleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 5h16a1 1 0 011 1v9a1 1 0 01-1 1H9l-4.5 4V16H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
      <path d="M8 10.5h3M13 10.5h3" />
    </svg>
  )
}

export function DoorExitIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 4H6a1 1 0 00-1 1v14a1 1 0 001 1h7" />
      <path d="M16 12h5m0 0l-3-3m3 3l-3 3" />
      <path d="M13 4v16" strokeOpacity="0.4" />
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
  'sabse-zyada-kaun': RaisedHandIcon,
  'sabse-zyada-kaun-offline': RaisedHandIcon,
  'tambola': TicketIcon,
  'bhed': MagnifyingGlassIcon,
  'bluff': MaskIcon,
  'bakwaas': SpeechBubbleIcon,
  'bhabhi': DoorExitIcon,
}

export function getGameIcon(slug) {
  return GAME_ICONS[slug] ?? DiceIcon
}
