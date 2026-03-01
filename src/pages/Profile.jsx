import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { LangToggle } from '../components/LangToggle'
import { useLang } from '../store/LangContext'
import { useProfile } from '../hooks/useProfile'

const AVATARS = ['🎲', '🎮', '🃏', '🎯', '🎪', '🎭', '🦁', '🐯', '🦊', '🐻', '🐸', '🦄']

export default function Profile() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { profile, update } = useProfile()
  const [name, setName] = useState('')
  const [saved, setSaved] = useState(false)

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
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

  const xpToNextLevel = 500
  const xpPct = Math.min(100, (profile.xp / xpToNextLevel) * 100)

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

      <div className="flex-1 px-4 sm:px-6 py-8 space-y-8 max-w-xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-white">{t('profile')}</h1>

        {/* Avatar */}
        <div>
          <p className="text-zinc-500 text-sm mb-3">{t('avatar')}</p>
          <div className="text-6xl text-center mb-4">{profile.avatar}</div>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map(a => (
              <button
                key={a}
                onClick={() => handleAvatarSelect(a)}
                className={`text-3xl p-2 rounded-xl transition-colors border ${
                  profile.avatar === a
                    ? 'bg-amber-500/90 text-zinc-900 border-amber-500'
                    : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-zinc-500 text-sm block mb-2">{t('name')}</label>
          <input
            type="text"
            value={name || profile.name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
            className="w-full bg-zinc-800 border border-zinc-700 text-white text-xl rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
          />
        </div>

        <Button onClick={handleSave}>
          {saved ? `✅ ${t('savedSuccess')}` : t('save')}
        </Button>

        {/* XP */}
        <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-5">
          <div className="flex justify-between mb-2">
            <span className="text-zinc-400 font-semibold">{t('xp')}</span>
            <span className="text-amber-400 font-bold">{profile.xp}</span>
          </div>
          <div className="bg-zinc-700 rounded-full h-4 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <p className="text-zinc-500 text-xs mt-1 text-right">{profile.xp} / {xpToNextLevel}</p>
        </div>

        {/* Badges */}
        <div>
          <p className="text-zinc-500 text-sm mb-3">{t('badges')}</p>
          {profile.badges.length === 0 ? (
            <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl p-6 text-center">
              <p className="text-zinc-500">{t('noBadgesYet')}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((b, i) => (
                <span key={i} className="bg-zinc-800 px-3 py-2 rounded-xl text-lg border border-zinc-700/50">{b}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
