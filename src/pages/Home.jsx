import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LangToggle } from '../components/LangToggle'
import { ThemeToggle } from '../components/ThemeToggle'
import { CreateRoomSheet } from '../components/CreateRoomSheet'
import { ModeChooserSheet } from '../components/ModeChooserSheet'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { useLang } from '../store/LangContext'
import { useProfile } from '../hooks/useProfile'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { games } from '../games/registry'
import { joinRoom } from '../services/room'
import { getInProgressGames } from '../services/gameStatePersistence'
import { findActiveRoom } from '../services/activeRoom'
import PlayerIdentityModal from '../components/PlayerIdentityModal'
import AdBanner from '../components/AdBanner'
import GetAppBanner from '../components/GetAppBanner'
import { setConsent } from '../lib/consent'
import { openFeedback } from '../lib/feedback'
import { BoltIcon, ClapperboardIcon, RotationIcon } from '../components/gameIcons'
import { ACCENT_STYLES, VISIBLE_GAMES, VISIBLE_SLUGS, CATEGORIES, categoryOf, playerRange, cardKey } from './home/gameCatalog'
import GameTile from './home/GameTile'

function LogoMark({ size = 26 }) {
  return (
    <svg viewBox="0 0 30 30" width={size} height={size}>
      <circle cx="15" cy="15" r="14" fill="none" stroke="var(--color-accent-gold)" strokeWidth="1.5" />
      <circle cx="15" cy="15" r="9" fill="var(--color-accent-maroon)" />
      <path d="M12 11l7 4-7 4v-8z" fill="var(--color-bg)" />
    </svg>
  )
}

const PLAYER_FILTERS = [
  { key: 'any', label: 'Any' },
  { key: '2', label: '2', n: 2 },
  { key: '3', label: '3', n: 3 },
  { key: '4', label: '4', n: 4 },
  { key: '6', label: '6+', n: 6 },
]

function fitsPlayers(card, key) {
  const f = PLAYER_FILTERS.find(p => p.key === key)
  if (!f?.n) return true
  const [min, max] = playerRange(card)
  return min <= f.n && max >= f.n
}

function FilterChip({ active, small, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border font-semibold transition-colors ${small ? 'px-3 py-1 text-xs min-h-[32px]' : 'px-4 py-1.5 text-sm min-h-[36px]'} ${
        active ? 'bg-maroon text-onMaroon border-maroon' : 'bg-surfaceElevated text-textSecondary border-border hover:bg-surfaceMuted'
      }`}
    >
      {children}
    </button>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const { profile, update: updateProfile } = useProfile()
  const online = useOnlineStatus()

  // Existing state
  const [joinOpen, setJoinOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedGame, setSelectedGame] = useState(null)
  const [selectedDualGame, setSelectedDualGame] = useState(null)

  // Carousel state
  const [showCarousel, setShowCarousel] = useState(
    () => !localStorage.getItem('partybox_onboarded')
  )
  const [carouselSlide, setCarouselSlide] = useState(0)
  const touchStartX = useRef(null)

  // Identity modal shown after carousel "Let's Go!"
  const [showIdentityModal, setShowIdentityModal] = useState(false)

  const [category, setCategory] = useState(() => localStorage.getItem('partybox_home_category') || 'all')
  const [players, setPlayers] = useState('any')

  useEffect(() => {
    localStorage.setItem('partybox_home_category', category)
  }, [category])

  const inProgressGames = getInProgressGames()

  const [activeRoom, setActiveRoom] = useState(null)
  useEffect(() => {
    let cancelled = false
    findActiveRoom().then(room => { if (!cancelled) setActiveRoom(room) })
    return () => { cancelled = true }
  }, [])
  const activeRoomGame = activeRoom && games.find(g => g.slug === activeRoom.gameSlug)

  // Hero: show only for new users with no in-progress games
  const showHero =
    !localStorage.getItem('partybox_returning_user') &&
    inProgressGames.length === 0

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleCardClick(card, disabled) {
    if (card.dualMode) {
      setSelectedDualGame(card)
      return
    }
    const game = games.find(g => g.slug === card.slug)
    if (disabled || !game) return
    if (card.isOnline) setSelectedGame(game)
    else handlePlayGame(game)
  }

  function handleReviewGameClick(game) {
    if (!game.singleDevice) {
      if (!profile) return
      setSelectedGame(game)
    } else {
      handlePlayGame(game)
    }
  }

  function handlePlayGame(game) {
    if (!game) return
    localStorage.setItem('partybox_returning_user', '1')
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

  // ── Carousel helpers ────────────────────────────────────────────────────────

  function dismissCarousel(openIdentity = false) {
    localStorage.setItem('partybox_onboarded', 'true')
    setShowCarousel(false)
    if (openIdentity) setShowIdentityModal(true)
  }

  function nextCarouselSlide() {
    if (carouselSlide < 2) {
      setCarouselSlide(s => s + 1)
    } else {
      dismissCarousel(true)
    }
  }

  function prevCarouselSlide() {
    if (carouselSlide > 0) setCarouselSlide(s => s - 1)
  }

  function handleCarouselTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleCarouselTouchEnd(e) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextCarouselSlide()
      else prevCarouselSlide()
    }
    touchStartX.current = null
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-textPrimary flex flex-col relative overflow-x-clip">

      {/* ── Background ───────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0" aria-hidden>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat sm:hidden"
          style={{ backgroundImage: 'url(/partybox-home-bg-mobile.png)' }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden sm:block"
          style={{ backgroundImage: 'url(/partybox-home-bg.png)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, var(--hero-overlay-1) 0%, var(--hero-overlay-2) 50%, var(--hero-overlay-3) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* CreateRoomSheet overlay */}
        {selectedGame && (
          <CreateRoomSheet
            game={selectedGame}
            onClose={() => setSelectedGame(null)}
          />
        )}

        {/* ModeChooserSheet overlay — dual-mode games (single device vs online) */}
        {selectedDualGame && (
          <ModeChooserSheet
            game={selectedDualGame}
            onClose={() => setSelectedDualGame(null)}
            onChooseOffline={() => {
              const offlineGame = games.find(g => g.slug === selectedDualGame.offlineSlug)
              setSelectedDualGame(null)
              handlePlayGame(offlineGame)
            }}
            onChooseOnline={() => {
              const onlineGame = games.find(g => g.slug === selectedDualGame.onlineSlug)
              setSelectedDualGame(null)
              if (onlineGame && profile) setSelectedGame(onlineGame)
            }}
          />
        )}

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between gap-2 px-4 sm:px-6 py-4 border-b border-border shadow-soft bg-surface/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <LogoMark />
            <h1 className="text-xl font-bold font-display tracking-tight">PartyBox</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {profile && (
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl bg-surfaceElevated text-textSecondary hover:bg-surfaceMuted hover:text-textPrimary transition-colors text-sm font-medium border border-border min-h-[44px]"
                aria-label={t('profile')}
              >
                <span className="text-lg">{profile.avatar}</span>
                <span className="hidden sm:inline max-w-[100px] truncate">{profile.name}</span>
                <span className="text-gold font-semibold">{profile.xp}</span>
                <span className="hidden sm:inline text-textMuted text-xs">{t('xp')}</span>
              </button>
            )}
            <ThemeToggle />
            <LangToggle />
          </div>
        </header>

        {/* ── Offline banner ─────────────────────────────────────────────────── */}
        {!online && (
          <div className="mx-4 sm:mx-6 mt-3 py-2 px-4 rounded-xl bg-surfaceMuted border border-gold/30 text-gold text-sm font-medium text-center flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 10a12 12 0 0116 0M7.5 13.5a7.5 7.5 0 019 0" strokeOpacity="0.4" /><path d="M1 1l22 22" /></svg>
            Offline mode — all games work offline
          </div>
        )}

        <main className="flex-1 px-4 sm:px-6 py-6">
          <GetAppBanner />

          {/* ── Hero (new users only, no in-progress games) ─────────────────── */}
          {showHero && (
            <div className="text-center mb-8 pt-2">
              <p className="text-2xl font-bold font-display">
                Party games for every situation
              </p>
              <p className="text-sm text-textMuted mt-2">
                Play solo, pass the phone, or challenge friends online
              </p>
            </div>
          )}

          {activeRoomGame && (
            <Card
              onClick={() => navigate(`/room/${activeRoom.code}`)}
              className="mb-6 w-full max-w-lg flex items-center gap-3 px-4 py-3 border-gold/60 !bg-surfaceElevated/80 backdrop-blur-sm"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="text-gold shrink-0"><path d="M8 5v14l11-7z" /></svg>
              <span className="flex-1 min-w-0 text-left">
                <span className="block text-textPrimary font-semibold truncate">
                  Your {activeRoomGame.title?.[lang] ?? activeRoomGame.title?.en ?? activeRoomGame.slug} table is still on
                </span>
                <span className="block text-textMuted text-xs">Room {activeRoom.code}</span>
              </span>
              <span className="text-gold font-bold text-sm">Rejoin</span>
            </Card>
          )}

          {/* ── In-progress games strip ─────────────────────────────────────── */}
          {inProgressGames.length > 0 && (
            <div className="mb-6">
              <p className="text-gold text-sm font-semibold mb-3 uppercase tracking-wider">
                {t('gamesInProgress')}
              </p>
              <div className="flex flex-wrap gap-3">
                {inProgressGames.map(g => {
                  const title =
                    typeof g.gameTitle === 'object'
                      ? g.gameTitle[lang] || g.gameTitle.en || g.slug
                      : g.gameTitle || g.slug
                  return (
                    <Card
                      key={g.slug}
                      onClick={() => navigate(`/play/${g.slug}`)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gold !bg-surfaceElevated/70 backdrop-blur-sm"
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      <span>{title}</span>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Join Room ───────────────────────────────────────────────────── */}
          <div className="flex flex-col items-center sm:items-start mb-6">
            <div className="flex items-center gap-3 w-full max-w-lg">
            <button
              onClick={() => setJoinOpen(!joinOpen)}
              className="flex-1 justify-center rounded-xl border border-border bg-surfaceElevated/80 backdrop-blur-sm text-textPrimary hover:bg-surfaceMuted text-sm font-semibold flex items-center gap-2 transition-colors min-h-[44px] px-4"
              aria-label={t('joinRoom')}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /></svg>
              {t('joinRoom')}
            </button>
            <button
              onClick={() => navigate('/tables')}
              className="flex-1 justify-center rounded-xl border border-border bg-surfaceElevated/80 backdrop-blur-sm text-textPrimary hover:bg-surfaceMuted text-sm font-semibold flex items-center gap-2 transition-colors min-h-[44px] px-4"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></svg>
              Open Tables
            </button>
            </div>

            {joinOpen && (
              <Card className="mt-4 w-full max-w-xs flex flex-col items-center gap-3 p-4 !bg-surfaceElevated/80 backdrop-blur-sm">
                <p className="text-textMuted text-sm">{t('enterCode')}</p>
                <Input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  maxLength={4}
                  className="w-32 text-2xl font-bold text-center tracking-widest"
                />
                {error && (
                  <p className="text-error text-sm text-center">{error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setJoinOpen(false)
                      setError('')
                      setJoinCode('')
                    }}
                    className="px-4 py-2 rounded-xl text-textMuted hover:text-textPrimary text-sm font-medium min-h-[44px]"
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

          {/* ── Filters ─────────────────────────────────────────────────────── */}
          <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 mb-4 bg-bg/85 backdrop-blur-sm flex flex-col gap-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {[{ key: 'all', label: 'All' }, ...CATEGORIES].map(c => (
                <FilterChip key={c.key} active={category === c.key} onClick={() => setCategory(c.key)}>
                  {c.key === 'all' ? 'All' : c.label}
                </FilterChip>
              ))}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-xs text-textMuted shrink-0">Players</span>
              {PLAYER_FILTERS.map(f => (
                <FilterChip key={f.key} small active={players === f.key} onClick={() => setPlayers(f.key)}>
                  {f.label}
                </FilterChip>
              ))}
            </div>
          </div>

          {/* ── Game sections ───────────────────────────────────────────────── */}
          {CATEGORIES.filter(c => category === 'all' || category === c.key).map(c => {
            const cards = VISIBLE_GAMES.filter(card => categoryOf(card) === c.key && fitsPlayers(card, players))
            if (cards.length === 0) return null
            return (
              <section key={c.key} className="mb-7">
                <div className="mb-3">
                  <h2 className="text-lg font-bold font-display leading-tight">{c.label}</h2>
                  <p className="text-xs text-textMuted">{c.blurb}</p>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x scroll-px-4 -mx-4 px-4 pb-1 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:overflow-visible">
                  {cards.map(card => {
                    const disabled = card.isOnline && (!online || !profile)
                    return (
                      <GameTile
                        key={cardKey(card)}
                        card={card}
                        disabled={disabled}
                        offlineNotice={card.isOnline && !online ? t('needsInternet') : null}
                        onClick={() => handleCardClick(card, disabled)}
                      />
                    )
                  })}
                </div>
              </section>
            )
          })}
          {VISIBLE_GAMES.every(card => !fitsPlayers(card, players)) && (
            <p className="text-sm text-textMuted mb-6">No games for that group size.</p>
          )}

          {/* ── For review — hidden/unfinished games, dev builds only ── */}
          {import.meta.env.DEV && games.filter(g => !VISIBLE_SLUGS.has(g.slug) && !g.hidden).length > 0 && (
            <div className="mt-8 max-w-lg">
              <p className="text-textMuted text-xs font-semibold mb-3 uppercase tracking-wider">
                For review (not finalized — play &amp; decide)
              </p>
              <div className="flex flex-col gap-2">
                {games.filter(g => !VISIBLE_SLUGS.has(g.slug) && !g.hidden).map(game => {
                  const title = typeof game.title === 'object' ? (game.title[lang] || game.title.en) : game.title
                  return (
                    <button
                      key={game.slug}
                      onClick={() => handleReviewGameClick(game)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border bg-surface hover:bg-surfaceMuted transition-colors text-left"
                    >
                      <span className="text-xl leading-none">{game.icon ?? '🎮'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-textPrimary truncate">{title}</p>
                        <p className="text-xs text-textMuted">{game.slug} · {game.singleDevice ? 'offline' : 'online'}</p>
                      </div>
                      <span className="text-xs font-semibold text-textMuted">Open →</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Ad banner ───────────────────────────────────────────────────── */}
          <AdBanner slot="home-bottom" className="mt-8 mb-3" />

          {/* ── Privacy link ─────────────────────────────────────────────────── */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-textMuted">
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-textPrimary underline">Privacy Policy</a>
            <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-textPrimary underline">Terms</a>
            <a href="/refund.html" target="_blank" rel="noopener noreferrer" className="hover:text-textPrimary underline">Refunds</a>
            <button onClick={() => setConsent(null)} className="hover:text-textPrimary underline">Analytics &amp; ads choice</button>
          </div>

          {/* ── Feedback link ────────────────────────────────────────────────── */}
          <button
            type="button"
            onClick={() => openFeedback()}
            className="text-xs text-textMuted text-center hover:text-textPrimary transition-colors py-4 flex items-center justify-center gap-1.5 w-full"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.5 8.5 0 01-8.5 8.5c-1.3 0-2.5-.3-3.6-.8L3 21l1.8-5.9A8.5 8.5 0 1121 11.5z" /></svg>
            Send feedback / report a problem
          </button>
        </main>
      </div>

      {/* ── Onboarding Carousel (first launch only) ─────────────────────────── */}
      {showCarousel && (
        <div
          className="fixed inset-0 z-50 bg-bg flex flex-col select-none"
          onTouchStart={handleCarouselTouchStart}
          onTouchEnd={handleCarouselTouchEnd}
        >
          {/* Skip button — slides 0 and 1 only */}
          <div className="flex justify-end px-6 pt-6 min-h-[52px]">
            {carouselSlide < 2 && (
              <button
                onClick={() => dismissCarousel(false)}
                className="text-textMuted text-sm font-medium hover:text-textPrimary transition-colors min-h-[44px]"
              >
                Skip
              </button>
            )}
          </div>

          {/* Slide content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">

            {carouselSlide === 0 && (
              <>
                <div className="mb-6"><LogoMark size={72} /></div>
                <h2 className="text-2xl font-bold font-display mb-3">
                  Welcome to PartyBox
                </h2>
                <p className="text-textMuted text-base leading-relaxed max-w-xs">
                  A collection of party games you can play anywhere — solo,
                  with friends in the same room, or with people online.
                </p>
              </>
            )}

            {carouselSlide === 1 && (
              <>
                <h2 className="text-2xl font-bold font-display mb-6">
                  {VISIBLE_GAMES.length}+ games, every situation
                </h2>
                <div className="flex gap-3 mb-6 justify-center">
                  {[
                    { Icon: BoltIcon, name: 'ThinkFast', accent: 'teal' },
                    { Icon: ClapperboardIcon, name: 'Dumb Charades', accent: 'terracotta' },
                    { Icon: RotationIcon, name: 'Teri', accent: 'cobalt' },
                  ].map(g => (
                    <div
                      key={g.name}
                      className={`flex flex-col items-center gap-2 bg-surfaceElevated border-[1.5px] rounded-2xl px-3 py-4 min-w-[80px] ${ACCENT_STYLES[g.accent].border}`}
                    >
                      <div className={ACCENT_STYLES[g.accent].iconRing.split(' ')[1]}>
                        <g.Icon width="26" height="26" />
                      </div>
                      <span className="text-xs text-textSecondary font-medium text-center leading-tight">
                        {g.name}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-textMuted text-base leading-relaxed max-w-xs">
                  Quiz yourself solo, act out Bollywood movies at a party,
                  or play card games and more with friends online.
                </p>
              </>
            )}

            {carouselSlide === 2 && (
              <>
                <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="var(--color-accent-maroon)" strokeWidth="1.6" strokeLinecap="round" className="mb-6 mx-auto"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>
                <h2 className="text-2xl font-bold font-display mb-3">
                  First, what&apos;s your name?
                </h2>
                <p className="text-textMuted text-base leading-relaxed max-w-xs">
                  Pick a name and avatar to track your scores and challenge
                  friends.
                </p>
              </>
            )}
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 pb-5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  i === carouselSlide ? 'bg-gold' : 'bg-surfaceMuted'
                }`}
              />
            ))}
          </div>

          {/* Navigation button */}
          <div className="px-6 pb-10">
            {carouselSlide < 2 ? (
              <button
                onClick={nextCarouselSlide}
                className="w-full py-4 rounded-2xl bg-maroon text-onMaroon font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => dismissCarousel(true)}
                className="w-full py-4 rounded-2xl bg-maroon text-onMaroon font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Let&apos;s Go!
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Identity modal (shown after carousel "Let's Go!") ───────────────── */}
      {showIdentityModal && (
        <PlayerIdentityModal
          profile={profile}
          onComplete={async ({ name, avatar }) => {
            await updateProfile({ name, avatar })
            localStorage.setItem('partybox_identity_set', '1')
            setShowIdentityModal(false)
          }}
        />
      )}
    </div>
  )
}
