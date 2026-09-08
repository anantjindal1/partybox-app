export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Rozha One"', 'Georgia', '"Times New Roman"', 'serif']
      },
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        surfaceElevated: 'var(--color-surface-elevated)',
        surfaceMuted: 'var(--color-surface-muted)',
        border: 'var(--color-border)',
        borderMuted: 'var(--color-border-muted)',
        textPrimary: 'var(--color-text-primary)',
        textSecondary: 'var(--color-text-secondary)',
        textMuted: 'var(--color-text-muted)',
        maroon: 'var(--color-accent-maroon)',
        gold: 'var(--color-accent-gold)',
        teal: 'var(--color-accent-teal)',
        terracotta: 'var(--color-accent-terracotta)',
        plum: 'var(--color-accent-plum)',
        rose: 'var(--color-accent-rose)',
        error: 'var(--color-error)',
        onGold: 'var(--on-gold)',
        onTeal: 'var(--on-teal)',
        onTerracotta: 'var(--on-terracotta)',
        onMaroon: 'var(--on-maroon)',
        onPlum: 'var(--on-plum)',
        onRose: 'var(--on-rose)',
        // Legacy aliases so a broad rename can happen incrementally without
        // breaking every call site in one commit.
        accent: 'var(--color-accent-maroon)',
        accentMuted: 'var(--color-accent-gold)',
        accentSoft: 'var(--color-surface-muted)'
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
        }
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'scale-in': 'scale-in 0.22s ease-out',
        'pop': 'pop 0.25s ease-in-out'
      }
    }
  },
  plugins: []
}
