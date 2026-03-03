import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { LangToggle } from '../components/LangToggle'
import { useLang } from '../store/LangContext'
import { useProfile } from '../hooks/useProfile'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'
import { games } from '../games/registry'

const AVATARS = ['🎲', '🎮', '🃏', '🎯', '🎪', '🎭', '🦁', '🐯', '🦊', '🐻', '🐸', '🦄']

// Online game slugs that track stats in Firestore
const ONLINE_GAME_SLUGS = games
  .filter(g => !g.singleDevice)
  .map(g => g.slug)

export default function Profile() {
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const { profile, update } = useProfile()
  const online = useOnlineStatus()
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)
  const [gameStats, setGameStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Fetch per-game Firestore stats when online
  useEffect(() => {
    if (!online || !profile || !db) return
    setStatsLoading(true)
    getDocs(collection(db, 'profiles', profile.id, 'stats'))
      .then(snap => {
        const data = {}
        snap.forEach(doc => { data[doc.id] = doc.data() })
        setGameStats(data)
      })
      .catch(() => setGameStats(null))
      .finally(() => setStatsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, profile?.id])

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-500 text-xl animate-pulse">Loading...</p>
      </div>
    )
  }

  async function handleSave() {
    await update({ name: name || profile.name })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleAvatarSelect(avatar) {
    await update({ avatar })
  }

  // Level: floor(xp / 100) + 1
  const level = Math.floor(profile.xp / 100) + 1
  const xpInLevel = profile.xp % 100
  const xpPct = xpInLevel  // already 0–99 → treat as percent

  return (
    <div className="min-h-screen bg-surface text-zinc-100 flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/60 shadow-soft">
        <button
          onClick={() => navigate('/')}
          className="text-zinc-500 hover:text-zinc-300 text-lg flex items-center gap-2 font-medium"
        >
          ← {t('back')}
        </button>
        <LangToggle />
      </header>

      <div className="flex-1 px-4 sm:px-6 py-8 space-y-8 max-w-xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-white">{t('profile')}</h1>

        {/* Avatar */}
        <Card className="p-5">
          <p className="text-zinc-500 text-sm mb-3">{t('avatar')}</p>
          <div className="text-6xl text-center mb-4">{profile.avatar}</div>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map(a => (
              <button
                key={a}
                onClick={() => handleAvatarSelect(a)}
                className={`text-3xl p-2 rounded-xl transition-colors border ${
                  profile.avatar === a
                    ? 'bg-accent text-zinc-900 border-accent'
                    : 'bg-surfaceMuted border-border hover:bg-border'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </Card>

        {/* Name */}
        <div>
          <label className="text-zinc-500 text-sm block mb-2">{t('name')}</label>
          <Input
            type="text"
            value={name || profile.name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
            className="w-full text-xl rounded-2xl px-5 py-4"
          />
        </div>

        <Button onClick={handleSave}>
          {saved ? `✅ ${t('savedSuccess')}` : t('save')}
        </Button>

        {/* XP + Level */}
        <Card className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-zinc-400 font-semibold block">{t('xp')}</span>
              <span className="text-2xl font-black text-accent">{profile.xp}</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-500 text-xs block">{t('level')}</span>
              <span className="text-3xl font-black text-white">{level}</span>
            </div>
          </div>
          <div className="bg-surfaceMuted rounded-full h-3 overflow-hidden">
            <div
              className="bg-accent h-full rounded-full transition-all"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <p className="text-zinc-500 text-xs mt-1 text-right">{xpInLevel} / 100 XP to next level</p>
        </Card>

        {/* Badges */}
        <div>
          <p className="text-zinc-500 text-sm mb-3">{t('badges')}</p>
          {profile.badges.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-zinc-500">{t('noBadgesYet')}</p>
            </Card>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((b, i) => (
                <span key={i} className="bg-surfaceElevated px-3 py-2 rounded-xl text-lg border border-border/60">{b}</span>
              ))}
            </div>
          )}
        </div>

        {/* Game stats (online only) */}
        {online && ONLINE_GAME_SLUGS.length > 0 && (
          <div>
            <p className="text-zinc-500 text-sm mb-3 uppercase tracking-wider">Game Stats</p>
            {statsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {ONLINE_GAME_SLUGS.map(slug => (
                  <Card key={slug} className="p-4 animate-pulse h-24" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {ONLINE_GAME_SLUGS.map(slug => {
                  const g = games.find(g => g.slug === slug)
                  const stats = gameStats?.[slug] ?? null
                  const title = typeof g?.title === 'object'
                    ? (g.title[lang] ?? g.title.en)
                    : (g?.title ?? slug)
                  return (
                    <Card key={slug} className="p-4">
                      <p className="text-zinc-400 text-xs font-semibold mb-2 truncate">
                        {g?.icon} {title}
                      </p>
                      {stats ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">{t('wins')}</span>
                            <span className="text-accent font-bold">{stats.wins ?? 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">{t('gamesPlayed')}</span>
                            <span className="text-zinc-300 font-bold">{stats.gamesPlayed ?? 0}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-zinc-600 text-xs">No games yet</p>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
