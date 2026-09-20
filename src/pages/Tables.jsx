import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/Card'
import { LangToggle } from '../components/LangToggle'
import { getGameIcon } from '../components/gameIcons'
import { useLang } from '../store/LangContext'
import { getGame } from '../games/registry'
import { subscribeToOpenTables, describeOpenTable } from '../services/openTables'

function formatAge(createdAtMs, now) {
  const minutes = Math.max(0, Math.floor((now - createdAtMs) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`
}

function formatClock(createdAtMs) {
  return new Date(createdAtMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function Tables() {
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const [tables, setTables] = useState(null)
  const [failed, setFailed] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const unsubscribe = subscribeToOpenTables(
      rooms => {
        setFailed(false)
        setTables(rooms.map(room => describeOpenTable(room, getGame(room.gameSlug))).filter(Boolean))
      },
      () => setFailed(true)
    )
    const tick = setInterval(() => setNow(Date.now()), 30000)
    return () => {
      unsubscribe()
      clearInterval(tick)
    }
  }, [])

  return (
    <div className="min-h-screen bg-surface text-textPrimary flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/60 shadow-soft">
        <button
          onClick={() => navigate('/')}
          className="text-textMuted hover:text-textSecondary text-lg flex items-center gap-2 font-medium"
        >
          ← {t('back')}
        </button>
        <LangToggle />
      </header>

      <div className="flex-1 px-4 sm:px-6 py-8 max-w-xl mx-auto w-full flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textPrimary">Open Tables</h1>
          <p className="text-textMuted text-sm mt-1">Tables with a seat free right now. Tap one to sit down.</p>
        </div>

        {failed && <p className="text-error text-sm">Couldn't load tables. Check your connection.</p>}
        {!failed && tables === null && <p className="text-textMuted animate-pulse">Looking for tables…</p>}
        {tables?.length === 0 && (
          <p className="text-textMuted py-8 text-center">
            No open tables right now. Start one from Home and it will show up here.
          </p>
        )}

        {tables?.map(table => {
          const game = getGame(table.slug)
          const Icon = getGameIcon(table.slug)
          const title = game.title[lang] ?? game.title.en
          return (
            <Card
              key={table.code}
              onClick={() => navigate(`/room/${table.code}`)}
              className="w-full flex items-center gap-4 p-4 text-left"
            >
              <div className="w-11 h-11 rounded-full border-[1.5px] border-border flex items-center justify-center text-textPrimary flex-shrink-0">
                <Icon width="20" height="20" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-textPrimary font-bold truncate">{title}</p>
                <p className="text-textMuted text-sm truncate">{table.hostAvatar} {table.hostName}</p>
                {table.createdAtMs && (
                  <p className="text-textMuted text-xs">
                    Created {formatClock(table.createdAtMs)} · {formatAge(table.createdAtMs, now)}
                  </p>
                )}
                {!table.inLobby && <p className="text-textMuted text-xs">In progress — join as a replacement</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-textPrimary font-bold tabular-nums">{table.playerCount}/{table.playerCount + table.openSeats}</p>
                <p className="text-textMuted text-xs">{table.openSeats === 1 ? '1 seat' : `${table.openSeats} seats`}</p>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
