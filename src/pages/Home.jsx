import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LangToggle } from '../components/LangToggle'
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

  // Playable offline games from registry; then "Coming Soon" placeholders
  const playableGames = games.filter(g => g.singleDevice)
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top bar: logo, profile, language */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>🎉</span>
          <h1 className="text-xl font-bold text-white tracking-tight">PartyBox</h1>
        </div>
        <div className="flex items-center gap-2">
          {profile && (
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors text-sm font-medium"
              aria-label={t('profile')}
            >
              <span className="text-lg">{profile.avatar}</span>
              <span className="hidden sm:inline max-w-[100px] truncate">{profile.name}</span>
              <span className="text-amber-400/90 font-semibold">{profile.xp}</span>
              <span className="text-zinc-500 text-xs">{t('xp')}</span>
            </button>
          )}
          <LangToggle />
        </div>
      </header>

      {!online && (
        <div className="mx-4 sm:mx-6 mt-3 py-2 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium text-center">
          📴 Offline mode — play Dumb Charades anytime
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
            <p className="text-amber-400/90 text-sm font-semibold mb-3 uppercase tracking-wider">
              {t('gamesInProgress')}
            </p>
            <div className="flex flex-wrap gap-3">
              {inProgressGames.map((g) => {
                const title = typeof g.gameTitle === 'object'
                  ? (g.gameTitle[lang] || g.gameTitle.en || g.slug)
                  : (g.gameTitle || g.slug)
                return (
                  <button
                    key={g.slug}
                    onClick={() => navigate(`/play/${g.slug}`)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 hover:border-amber-500/50 transition-colors text-sm font-medium"
                  >
                    <span>▶</span>
                    <span>{title}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl">
          {/* Playable single-device games */}
          {playableGames.map(game => (
            <button
              key={game.slug}
              onClick={() => handlePlayGame(game)}
              className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-800/90 border border-zinc-700/50 hover:border-amber-500/40 hover:bg-zinc-800 transition-all duration-200 text-left min-h-[160px]"
            >
              <span className="text-4xl sm:text-5xl mb-3 block" aria-hidden>
                {game.icon}
              </span>
              <span className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                {game.title[lang]}
              </span>
              <span className="text-xs text-zinc-500 mt-1">
                {game.minPlayers}–{game.maxPlayers} {t('players')}
              </span>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-400">
                ▶ {t('play')}
              </span>
            </button>
          ))}
          {/* Coming Soon placeholders */}
          {Array.from({ length: COMING_SOON_SLOTS }, (_, i) => (
            <div
              key={`coming-soon-${i}`}
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-800/40 border border-zinc-700/30 min-h-[160px] cursor-default"
            >
              <span className="text-3xl sm:text-4xl mb-3 text-zinc-600">🎮</span>
              <span className="text-sm font-medium text-zinc-500">{t('comingSoon')}</span>
            </div>
          ))}
        </div>

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
            <div className="mt-4 w-full max-w-xs flex flex-col items-center gap-3 p-4 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
              <p className="text-zinc-400 text-sm">{t('enterCode')}</p>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
                maxLength={4}
                className="w-32 bg-zinc-900 text-white text-2xl font-bold text-center tracking-widest rounded-xl px-3 py-3 border border-zinc-600 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 outline-none"
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
                <button
                  onClick={handleJoinRoom}
                  disabled={joinCode.length !== 4 || loading}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '...' : t('joinRoom')}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
