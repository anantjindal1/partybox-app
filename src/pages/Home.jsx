import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LangToggle } from '../components/LangToggle'
import { CreateRoomSheet } from '../components/CreateRoomSheet'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { useLang } from '../store/LangContext'
import { useProfile } from '../hooks/useProfile'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { games } from '../games/registry'
import { joinRoom } from '../services/room'
import { getInProgressGames } from '../services/gameStatePersistence'

const COMING_SOON_SLOTS = 0

export default function Home() {
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const { profile } = useProfile()
  const online = useOnlineStatus()
  const [joinOpen, setJoinOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedGame, setSelectedGame] = useState(null)

  // Playable offline games from registry; online (room-based) games shown separately
  // Games with onlineEnabled: true appear in BOTH grids (e.g. Dumb Charades)
  const playableGames = games.filter(g => g.singleDevice)
  const onlineGames = games.filter(g => g.onlineEnabled || !g.singleDevice)
  const inProgressGames = getInProgressGames()

  function handlePlayGame(game) {
    if (!game) return
    if (game.singleDevice) {
      navigate(`/play/${game.slug}`)
      return
    }
    if (!profile) return
    navigate(`/play/${game.slug}`)
  }

  async function handleJoinRoom() {
    if (!joinCode.trim() || !profile) return
    setLoading(true)
    setError('')
    try {
      await joinRoom(joinCode.toUpperCase(), profile.id, profile.name)
      navigate(`/room/${joinCode.toUpperCase()}`)
    } catch (e) {
      setError(t('roomNotFound') || 'Room not found. Check the code and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col relative overflow-x-hidden">
      {/* Background: mobile (portrait) vs desktop (grid) image + dark overlay */}
      <div className="absolute inset-0 z-0" aria-hidden>
        {/* Mobile: portrait PartyBox scene */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat sm:hidden"
          style={{ backgroundImage: 'url(/partybox-home-bg-mobile.png)' }}
        />
        {/* Desktop: 2x2 grid PartyBox scene */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden sm:block"
          style={{ backgroundImage: 'url(/partybox-home-bg.png)' }}
        />
        {/* Dark overlay so cards and text stay legible */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.75) 100%)'
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {selectedGame && (
          <CreateRoomSheet
            game={selectedGame}
            onClose={() => setSelectedGame(null)}
          />
        )}
        {/* Top bar: logo, profile, language */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/60 shadow-soft bg-surface/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>🎉</span>
          <h1 className="text-xl font-bold text-white tracking-tight">PartyBox</h1>
        </div>
        <div className="flex items-center gap-2">
          {profile && (
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surfaceElevated text-zinc-300 hover:bg-surfaceMuted hover:text-white transition-colors text-sm font-medium border border-border/60"
              aria-label={t('profile')}
            >
              <span className="text-lg">{profile.avatar}</span>
              <span className="hidden sm:inline max-w-[100px] truncate">{profile.name}</span>
              <span className="text-accent font-semibold">{profile.xp}</span>
              <span className="text-zinc-500 text-xs">{t('xp')}</span>
            </button>
          )}
          <LangToggle />
        </div>
      </header>

      {!online && (
        <div className="mx-4 sm:mx-6 mt-3 py-2 px-4 rounded-xl bg-accentSoft border border-accent/30 text-accent text-sm font-medium text-center">
          📴 Offline mode — all games work offline
        </div>
      )}

      {/* Main: grid of games */}
      <main className="flex-1 px-4 sm:px-6 py-8">
        <p className="text-zinc-500 text-sm font-medium mb-6 uppercase tracking-wider">
          {t('pickGame')}
        </p>

        {/* Resume in-progress games */}
        {inProgressGames.length > 0 && (
          <div className="mb-8">
            <p className="text-accent text-sm font-semibold mb-3 uppercase tracking-wider">
              {t('gamesInProgress')}
            </p>
            <div className="flex flex-wrap gap-3">
              {inProgressGames.map((g) => {
                const title = typeof g.gameTitle === 'object'
                  ? (g.gameTitle[lang] || g.gameTitle.en || g.slug)
                  : (g.gameTitle || g.slug)
                return (
                  <Card
                    key={g.slug}
                    onClick={() => navigate(`/play/${g.slug}`)}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-accent !bg-surfaceElevated/70 backdrop-blur-sm"
                  >
                    <span>▶</span>
                    <span>{title}</span>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl">
          {/* Playable single-device games */}
          {playableGames.map(game => (
            <Card
              key={game.slug}
              onClick={() => handlePlayGame(game)}
              className="group flex flex-col items-center justify-center p-6 text-left min-h-[160px] !bg-surfaceElevated/70 backdrop-blur-sm"
            >
              <span className="text-4xl sm:text-5xl mb-3 block" aria-hidden>
                {game.icon}
              </span>
              <span className="text-lg font-bold text-white group-hover:text-accent transition-colors">
                {game.title[lang]}
              </span>
              <span className="text-xs text-zinc-500 mt-1">
                {game.minPlayers}–{game.maxPlayers} {t('players')}
              </span>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                ▶ {t('play')}
              </span>
            </Card>
          ))}
          {/* Coming Soon placeholders */}
          {Array.from({ length: COMING_SOON_SLOTS }, (_, i) => (
            <div
              key={`coming-soon-${i}`}
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surfaceElevated/50 backdrop-blur-sm border border-border/40 min-h-[160px] cursor-default"
            >
              <span className="text-3xl sm:text-4xl mb-3 text-zinc-600">🎮</span>
              <span className="text-sm font-medium text-zinc-500">{t('comingSoon')}</span>
            </div>
          ))}
        </div>

        {/* Online multiplayer games */}
        {onlineGames.length > 0 && (
          <div className="mt-10">
            <p className="text-zinc-500 text-sm font-medium mb-4 uppercase tracking-wider">
              {t('onlineGames')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl">
              {onlineGames.map(game => (
                <Card
                  key={game.slug}
                  onClick={online && profile ? () => setSelectedGame(game) : undefined}
                  className={`group flex flex-col items-center justify-center p-6 text-left min-h-[160px] !bg-surfaceElevated/70 backdrop-blur-sm ${(!online || !profile) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-4xl sm:text-5xl mb-3 block" aria-hidden>
                    {game.icon}
                  </span>
                  <span className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    {game.title[lang]}
                  </span>
                  <span className="text-xs text-zinc-500 mt-1">
                    {game.minPlayers}–{game.maxPlayers} {t('players')}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400">
                    📡 {t('createRoom')}
                  </span>
                  {!online && (
                    <span className="mt-1 text-xs text-zinc-500">{t('needsInternet')}</span>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Join Room — small secondary action below grid */}
        <div className="mt-10 flex flex-col items-center">
          <button
            onClick={() => setJoinOpen(!joinOpen)}
            className="text-zinc-500 hover:text-zinc-300 text-sm font-medium flex items-center gap-2 transition-colors"
            aria-label={t('joinRoom')}
          >
            🚪 {t('joinRoom')}
          </button>

          {joinOpen && (
            <Card className="mt-4 w-full max-w-xs flex flex-col items-center gap-3 p-4 !bg-surfaceElevated/80 backdrop-blur-sm">
              <p className="text-zinc-400 text-sm">{t('enterCode')}</p>
              <Input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
                maxLength={4}
                className="w-32 text-2xl font-bold text-center tracking-widest"
              />
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setJoinOpen(false); setError(''); setJoinCode('') }}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-sm font-medium"
                >
                  {t('back')}
                </button>
                <Button
                  onClick={handleJoinRoom}
                  disabled={joinCode.length !== 4 || loading}
                  variant="primary"
                  className="!py-2 !text-sm !w-auto px-5"
                >
                  {loading ? '...' : t('joinRoom')}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
      </div>
    </div>
  )
}
