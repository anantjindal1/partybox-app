import { useParams, useNavigate } from 'react-router-dom'
import { LangToggle } from '../components/LangToggle'
import { RoomCode } from '../components/RoomCode'
import { Button } from '../components/Button'
import { ConnectionOverlay } from '../components/ConnectionOverlay'
import { useLang } from '../store/LangContext'
import { useRoom } from '../hooks/useRoom'
import { useProfile } from '../hooks/useProfile'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useOnlineRoom } from '../hooks/useOnlineRoom'
import { getGame } from '../games/registry'

export default function Room() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const room = useRoom(code)
  const { profile } = useProfile()
  const connected = useOnlineStatus()

  // useOnlineRoom for host controls (kick, end game)
  const { isHost, kickPlayer, endGame, expired } = useOnlineRoom(code)

  if (expired) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-zinc-400 text-lg">{t('roomExpired')}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-zinc-500 hover:text-zinc-300 underline"
          >
            {t('returnHome')}
          </button>
        </div>
      </div>
    )
  }

  if (!room || !profile) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-500 text-xl animate-pulse">Connecting...</p>
      </div>
    )
  }

  const game = getGame(room.gameSlug)
  const GameComponent = game?.Component

  async function handleEndGame() {
    await endGame()
    navigate('/')
  }

  async function handleKick(playerId) {
    await kickPlayer(playerId)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <ConnectionOverlay connected={connected} />

      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-800/80">
        <button
          onClick={() => navigate('/')}
          className="text-zinc-500 hover:text-zinc-300 text-lg flex items-center gap-2 font-medium"
        >
          ← {t('back')}
        </button>
        <div className="flex items-center gap-3">
          {isHost && room.status !== 'waiting' && (
            <button
              onClick={handleEndGame}
              className="text-rose-400 hover:text-rose-300 text-sm font-semibold border border-rose-800/60 rounded-xl px-3 py-1.5"
            >
              {t('endGame')}
            </button>
          )}
          <LangToggle />
        </div>
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold ${
                p.id === room.hostId
                  ? 'bg-amber-500/90 text-zinc-900'
                  : 'bg-zinc-800 text-zinc-200 border border-zinc-700/50'
              }`}
            >
              {p.id === room.hostId ? '👑 ' : ''}{p.name}
              {isHost && room.status === 'waiting' && p.id !== room.hostId && (
                <button
                  onClick={() => handleKick(p.id)}
                  className="ml-1 text-xs text-zinc-500 hover:text-rose-400 font-normal"
                  aria-label={`${t('removePlayer')} ${p.name}`}
                >
                  ✕
                </button>
              )}
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
          <GameComponent code={code} />
        ) : (
          <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-6 text-center">
            <p className="text-zinc-400">Game not found: {room.gameSlug}</p>
          </div>
        )}
      </div>
    </div>
  )
}
