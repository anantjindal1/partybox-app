import { useLang } from '../store/LangContext'

export function ConnectionOverlay({ connected }) {
  const { t } = useLang()
  if (connected) return null
  return (
    <div className="fixed inset-0 z-50 bg-surface/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-surfaceElevated border border-border rounded-2xl px-6 py-5 text-center max-w-xs mx-4 shadow-card">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-error mx-auto mb-2">
          <path d="M2 8.82a15 15 0 0120-.34M5 12.86a10 10 0 0114-.14M8.5 16.43a5 5 0 017 0" />
          <path d="M1 1l22 22" />
          <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
        </svg>
        <p className="text-textPrimary font-semibold">{t('connectionLost')}</p>
      </div>
    </div>
  )
}
