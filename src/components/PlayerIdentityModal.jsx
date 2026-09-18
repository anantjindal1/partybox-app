import { useState, useEffect, useRef } from 'react'
import { AVATARS } from '../data/avatars'

// getProfile() (src/services/profile.js) already stores this literal
// string as the untouched default for a brand-new device — treated here
// as "no real name yet" rather than something to actually pre-fill,
// since showing the same bare "Player" to everyone who hasn't set a name
// makes same-room devices hard to tell apart.
const UNSET_DEFAULT_NAME = 'Player'

function randomDefaultName() {
  return `Player${Math.floor(100 + Math.random() * 900)}`
}

// Presentation-only — the caller decides whether this should be shown
// at all (once per device, until `onComplete` fires) and owns actually
// persisting the result (the profile store, see src/services/profile.js).
// `profile`, if already available, seeds sensible defaults so a player
// can just tap through instead of being forced to type/pick first.
export default function PlayerIdentityModal({ onComplete, profile }) {
  const [name, setName] = useState(() => {
    if (profile?.name && profile.name !== UNSET_DEFAULT_NAME) return profile.name
    return randomDefaultName()
  })
  const [avatar, setAvatar] = useState(() => profile?.avatar || AVATARS[0])
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onComplete({ name: trimmed, avatar })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4">
      <div className="bg-surfaceElevated rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-xl font-bold text-textPrimary mb-1">Who are you?</h2>
        <p className="text-textMuted text-sm mb-5">Pick an avatar and enter your name</p>

        <div className="grid grid-cols-4 gap-2 mb-5">
          {AVATARS.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setAvatar(a)}
              className={`text-3xl p-2 rounded-xl transition-all ${
                avatar === a
                  ? 'ring-2 ring-gold scale-110 bg-surfaceMuted'
                  : 'bg-surfaceElevated hover:bg-surfaceMuted'
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={12}
            placeholder="Your name"
            className="w-full bg-surfaceElevated text-textPrimary placeholder-textMuted rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gold mb-4"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className={`w-full py-3 rounded-xl font-bold text-base transition-all ${
              name.trim()
                ? 'bg-gold text-onGold hover:opacity-90'
                : 'bg-surfaceMuted text-textMuted cursor-not-allowed'
            }`}
          >
            Let's Play!
          </button>
        </form>
      </div>
    </div>
  )
}
