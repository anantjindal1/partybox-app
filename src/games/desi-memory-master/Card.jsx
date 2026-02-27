/**
 * Single card with CSS-only flip animation (< 300ms). Shows value when face-up, back when face-down.
 */
export function Card({ value, isFlipped, isMatched, onClick, disabled }) {
  const showFront = isFlipped || isMatched
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isMatched}
      className="relative w-full aspect-square rounded-xl overflow-hidden touch-manipulation focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
      style={{ perspective: '400px' }}
      aria-pressed={showFront}
      aria-label={showFront ? value : 'Hidden card'}
    >
      <div
        className="absolute inset-0"
        style={{
          transformStyle: 'preserve-3d',
          transform: showFront ? 'rotateY(0deg)' : 'rotateY(180deg)',
          transition: 'transform 0.28s ease-out'
        }}
      >
        {/* Back of card */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 border-2 border-amber-500/50"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <span className="text-2xl sm:text-3xl" aria-hidden>🧠</span>
        </div>
        {/* Front of card */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-700 border-2 border-zinc-600 p-1 text-center"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          <span className="text-xs sm:text-sm font-bold text-zinc-100 line-clamp-2 break-words">
            {value}
          </span>
        </div>
      </div>
    </button>
  )
}
