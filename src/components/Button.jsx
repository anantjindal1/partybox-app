export function Button({ children, onClick, variant = 'primary', disabled, ...rest }) {
  const base = 'w-full py-5 rounded-2xl text-2xl font-bold transition-all active:scale-95 active:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-amber-500 hover:bg-amber-400 text-zinc-900',
    secondary: 'bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600',
    ghost: 'border-2 border-amber-500/70 text-amber-400 bg-transparent hover:bg-amber-500/10'
  }
  return (
    <button
      className={`${base} ${variants[variant]}`}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}
