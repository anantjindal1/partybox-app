import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LangToggle } from '../components/LangToggle'
import { RoomCode } from '../components/RoomCode'
import { Card } from '../components/Card'
import { ConnectionOverlay } from '../components/ConnectionOverlay'
import { ReactionBar } from '../components/ReactionBar'
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
  const [countdown, setCountdown] = useState(null)

  // useOnlineRoom for host controls (kick, end game) and roomState
  const { isHost, kickPlayer, endGame, expired, roomState } = useOnlineRoom(code)

  // Auto-close room after results phase starts (duration configurable per-game via resultsDurationMs)
  useEffect(() => {
    if (roomState?.phase !== 'results') return
    const game = getGame(room?.gameSlug)
    const duration = game?.resultsDurationMs ?? 10_000
    const seconds = Math.round(duration / 1000)
    setCountdown(seconds)
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    const close = setTimeout(async () => {
      await endGame()
      navigate('/')
    }, duration)
    return () => {
      clearInterval(interval)
      clearTimeout(close)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.phase])

  if (expired) {
    return (
      <div className="min-h-screen bg-surface text-zinc-100 flex items-center justify-center px-4">
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
      <div className="min-h-screen bg-surface text-zinc-100 flex items-center justify-center">
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
    <div className="min-h-screen bg-surface text-zinc-100 flex flex-col">
      <ConnectionOverlay connected={connected} />

      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/60 shadow-soft">
        <button
          onClick={() => navigate('/')}
          className="text-zinc-500 hover:text-zinc-300 text-lg flex items-center gap-2 font-medium"
        >
          ← {t('back')}
        </button>
        <div className="flex items-center gap-3">
          {room.roomType === 'ranked' ? (
            <span className="text-xs font-semibold text-accent border border-accent/40 rounded-lg px-2 py-1">
              🏆 {t('rankedRoom')}
            </span>
          ) : (
            <span className="text-xs font-semibold text-zinc-400 border border-border rounded-lg px-2 py-1">
              🎲 {t('casualRoom')}
            </span>
          )}
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

      {/* Results countdown banner */}
      {countdown !== null && (
        <div className="mx-4 sm:mx-6 mt-3 py-2 px-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium text-center">
          {t('roomClosesIn')} {countdown}s
        </div>
      )}

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
                  ? 'bg-accent text-zinc-900'
                  : 'bg-surfaceElevated text-zinc-200 border border-border/60'
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

      <ReactionBar roomCode={code} />

      {/* Waiting state */}
      {room.status === 'waiting' && room.players.length < (game?.minPlayers ?? 2) && (
        <div className="px-4 sm:px-6 pb-4">
          <Card className="p-6 text-center">
            <p className="text-zinc-400">{t('waiting')}</p>
            <p className="text-zinc-500 text-sm mt-1">
              Need {(game?.minPlayers ?? 2) - room.players.length} more player(s)
            </p>
          </Card>
        </div>
      )}

      {/* Game area */}
      <div className="flex-1 px-4 sm:px-6 pb-8">
        {game && GameComponent ? (
          <GameComponent code={code} />
        ) : (
          <Card className="p-6 text-center">
            <p className="text-zinc-400">Game not found: {room.gameSlug}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
