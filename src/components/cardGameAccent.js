/**
 * Literal Tailwind class strings per accent color, for components shared
 * across many games (each owning a different accent — see
 * src/pages/Home.jsx's ACCENT_STYLES for the sibling pattern). Tailwind's
 * content scanner needs literal class strings, never template-interpolated
 * or runtime-derived (e.g. string.replace()) ones, so every variant used
 * anywhere (including `dot`) is spelled out explicitly here rather than
 * derived from another field at render time.
 */
export const CARD_GAME_ACCENT_CLASSES = {
  maroon: { border: 'border-maroon', soft: 'bg-maroon/10', text: 'text-maroon', dot: 'bg-maroon', button: 'bg-maroon text-onMaroon' },
  gold: { border: 'border-gold', soft: 'bg-gold/10', text: 'text-gold', dot: 'bg-gold', button: 'bg-gold text-onGold' },
  teal: { border: 'border-teal', soft: 'bg-teal/10', text: 'text-teal', dot: 'bg-teal', button: 'bg-teal text-onTeal' },
  terracotta: { border: 'border-terracotta', soft: 'bg-terracotta/10', text: 'text-terracotta', dot: 'bg-terracotta', button: 'bg-terracotta text-onTerracotta' },
  plum: { border: 'border-plum', soft: 'bg-plum/10', text: 'text-plum', dot: 'bg-plum', button: 'bg-plum text-onPlum' },
  rose: { border: 'border-rose', soft: 'bg-rose/10', text: 'text-rose', dot: 'bg-rose', button: 'bg-rose text-onRose' },
  sapphire: { border: 'border-sapphire', soft: 'bg-sapphire/10', text: 'text-sapphire', dot: 'bg-sapphire', button: 'bg-sapphire text-onSapphire' },
  emerald: { border: 'border-emerald', soft: 'bg-emerald/10', text: 'text-emerald', dot: 'bg-emerald', button: 'bg-emerald text-onEmerald' },
  indigo: { border: 'border-indigo', soft: 'bg-indigo/10', text: 'text-indigo', dot: 'bg-indigo', button: 'bg-indigo text-onIndigo' },
  fuchsia: { border: 'border-fuchsia', soft: 'bg-fuchsia/10', text: 'text-fuchsia', dot: 'bg-fuchsia', button: 'bg-fuchsia text-onFuchsia' },
  slate: { border: 'border-slate', soft: 'bg-slate/10', text: 'text-slate', dot: 'bg-slate', button: 'bg-slate text-onSlate' },
  turquoise: { border: 'border-turquoise', soft: 'bg-turquoise/10', text: 'text-turquoise', dot: 'bg-turquoise', button: 'bg-turquoise text-onTurquoise' },
  peridot: { border: 'border-peridot', soft: 'bg-peridot/10', text: 'text-peridot', dot: 'bg-peridot', button: 'bg-peridot text-onPeridot' },
  jade: { border: 'border-jade', soft: 'bg-jade/10', text: 'text-jade', dot: 'bg-jade', button: 'bg-jade text-onJade' },
}
