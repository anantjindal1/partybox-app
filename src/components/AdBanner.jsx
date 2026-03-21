const isDev = import.meta.env.DEV

/**
 * AdBanner — a placeholder slot for a future ad network.
 *
 * In development: shows a labelled placeholder box.
 * In production: renders an empty 60px container ready for script injection.
 *
 * To activate later: drop the ad network <script> tag into index.html and
 * target the element by id (`ad-slot-{slot}`) or data-ad-slot attribute.
 *
 * Props:
 *   slot      {string}  — unique slot identifier, e.g. "home-bottom"
 *   className {string}  — optional extra Tailwind classes
 */
export default function AdBanner({ slot, className = '' }) {
  return (
    <div
      id={`ad-slot-${slot}`}
      data-ad-slot={slot}
      className={`w-full h-[60px] bg-zinc-900/80 border border-zinc-700/30 rounded-xl flex items-center justify-center ${className}`}
    >
      {isDev && (
        <span className="text-zinc-600 text-xs select-none">
          Ad slot: {slot}
        </span>
      )}
    </div>
  )
}
