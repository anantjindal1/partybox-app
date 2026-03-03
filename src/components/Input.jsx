/**
 * Shared text input using design tokens.
 * Rounded, bordered, with focus ring for accessibility.
 */
export function Input({ className = '', ...props }) {
  return (
    <input
      className={`bg-surfaceElevated border border-border text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-colors ${className}`.trim()}
      {...props}
    />
  )
}
