/**
 * Reusable card container with soft shadow and optional hover lift.
 * Uses design tokens for surface, border, and shadow.
 */
export function Card({ children, onClick, className = '', elevated = false }) {
  const base =
    'rounded-2xl bg-surfaceElevated border border-border/60 shadow-card transition-all duration-200'
  const hover = onClick
    ? 'hover:shadow-card-hover hover:border-borderMuted cursor-pointer active:scale-[0.99]'
    : ''
  const elevation = elevated ? 'shadow-card-hover' : ''

  const Component = onClick ? 'button' : 'div'
  const props = onClick ? { onClick, type: 'button' } : {}

  return (
    <Component
      className={`${base} ${hover} ${elevation} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  )
}
