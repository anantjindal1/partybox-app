/**
 * Card suit glyphs as inline SVG (fill="currentColor") — vector, not emoji,
 * matching the app's icon-system convention. Kept separate from
 * gameIcons.jsx since these render inside playing cards, not game lists.
 */

export function SpadeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C9 6.5 3 11 3 15.5A5 5 0 0012 18a5 5 0 009-2.5C21 11 15 6.5 12 2z" />
      <path d="M12 16c-.6 3-1.6 4.6-3.2 6h6.4c-1.6-1.4-2.6-3-3.2-6z" />
    </svg>
  )
}

export function HeartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 21s-7.5-5-10-9.5C.4 8 2 4 6 4c2.2 0 3.8 1.2 6 3.5C14.2 5.2 15.8 4 18 4c4 0 5.6 4 4 7.5C19.5 16 12 21 12 21z" />
    </svg>
  )
}

export function DiamondIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2L20 12L12 22L4 12Z" />
    </svg>
  )
}

export function ClubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="7.5" r="4" />
      <circle cx="7" cy="13" r="4" />
      <circle cx="17" cy="13" r="4" />
      <path d="M12 12c-.6 4-1.6 6.6-3.2 9h6.4c-1.6-2.4-2.6-5-3.2-9z" />
    </svg>
  )
}

export const SUIT_ICONS = {
  spades: SpadeIcon,
  hearts: HeartIcon,
  diamonds: DiamondIcon,
  clubs: ClubIcon
}

export const SUIT_COLOR = {
  spades: 'cardBlack',
  clubs: 'cardBlack',
  hearts: 'cardRed',
  diamonds: 'cardRed'
}
