import { useParams, useNavigate } from 'react-router-dom'
import { LangToggle } from '../components/LangToggle'
import { RoomCode } from '../components/RoomCode'
import { Button } from '../components/Button'
import { useLang } from '../store/LangContext'
import { useRoom } from '../hooks/useRoom'
import { useProfile } from '../hooks/useProfile'
import { getGame } from '../games/registry'

export default function Room() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const room = useRoom(code)
  const { profile } = useProfile()

  if (!room || !profile) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-500 text-xl animate-pulse">Connecting...</p>
      </div>
    )
  }

  const game = getGame(room.gameSlug)
  const GameComponent = game?.Component

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-800/80">
        <button
          onClick={() => navigate('/')}
          className="text-zinc-500 hover:text-zinc-300 text-lg flex items-center gap-2 font-medium"
        >
          ← {t('back')}
        </button>
        <LangToggle />
      </header>

      <div className="px-4 sm:px-6 pt-6 pb-4">
        <RoomCode code={code} />
      </div>

      {/* Players */}
      <div className="px-4 sm:px-6 pb-4">
        <p className="text-zinc-500 text-sm mb-2">{t('players')} ({room.players.length})</p>
        <div className="flex flex-wrap gap-2">
          {room.players.map(p => (
            <span
              key={p.id}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${
                p.id === room.hostId
                  ? 'bg-amber-500/90 text-zinc-900'
                  : 'bg-zinc-800 text-zinc-200 border border-zinc-700/50'
              }`}
            >
              {p.id === room.hostId ? '👑 ' : ''}{p.name}
            </span>
          ))}
        </div>
      </div>

      {/* Waiting state */}
      {room.status === 'waiting' && room.players.length < (game?.minPlayers ?? 2) && (
        <div className="px-4 sm:px-6 pb-4">
          <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-6 text-center">
            <p className="text-zinc-400">{t('waiting')}</p>
            <p className="text-zinc-500 text-sm mt-1">
              Need {(game?.minPlayers ?? 2) - room.players.length} more player(s)
            </p>
          </div>
        </div>
      )}

      {/* Game area */}
      <div className="flex-1 px-4 sm:px-6 pb-8">
        {game && GameComponent ? (
          <GameComponent room={room} playerId={profile.id} />
        ) : (
          <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-6 text-center">
            <p className="text-zinc-400">Game not found: {room.gameSlug}</p>
          </div>
        )}
      </div>
    </div>
  )
}
