export function Button({ children, onClick, variant = 'primary', disabled, className = '', ...rest }) {
  const base =
    'py-5 rounded-2xl text-2xl font-bold transition-all active:scale-95 active:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg w-full'
  const variants = {
    primary:
      'bg-maroon hover:opacity-90 text-onMaroon shadow-soft hover:shadow-card',
    secondary:
      'bg-teal hover:opacity-90 text-onTeal border border-border shadow-soft',
    ghost:
      'border-2 border-gold/70 text-gold bg-transparent hover:bg-surfaceMuted'
  }
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}
