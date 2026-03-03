export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f172a',
        surfaceElevated: '#1e293b',
        surfaceMuted: '#334155',
        accent: '#f59e0b',
        accentMuted: '#fbbf24',
        accentSoft: 'rgba(245, 158, 11, 0.15)',
        border: '#334155',
        borderMuted: '#475569'
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.15)',
        card: '0 4px 12px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.15)'
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
