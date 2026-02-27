/**
 * Wraps children in a fade-in animation div.
 * Change `key` on the parent to re-trigger the animation (e.g. on phase change).
 * variant: 'fade' (default) | 'scale'
 */
export function FadeIn({ children, className = '', variant = 'fade' }) {
  const animClass = variant === 'scale' ? 'animate-scale-in' : 'animate-fade-in'
  return (
    <div className={`${animClass} ${className}`}>
      {children}
    </div>
  )
}
