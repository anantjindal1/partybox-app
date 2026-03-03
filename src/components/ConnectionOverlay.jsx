import { useLang } from '../store/LangContext'

export function ConnectionOverlay({ connected }) {
  const { t } = useLang()
  if (connected) return null
  return (
    <div className="fixed inset-0 z-50 bg-surface/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-surfaceElevated border border-border rounded-2xl px-6 py-5 text-center max-w-xs mx-4 shadow-card">
        <p className="text-2xl mb-2">📴</p>
        <p className="text-zinc-100 font-semibold">{t('connectionLost')}</p>
      </div>
    </div>
  )
}
