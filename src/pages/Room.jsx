import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LangToggle } from '../components/LangToggle'
import { RoomCode } from '../components/RoomCode'
import { Card } from '../components/Card'
import { ConnectionOverlay } from '../components/ConnectionOverlay'
import { ReactionBar } from '../components/ReactionBar'
import PlayerIdentityModal from '../components/PlayerIdentityModal'
import { useLang } from '../store/LangContext'
import { useRoom } from '../hooks/useRoom'
import { useProfile } from '../hooks/useProfile'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useOnlineRoom } from '../hooks/useOnlineRoom'
import { joinRoom } from '../services/room'
import { getGame } from '../games/registry'

export default function Room() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const room = useRoom(code)
  const { profile } = useProfile()
  const connected = useOnlineStatus()
  const [countdown, setCountdown] = useState(null)
  const [identity, setIdentity] = useState(() => {
    const name = localStorage.getItem('firstbell_player_name')
    const avatar = localStorage.getItem('firstbell_player_avatar')
    return name && avatar ? { name, avatar } : null
  })
  const [copied, setCopied] = useState(false)
  const joinedRef = useRef(false)

  // useOnlineRoom for host controls (kick, end game) and roomState
  const { isHost, kickPlayer, endGame, expired, roomState, myId } = useOnlineRoom(code)

  // Auto-close room after results phase starts (duration configurable per-game via resultsDurationMs)
  // Games with noAutoClose: true handle their own navigation (e.g. FirstBell has Rematch/Home buttons)
  useEffect(() => {
    if (roomState?.phase !== 'results') return
    const game = getGame(room?.gameSlug)
    if (game?.noAutoClose) return
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

  // Auto-join: if player arrived via share link they won't be in room.players yet
  useEffect(() => {
    if (!room || !myId || !identity || joinedRef.current) return
    const alreadyIn = room.players.some(p => p.id === myId)
    if (alreadyIn) {
      joinedRef.current = true
      return
    }
    joinedRef.current = true
    joinRoom(code, myId, identity.name, identity.avatar).catch(() => {
      joinedRef.current = false
    })
  }, [room, myId, identity, code])

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

  // Game is active once phase moves past setup (waiting/setup = lobby, anything else = in-game)
  const LOBBY_PHASES = new Set([undefined, null, 'waiting', 'setup'])
  const gameInProgress = !LOBBY_PHASES.has(roomState?.phase)

  async function handleEndGame() {
    await endGame()
    navigate('/')
  }

  async function handleKick(playerId) {
    await kickPlayer(playerId)
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsApp() {
    const msg = encodeURIComponent(
      `Join my FirstBell quiz!\nTap to join: ${window.location.href}\nRoom code: ${code}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-surface text-zinc-100 flex flex-col">
      <ConnectionOverlay connected={connected} />
      {identity === null && <PlayerIdentityModal onComplete={setIdentity} />}

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
          {isHost && gameInProgress && (
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

      {!gameInProgress && (
        <div className="px-4 sm:px-6 pt-6 pb-4 space-y-4">
          {/* Room code */}
          <div className="text-center">
            <p className="text-zinc-500 text-xs mb-2">or share code manually</p>
            <RoomCode code={code} />
          </div>

          {/* Player avatars */}
          <div>
            <div className="flex flex-wrap gap-4 mt-2">
              {room.players.map(p => (
                <div key={p.id} className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <span className="text-4xl" style={{ minWidth: 48, display: 'inline-block', textAlign: 'center' }}>
                      {p.avatar ?? '🎮'}
                    </span>
                    {p.id === room.hostId && (
                      <span className="absolute -top-1 -right-1 text-xs">👑</span>
                    )}
                  </div>
                  <span className="text-zinc-300 text-xs font-medium max-w-[56px] truncate">{p.name}</span>
                  {isHost && !gameInProgress && p.id !== room.hostId && (
                    <button
                      onClick={() => handleKick(p.id)}
                      className="text-xs text-zinc-600 hover:text-rose-400"
                      aria-label={`${t('removePlayer')} ${p.name}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-zinc-500 text-sm mt-3">
              Waiting for players... ({room.players.length}/{game?.maxPlayers ?? 6})
            </p>
          </div>

          {/* Share buttons — below player list */}
          <div className="flex gap-3">
            <button
              onClick={handleWhatsApp}
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm"
            >
              Share on WhatsApp
            </button>
            <button
              onClick={handleCopyLink}
              className="flex-1 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-zinc-100 font-semibold text-sm"
            >
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>

          {/* Host start button */}
          {isHost && (
            <button
              disabled={room.players.length < 2}
              onClick={() => document.querySelector('.game-area')?.scrollIntoView({ behavior: 'smooth' })}
              className={`w-full py-3 rounded-xl font-bold text-base transition-all ${
                room.players.length >= 2
                  ? 'bg-amber-500 text-zinc-900 hover:bg-amber-400'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {room.players.length < 2 ? 'Need 1 more player' : 'Start Game →'}
            </button>
          )}
        </div>
      )}

      {gameInProgress && (
        <div className="px-4 sm:px-6 pt-4 pb-4">
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
              </span>
            ))}
          </div>
        </div>
      )}

      <ReactionBar roomCode={code} />

      {/* Game area */}
      <div className="game-area flex-1 px-4 sm:px-6 pb-8">
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
