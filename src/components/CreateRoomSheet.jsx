import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../store/LangContext'
import { useProfile } from '../hooks/useProfile'
import { createRoom } from '../services/room'
import { Card } from './Card'
import { getGameIcon, DiceIcon } from './gameIcons'

function TrophyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 4h8v5a4 4 0 01-8 0V4z" />
      <path d="M8 5H5a3 3 0 003 3M16 5h3a3 3 0 01-3 3" />
      <path d="M12 13v3M9 20h6M10 16.5h4v3.5h-4z" />
    </svg>
  )
}

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
  const GameIcon = getGameIcon(game.slug)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
        aria-hidden
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surfaceElevated border-t border-border rounded-t-3xl px-5 pt-5 pb-8 max-w-lg mx-auto shadow-card">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

        {/* Game header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full border-[1.5px] border-border flex items-center justify-center text-textPrimary flex-shrink-0">
            <GameIcon width="20" height="20" />
          </div>
          <div>
            <p className="text-textPrimary text-lg font-bold">{gameTitle}</p>
            <p className="text-textMuted text-sm">
              {game.minPlayers}–{game.maxPlayers} {t('players')}
            </p>
          </div>
        </div>

        {/* Room type selection */}
        <p className="text-textMuted text-sm font-medium mb-3 uppercase tracking-wider">
          Choose mode
        </p>

        <div className="space-y-3">
          <Card
            onClick={loading ? undefined : () => handleSelect('casual')}
            className={`w-full flex items-center gap-4 p-4 text-left ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <DiceIcon width="24" height="24" className="text-textMuted flex-shrink-0" />
            <div>
              <p className="text-textPrimary font-bold">{t('casualRoom')}</p>
              <p className="text-textMuted text-sm">{t('casualDesc')}</p>
            </div>
          </Card>

          <Card
            onClick={loading ? undefined : () => handleSelect('ranked')}
            className={`w-full flex items-center gap-4 p-4 text-left border-gold/40 hover:border-gold/60 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <TrophyIcon className="text-gold flex-shrink-0" />
            <div>
              <p className="text-gold font-bold">{t('rankedRoom')}</p>
              <p className="text-textMuted text-sm">{t('rankedDesc')}</p>
            </div>
          </Card>
        </div>

        {loading && (
          <p className="text-textMuted text-sm text-center mt-4 animate-pulse">Creating room...</p>
        )}
        {error && (
          <p className="text-error text-sm text-center mt-4">{error}</p>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full text-textMuted hover:text-textSecondary text-sm font-medium py-2 transition-colors"
        >
          {t('back')}
        </button>
      </div>
    </>
  )
}
