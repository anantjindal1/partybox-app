import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../store/LangContext'
import { useProfile } from '../hooks/useProfile'
import { createRoom } from '../services/room'

export function CreateRoomSheet({ game, onClose }) {
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const { profile } = useProfile()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!game) return null

  async function handleSelect(roomType) {
    if (!profile || loading) return
    setLoading(true)
    setError('')
    try {
      const code = await createRoom(
        profile.id,
        profile.name,
        game.slug,
        profile.avatar,
        roomType
      )
      navigate(`/room/${code}`)
    } catch {
      setError(t('createRoomFailed'))
      setLoading(false)
    }
  }

  const gameTitle = typeof game.title === 'object'
    ? (game.title[lang] || game.title.en || game.slug)
    : game.title

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
        aria-hidden
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-700/60 rounded-t-3xl px-5 pt-5 pb-8 max-w-lg mx-auto">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />

        {/* Game header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">{game.icon}</span>
          <div>
            <p className="text-white text-lg font-bold">{gameTitle}</p>
            <p className="text-zinc-500 text-sm">
              {game.minPlayers}–{game.maxPlayers} {t('players')}
            </p>
          </div>
        </div>

        {/* Room type selection */}
        <p className="text-zinc-400 text-sm font-medium mb-3 uppercase tracking-wider">
          Choose mode
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleSelect('casual')}
            disabled={loading}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-800 border border-zinc-700/60 hover:border-zinc-500/60 hover:bg-zinc-800/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <span className="text-3xl">🎲</span>
            <div>
              <p className="text-white font-bold">{t('casualRoom')}</p>
              <p className="text-zinc-400 text-sm">{t('casualDesc')}</p>
            </div>
          </button>

          <button
            onClick={() => handleSelect('ranked')}
            disabled={loading}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-800 border border-amber-500/30 hover:border-amber-500/60 hover:bg-zinc-800/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <span className="text-3xl">🏆</span>
            <div>
              <p className="text-amber-400 font-bold">{t('rankedRoom')}</p>
              <p className="text-zinc-400 text-sm">{t('rankedDesc')}</p>
            </div>
          </button>
        </div>

        {loading && (
          <p className="text-zinc-500 text-sm text-center mt-4 animate-pulse">Creating room...</p>
        )}
        {error && (
          <p className="text-red-400 text-sm text-center mt-4">{error}</p>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full text-zinc-500 hover:text-zinc-300 text-sm font-medium py-2 transition-colors"
        >
          {t('back')}
        </button>
      </div>
    </>
  )
}
