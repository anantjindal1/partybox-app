import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/Card'
import { LangToggle } from '../components/LangToggle'
import { getGameIcon } from '../components/gameIcons'
import { useLang } from '../store/LangContext'
import { getGame } from '../games/registry'
import { subscribeToOpenTables, describeTable } from '../services/openTables'
import { getDeviceId } from '../services/profile'

function formatAge(createdAtMs, now) {
  const minutes = Math.max(0, Math.floor((now - createdAtMs) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`
}

function formatClock(createdAtMs) {
  return new Date(createdAtMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

const FILTER_KEY = 'partybox_tables_filter'

function readFilter() {
  try { return localStorage.getItem(FILTER_KEY) === 'all' ? 'all' : 'open' } catch { return 'open' }
}

export default function Tables() {
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const [tables, setTables] = useState(null)
  const [failed, setFailed] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [filter, setFilter] = useState(readFilter)
  const myId = getDeviceId()

  function chooseFilter(value) {
    setFilter(value)
    try { localStorage.setItem(FILTER_KEY, value) } catch { /* storage unavailable */ }
  }

  useEffect(() => {
    const unsubscribe = subscribeToOpenTables(
      rooms => {
        setFailed(false)
        setTables(rooms.map(room => describeTable(room, getGame(room.gameSlug))).filter(Boolean))
      },
      () => setFailed(true)
    )
    const tick = setInterval(() => setNow(Date.now()), 30000)
    return () => {
      unsubscribe()
      clearInterval(tick)
    }
  }, [])

  const visible = tables ?? []
  const mine = visible.filter(row => row.playerIds.includes(myId))
  const others = visible.filter(row =>
    !row.playerIds.includes(myId) && row.isPublic && (filter === 'all' || row.openSeats > 0)
  )

  function renderRow(table) {
    const game = getGame(table.slug)
    const Icon = getGameIcon(table.slug)
    const title = game.title[lang] ?? game.title.en
    const isMine = table.playerIds.includes(myId)
    const status = isMine
      ? 'Tap to rejoin'
      : table.inLobby
        ? null
        : table.openSeats > 0 ? 'In progress — join as a replacement' : 'In progress — watch'
    return (
      <Card
        key={table.code}
        onClick={() => navigate(`/room/${table.code}`)}
        className={`w-full flex items-center gap-4 p-4 text-left ${isMine ? 'border-gold/60' : ''}`}
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
          {status && <p className="text-textMuted text-xs">{status}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-textPrimary font-bold tabular-nums">{table.playerCount}/{table.playerCount + table.openSeats}</p>
          <p className="text-textMuted text-xs">
            {isMine ? 'Rejoin' : table.openSeats === 0 ? 'Watch' : table.openSeats === 1 ? '1 seat' : `${table.openSeats} seats`}
          </p>
        </div>
      </Card>
    )
  }

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
          <p className="text-textMuted text-sm mt-1">Sit at a table with a free seat, or watch a game that's already running.</p>
          <p className="text-textMuted text-xs mt-1">Friendly play — games aren't cheat-proof, so play for fun, not stakes.</p>
        </div>

        <div role="tablist" aria-label="Which tables to show" className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surfaceMuted border border-border/60">
          {[['open', 'Open seats'], ['all', 'All tables']].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              onClick={() => chooseFilter(value)}
              className={`min-h-[40px] rounded-lg text-sm font-semibold transition-colors ${
                filter === value ? 'bg-surfaceElevated text-textPrimary shadow-soft' : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {failed && <p className="text-error text-sm">Couldn't load tables. Check your connection.</p>}
        {!failed && tables === null && <p className="text-textMuted animate-pulse">Looking for tables…</p>}

        {mine.length > 0 && (
          <>
            <p className="text-gold text-sm font-semibold uppercase tracking-wider mt-2">Your tables</p>
            {mine.map(renderRow)}
          </>
        )}

        {mine.length > 0 && others.length > 0 && (
          <p className="text-textMuted text-sm font-semibold uppercase tracking-wider mt-2">
            {filter === 'all' ? 'All tables' : 'Open seats'}
          </p>
        )}
        {tables && others.length === 0 && (
          <p className="text-textMuted py-8 text-center">
            {filter === 'all'
              ? 'No tables running right now. Start one from Home and it will show up here.'
              : 'No open seats right now. Switch to All tables to watch a game, or start one from Home.'}
          </p>
        )}
        {others.map(renderRow)}
      </div>
    </div>
  )
}
