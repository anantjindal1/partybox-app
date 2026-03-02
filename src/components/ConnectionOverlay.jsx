import { useLang } from '../store/LangContext'

export function ConnectionOverlay({ connected }) {
  const { t } = useLang()
  if (connected) return null
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl px-6 py-5 text-center max-w-xs mx-4">
        <p className="text-2xl mb-2">📴</p>
        <p className="text-zinc-100 font-semibold">{t('connectionLost')}</p>
      </div>
    </div>
  )
}
