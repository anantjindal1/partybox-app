export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Rozha One"', 'Georgia', '"Times New Roman"', 'serif']
      },
      colors: {
        // Every entry uses the rgb(var(--x-rgb) / <alpha-value>) form so
        // Tailwind's opacity modifiers (bg-emerald/20, border-sapphire/50,
        // etc.) actually work — a plain var(--x) reference to a hex string
        // can't be alpha-blended by Tailwind and silently renders opacity
        // classes as fully transparent. The -rgb custom properties live in
        // src/index.css alongside the original hex ones (kept for direct
        // non-Tailwind consumers like inline SVG strokes).
        bg: 'rgb(var(--color-bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        surfaceElevated: 'rgb(var(--color-surface-elevated-rgb) / <alpha-value>)',
        surfaceMuted: 'rgb(var(--color-surface-muted-rgb) / <alpha-value>)',
        border: 'rgb(var(--color-border-rgb) / <alpha-value>)',
        borderMuted: 'rgb(var(--color-border-muted-rgb) / <alpha-value>)',
        textPrimary: 'rgb(var(--color-text-primary-rgb) / <alpha-value>)',
        textSecondary: 'rgb(var(--color-text-secondary-rgb) / <alpha-value>)',
        textMuted: 'rgb(var(--color-text-muted-rgb) / <alpha-value>)',
        maroon: 'rgb(var(--color-accent-maroon-rgb) / <alpha-value>)',
        gold: 'rgb(var(--color-accent-gold-rgb) / <alpha-value>)',
        teal: 'rgb(var(--color-accent-teal-rgb) / <alpha-value>)',
        terracotta: 'rgb(var(--color-accent-terracotta-rgb) / <alpha-value>)',
        plum: 'rgb(var(--color-accent-plum-rgb) / <alpha-value>)',
        rose: 'rgb(var(--color-accent-rose-rgb) / <alpha-value>)',
        sapphire: 'rgb(var(--color-accent-sapphire-rgb) / <alpha-value>)',
        emerald: 'rgb(var(--color-accent-emerald-rgb) / <alpha-value>)',
        indigo: 'rgb(var(--color-accent-indigo-rgb) / <alpha-value>)',
        fuchsia: 'rgb(var(--color-accent-fuchsia-rgb) / <alpha-value>)',
        slate: 'rgb(var(--color-accent-slate-rgb) / <alpha-value>)',
        turquoise: 'rgb(var(--color-accent-turquoise-rgb) / <alpha-value>)',
        peridot: 'rgb(var(--color-accent-peridot-rgb) / <alpha-value>)',
        jade: 'rgb(var(--color-accent-jade-rgb) / <alpha-value>)',
        amethyst: 'rgb(var(--color-accent-amethyst-rgb) / <alpha-value>)',
        citrine: 'rgb(var(--color-accent-citrine-rgb) / <alpha-value>)',
        orchid: 'rgb(var(--color-accent-orchid-rgb) / <alpha-value>)',
        error: 'rgb(var(--color-error-rgb) / <alpha-value>)',
        onGold: 'rgb(var(--on-gold-rgb) / <alpha-value>)',
        onTeal: 'rgb(var(--on-teal-rgb) / <alpha-value>)',
        onTerracotta: 'rgb(var(--on-terracotta-rgb) / <alpha-value>)',
        onMaroon: 'rgb(var(--on-maroon-rgb) / <alpha-value>)',
        onPlum: 'rgb(var(--on-plum-rgb) / <alpha-value>)',
        onRose: 'rgb(var(--on-rose-rgb) / <alpha-value>)',
        onSapphire: 'rgb(var(--on-sapphire-rgb) / <alpha-value>)',
        onEmerald: 'rgb(var(--on-emerald-rgb) / <alpha-value>)',
        onIndigo: 'rgb(var(--on-indigo-rgb) / <alpha-value>)',
        onFuchsia: 'rgb(var(--on-fuchsia-rgb) / <alpha-value>)',
        onSlate: 'rgb(var(--on-slate-rgb) / <alpha-value>)',
        onTurquoise: 'rgb(var(--on-turquoise-rgb) / <alpha-value>)',
        onPeridot: 'rgb(var(--on-peridot-rgb) / <alpha-value>)',
        onJade: 'rgb(var(--on-jade-rgb) / <alpha-value>)',
        onAmethyst: 'rgb(var(--on-amethyst-rgb) / <alpha-value>)',
        onCitrine: 'rgb(var(--on-citrine-rgb) / <alpha-value>)',
        onOrchid: 'rgb(var(--on-orchid-rgb) / <alpha-value>)',
        // Playing-card colors — theme-invariant on purpose, see index.css.
        cardFace: 'rgb(var(--color-card-face-rgb) / <alpha-value>)',
        cardRed: 'rgb(var(--color-card-red-rgb) / <alpha-value>)',
        cardBlack: 'rgb(var(--color-card-black-rgb) / <alpha-value>)',
        // Legacy aliases so a broad rename can happen incrementally without
        // breaking every call site in one commit.
        accent: 'rgb(var(--color-accent-maroon-rgb) / <alpha-value>)',
        accentMuted: 'rgb(var(--color-accent-gold-rgb) / <alpha-value>)',
        accentSoft: 'rgb(var(--color-surface-muted-rgb) / <alpha-value>)'
      },
      boxShadow: {
        soft: '0 2px 8px rgba(43, 17, 22, 0.12)',
        card: '0 4px 12px rgba(43, 17, 22, 0.14), 0 2px 4px rgba(43, 17, 22, 0.08)',
        'card-hover': '0 8px 24px rgba(43, 17, 22, 0.18), 0 4px 8px rgba(43, 17, 22, 0.1)'
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        'pop': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' }
        },
        'deal-in': {
          // Motion CURVE only — the DISTANCE (where a card flies in from)
          // is a per-element --deal-from custom property (a fixed keyframe
          // can't know where each seat sits on the table), read here so
          // the animation actually interpolates from it to identity.
          '0%': { opacity: '0', transform: 'var(--deal-from, translate(0,0))' },
          '60%': { opacity: '1' },
          '100%': { opacity: '1', transform: 'translate(0, 0) rotate(0deg)' }
        },
        'turn-glow': {
          '0%, 100%': { boxShadow: '0 0 0 2px var(--turn-glow-color, currentColor)' },
          '50%': { boxShadow: '0 0 0 5px var(--turn-glow-color, currentColor)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'scale-in': 'scale-in 0.22s ease-out',
        'pop': 'pop 0.25s ease-in-out',
        'deal-in': 'deal-in 0.35s ease-out both',
        'turn-glow': 'turn-glow 1.6s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
