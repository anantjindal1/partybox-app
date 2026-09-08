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
import PlayerIdentityModal from '../components/PlayerIdentityModal'
import { trackEvent as trackAnalyticsEvent } from '../services/analytics_events'
import AdBanner from '../components/AdBanner'
import { BoltIcon, ClapperboardIcon, BellIcon, CrownIcon, RaisedHandIcon, TicketIcon, MagnifyingGlassIcon, SoloIcon, PartyIcon, SignalIcon } from '../components/gameIcons'

const COMING_SOON_SLOTS = 0

// TODO: restore tabs when game count > 5
// const TABS = [
//   { key: 'solo',   label: 'Solo',   emoji: '👤' },
//   { key: 'party',  label: 'Party',  emoji: '🎉' },
//   { key: 'online', label: 'Online', emoji: '📡' },
// ]
//
// const TAB_SLUGS = {
//   solo:   ['thinkfast'],
//   party:  ['dumb-charades-offline'],
//   online: ['firstbell'],
// }

// Each flagship game owns one accent color as its identity — used consistently
// for its card border, mode label, and CTA. Literal class strings (not
// template-interpolated) so Tailwind's content scanner picks them up.
const ACCENT_STYLES = {
  teal: {
    border: 'border-teal',
    iconRing: 'border-teal text-teal',
    tab: 'text-teal border-teal',
    cta: 'bg-teal text-onTeal'
  },
  terracotta: {
    border: 'border-terracotta',
    iconRing: 'border-terracotta text-terracotta',
    tab: 'text-terracotta border-terracotta',
    cta: 'bg-terracotta text-onTerracotta'
  },
  gold: {
    border: 'border-gold',
    iconRing: 'border-gold text-gold',
    tab: 'text-gold border-gold',
    cta: 'bg-gold text-onGold'
  },
  plum: {
    border: 'border-plum',
    iconRing: 'border-plum text-plum',
    tab: 'text-plum border-plum',
    cta: 'bg-plum text-onPlum'
  },
  rose: {
    border: 'border-rose',
    iconRing: 'border-rose text-rose',
    tab: 'text-rose border-rose',
    cta: 'bg-rose text-onRose'
  },
  sapphire: {
    border: 'border-sapphire',
    iconRing: 'border-sapphire text-sapphire',
    tab: 'text-sapphire border-sapphire',
    cta: 'bg-sapphire text-onSapphire'
  },
  emerald: {
    border: 'border-emerald',
    iconRing: 'border-emerald text-emerald',
    tab: 'text-emerald border-emerald',
    cta: 'bg-emerald text-onEmerald'
  }
}

function LogoMark({ size = 26 }) {
  return (
    <svg viewBox="0 0 30 30" width={size} height={size}>
      <circle cx="15" cy="15" r="14" fill="none" stroke="var(--color-accent-gold)" strokeWidth="1.5" />
      <circle cx="15" cy="15" r="9" fill="var(--color-accent-maroon)" />
      <path d="M12 11l7 4-7 4v-8z" fill="var(--color-bg)" />
    </svg>
  )
}

// Static card definitions for the vertical game stack
const VISIBLE_GAMES = [
  {
    slug: 'thinkfast',
    icon: BoltIcon,
    title: 'ThinkFast',
    modeBadge: 'Solo',
    modeIcon: SoloIcon,
    accent: 'teal',
    description: '10 questions, answer as fast as you can',
    playersPill: '1 player',
    timePill: '~3 mins',
    cta: 'Play →',
    isOnline: false,
  },
  {
    slug: 'dumb-charades-offline',
    icon: ClapperboardIcon,
    title: 'Dumb Charades',
    modeBadge: 'Party',
    modeIcon: PartyIcon,
    accent: 'terracotta',
    description: 'Act out Bollywood movies, songs & more',
    playersPill: '2+ players',
    timePill: 'Pass the phone',
    cta: 'Play →',
    isOnline: false,
  },
  {
    slug: 'firstbell',
    icon: BellIcon,
    title: 'FirstBell',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'gold',
    description: 'Live quiz battle with friends online',
    playersPill: '2-6 players',
    timePill: '~5 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
  {
    slug: 'raja-mantri',
    icon: CrownIcon,
    title: 'Raja Mantri Chor Sipahi',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'plum',
    description: 'Guess who the secret Chor is before it’s too late',
    playersPill: '4-8 players',
    timePill: '~10 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
  {
    dualMode: true,
    offlineSlug: 'sabse-zyada-kaun-offline',
    onlineSlug: 'sabse-zyada-kaun',
    icon: RaisedHandIcon,
    title: 'Sabse Zyada Kaun',
    modeBadge: 'Party',
    modeIcon: PartyIcon,
    accent: 'rose',
    description: 'Who fits the prompt best? The room decides',
    playersPill: '3-12 players',
    timePill: '~10 mins',
    cta: 'Play →',
  },
  {
    slug: 'tambola',
    icon: TicketIcon,
    title: 'Tambola',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'sapphire',
    description: 'Classic Housie — host calls numbers, shout your claims',
    playersPill: '2-20 players',
    timePill: '~20 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
  {
    slug: 'bhed',
    icon: MagnifyingGlassIcon,
    title: 'Bhed (Jasoos)',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'emerald',
    description: 'Everyone shares a secret word except one outsider — find the Bhed',
    playersPill: '4-8 players',
    timePill: '~15 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
]

// Every other registered game — surfaced below as a plain, temporary review
// list (not full card treatment) so hidden/unfinished games can be played
// and triaged for deletion. Not meant to look "finished."
const VISIBLE_SLUGS = new Set([
  'thinkfast', 'dumb-charades-offline', 'firstbell', 'raja-mantri',
  'sabse-zyada-kaun', 'sabse-zyada-kaun-offline', 'tambola', 'bhed',
])

export default function Home() {
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const { profile } = useProfile()
  const online = useOnlineStatus()

  // Existing state
  const [joinOpen, setJoinOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedGame, setSelectedGame] = useState(null)
  const [selectedDualGame, setSelectedDualGame] = useState(null)

  // TODO: restore tabs when game count > 5
  // const [activeTab, setActiveTab] = useState(
  //   () => localStorage.getItem('partybox_home_tab') || 'solo'
  // )

  // Carousel state
  const [showCarousel, setShowCarousel] = useState(
    () => !localStorage.getItem('partybox_onboarded')
  )
  const [carouselSlide, setCarouselSlide] = useState(0)
  const touchStartX = useRef(null)

  // Identity modal shown after carousel "Let's Go!"
  const [showIdentityModal, setShowIdentityModal] = useState(false)

  // ── Session tracking ────────────────────────────────────────────────────────
  useEffect(() => {
    trackAnalyticsEvent('session_start', null)
  }, [])

  const inProgressGames = getInProgressGames()

  // Hero: show only for new users with no in-progress games
  const showHero =
    !localStorage.getItem('partybox_returning_user') &&
    inProgressGames.length === 0

  // TODO: restore tabs when game count > 5
  // const tabGames = games.filter(g =>
  //   (TAB_SLUGS[activeTab] || []).includes(g.slug)
  // )

  // ── Handlers ────────────────────────────────────────────────────────────────

  // TODO: restore tabs when game count > 5
  // function selectTab(tab) {
  //   setActiveTab(tab)
  //   localStorage.setItem('partybox_home_tab', tab)
  // }

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
    <div className="min-h-screen text-textPrimary flex flex-col relative overflow-x-hidden">

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
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border shadow-soft bg-surface/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <LogoMark />
            <h1 className="text-xl font-bold font-display tracking-tight">PartyBox</h1>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surfaceElevated text-textSecondary hover:bg-surfaceMuted hover:text-textPrimary transition-colors text-sm font-medium border border-border min-h-[44px]"
                aria-label={t('profile')}
              >
                <span className="text-lg">{profile.avatar}</span>
                <span className="hidden sm:inline max-w-[100px] truncate">{profile.name}</span>
                <span className="text-gold font-semibold">{profile.xp}</span>
                <span className="text-textMuted text-xs">{t('xp')}</span>
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

          {/* ── Vertical game cards stack ────────────────────────────────────── */}
          <div className="flex flex-col gap-3 max-w-lg">
            {VISIBLE_GAMES.map(card => {
              const game = games.find(g => g.slug === card.slug)
              const disabled = card.isOnline && (!online || !profile)
              const accent = ACCENT_STYLES[card.accent]
              const Icon = card.icon
              const ModeIcon = card.modeIcon

              function handleClick() {
                if (card.dualMode) {
                  setSelectedDualGame(card)
                  return
                }
                if (disabled || !game) return
                if (card.isOnline) {
                  setSelectedGame(game)
                } else {
                  handlePlayGame(game)
                }
              }

              return (
                <button
                  key={card.slug ?? card.offlineSlug}
                  onClick={handleClick}
                  disabled={disabled}
                  className={`w-full text-left bg-surfaceElevated border-[1.5px] rounded-2xl px-4 py-4 transition-colors ${accent.border} ${
                    disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-surfaceMuted active:scale-[0.99]'
                  }`}
                >
                  {/* Row 1: icon + title + mode label */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-full border-[1.5px] flex items-center justify-center ${accent.iconRing}`}>
                        <Icon />
                      </div>
                      <span className="text-base font-bold text-textPrimary">{card.title}</span>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-semibold border-b-[1.5px] pb-0.5 ${accent.tab}`}>
                      <ModeIcon />
                      {card.modeBadge}
                    </span>
                  </div>

                  {/* Row 2: description */}
                  <p className="text-textMuted text-sm mb-3 leading-snug">
                    {card.description}
                  </p>

                  {/* Row 3: pills + CTA */}
                  <div className="flex items-center gap-2">
                    <span className="border border-border rounded-full px-2 py-0.5 text-xs text-textMuted">
                      {card.playersPill}
                    </span>
                    <span className="border border-border rounded-full px-2 py-0.5 text-xs text-textMuted">
                      {card.timePill}
                    </span>
                    <span
                      className={`ml-auto text-xs font-semibold px-3 py-1.5 rounded-xl min-h-[36px] flex items-center ${accent.cta}`}
                    >
                      {card.cta}
                    </span>
                  </div>

                  {/* Offline notice for online game */}
                  {card.isOnline && !online && (
                    <p className="mt-2 text-xs text-textMuted">{t('needsInternet')}</p>
                  )}
                </button>
              )
            })}
          </div>

          {/* ── For review — hidden/unfinished games, temporary until triaged ── */}
          {games.filter(g => !VISIBLE_SLUGS.has(g.slug) && !g.hidden).length > 0 && (
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

          {/* ── Join Room ───────────────────────────────────────────────────── */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setJoinOpen(!joinOpen)}
              className="text-textMuted hover:text-textPrimary text-sm font-medium flex items-center gap-2 transition-colors min-h-[44px]"
              aria-label={t('joinRoom')}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /></svg>
              {t('joinRoom')}
            </button>

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

          {/* ── Feedback link ────────────────────────────────────────────────── */}
          <a
            href="https://wa.me/+919001290623?text=PartyBox%20feedback%3A%20"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-textMuted text-center hover:text-textPrimary transition-colors py-4 flex items-center justify-center gap-1.5 w-full"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.5 8.5 0 01-8.5 8.5c-1.3 0-2.5-.3-3.6-.8L3 21l1.8-5.9A8.5 8.5 0 1121 11.5z" /></svg>
            Share feedback
          </a>
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
                  3 games, every situation
                </h2>
                <div className="flex gap-3 mb-6 justify-center">
                  {[
                    { Icon: BoltIcon, name: 'ThinkFast', accent: 'teal' },
                    { Icon: ClapperboardIcon, name: 'Dumb Charades', accent: 'terracotta' },
                    { Icon: BellIcon, name: 'FirstBell', accent: 'gold' },
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
                  or race friends online.
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
        <PlayerIdentityModal onComplete={() => setShowIdentityModal(false)} />
      )}
    </div>
  )
}
