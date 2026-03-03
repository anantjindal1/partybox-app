export function Button({ children, onClick, variant = 'primary', disabled, className = '', ...rest }) {
  const base =
    'py-5 rounded-2xl text-2xl font-bold transition-all active:scale-95 active:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface w-full'
  const variants = {
    primary:
      'bg-accent hover:bg-accentMuted text-zinc-900 shadow-soft hover:shadow-card',
    secondary:
      'bg-surfaceMuted hover:bg-slate-500 text-white border border-border shadow-soft',
    ghost:
      'border-2 border-amber-500/70 text-amber-400 bg-transparent hover:bg-accentSoft'
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
