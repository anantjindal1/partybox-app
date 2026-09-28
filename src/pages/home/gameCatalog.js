import { BoltIcon, ClapperboardIcon, BellIcon, CrownIcon, RaisedHandIcon, TicketIcon, MagnifyingGlassIcon, MaskIcon, SpeechBubbleIcon, DoorExitIcon, CallBreakIcon, GavelIcon, PartnershipIcon, SevenIcon, MendikotIcon, TargetIcon, RotationIcon, DonkeyIcon, SoloIcon, PartyIcon, SignalIcon, MegaphoneIcon, DetectiveHatIcon, GridIcon } from '../../components/gameIcons'

// Each flagship game owns one accent color as its identity — used consistently
// for its card border, mode label, and CTA. Literal class strings (not
// template-interpolated) so Tailwind's content scanner picks them up.
export const ACCENT_STYLES = {
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
  },
  indigo: {
    border: 'border-indigo',
    iconRing: 'border-indigo text-indigo',
    tab: 'text-indigo border-indigo',
    cta: 'bg-indigo text-onIndigo'
  },
  fuchsia: {
    border: 'border-fuchsia',
    iconRing: 'border-fuchsia text-fuchsia',
    tab: 'text-fuchsia border-fuchsia',
    cta: 'bg-fuchsia text-onFuchsia'
  },
  slate: {
    border: 'border-slate',
    iconRing: 'border-slate text-slate',
    tab: 'text-slate border-slate',
    cta: 'bg-slate text-onSlate'
  },
  turquoise: {
    border: 'border-turquoise',
    iconRing: 'border-turquoise text-turquoise',
    tab: 'text-turquoise border-turquoise',
    cta: 'bg-turquoise text-onTurquoise'
  },
  peridot: {
    border: 'border-peridot',
    iconRing: 'border-peridot text-peridot',
    tab: 'text-peridot border-peridot',
    cta: 'bg-peridot text-onPeridot'
  },
  jade: {
    border: 'border-jade',
    iconRing: 'border-jade text-jade',
    tab: 'text-jade border-jade',
    cta: 'bg-jade text-onJade'
  },
  amethyst: {
    border: 'border-amethyst',
    iconRing: 'border-amethyst text-amethyst',
    tab: 'text-amethyst border-amethyst',
    cta: 'bg-amethyst text-onAmethyst'
  },
  citrine: {
    border: 'border-citrine',
    iconRing: 'border-citrine text-citrine',
    tab: 'text-citrine border-citrine',
    cta: 'bg-citrine text-onCitrine'
  },
  orchid: {
    border: 'border-orchid',
    iconRing: 'border-orchid text-orchid',
    tab: 'text-orchid border-orchid',
    cta: 'bg-orchid text-onOrchid'
  },
  cobalt: {
    border: 'border-cobalt',
    iconRing: 'border-cobalt text-cobalt',
    tab: 'text-cobalt border-cobalt',
    cta: 'bg-cobalt text-onCobalt'
  },
  amber: {
    border: 'border-amber',
    iconRing: 'border-amber text-amber',
    tab: 'text-amber border-amber',
    cta: 'bg-amber text-onAmber'
  },
  taupe: {
    border: 'border-taupe',
    iconRing: 'border-taupe text-taupe',
    tab: 'text-taupe border-taupe',
    cta: 'bg-taupe text-onTaupe'
  },
  cerulean: {
    border: 'border-cerulean',
    iconRing: 'border-cerulean text-cerulean',
    tab: 'text-cerulean border-cerulean',
    cta: 'bg-cerulean text-onCerulean'
  },
  sage: {
    border: 'border-sage',
    iconRing: 'border-sage text-sage',
    tab: 'text-sage border-sage',
    cta: 'bg-sage text-onSage'
  }
}

export const VISIBLE_GAMES = [
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
  {
    slug: 'bluff',
    icon: MaskIcon,
    title: 'Bluff',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'indigo',
    description: 'Play cards face-down, claim a rank — anyone can call it out',
    playersPill: '3-6 players',
    timePill: '~15 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
  {
    slug: 'bakwaas',
    icon: SpeechBubbleIcon,
    title: 'Bakwaas',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'fuchsia',
    description: 'Fill the blank with your funniest line — the room judges',
    playersPill: '3-12 players',
    timePill: '~15 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
  {
    slug: 'bhabhi',
    icon: DoorExitIcon,
    title: 'Bhabhi (Get Away)',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'slate',
    description: 'Follow suit or dump — first to empty your hand wins',
    playersPill: '3-6 players',
    timePill: '~15 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
  {
    slug: 'call-break',
    icon: CallBreakIcon,
    title: 'Call Break',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'turquoise',
    description: 'Bid your tricks, spades are always trump — 5 rounds to the top',
    playersPill: 'Exactly 4 players',
    timePill: '~30 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
  {
    slug: 'judgement',
    icon: GavelIcon,
    title: 'Judgement (Kachuful)',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'peridot',
    description: 'Bid blind, the highest bidder picks trump — hit it exactly or lose it all',
    playersPill: '3-9 players',
    timePill: '~20-45 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
  {
    slug: 'court-piece',
    icon: PartnershipIcon,
    title: 'Court Piece (Rang)',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'jade',
    description: 'Fixed 2v2 partnerships — sweep a Kot or race to 7 match points',
    playersPill: 'Exactly 4 players',
    timePill: '~30-45 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
  {
    slug: 'satti',
    icon: SevenIcon,
    title: 'Satti (Sevens)',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'amethyst',
    description: 'Open each suit with its 7, build up and down, first to empty your hand wins',
    playersPill: '4-8 players',
    timePill: '~20-40 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
  {
    slug: 'mendikot',
    icon: MendikotIcon,
    title: 'Dassi Pakad (Mendikot)',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'citrine',
    description: 'Fixed partnerships, no trump — capture all four 10s (dassi) for a Mendikot',
    playersPill: 'Exactly 4 players',
    timePill: '~20-30 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
  {
    slug: 'teen-do-paanch',
    icon: TargetIcon,
    title: '3-2-5 (Teen Do Paanch)',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'orchid',
    description: 'Fixed rotating targets of 3, 2, and 5 tricks — declared or hidden trump',
    playersPill: 'Exactly 3 players',
    timePill: '~30-45 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
  {
    slug: 'teri',
    icon: RotationIcon,
    title: 'Teri',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'cobalt',
    description: 'Fixed partnerships, a dummy hand, and a rotating single score to 52',
    playersPill: 'Exactly 4 players',
    timePill: '~40-60 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
  {
    slug: 'donkey',
    icon: DonkeyIcon,
    title: 'Donkey (Gadha)',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'amber',
    description: 'Pass cards to collect four of a kind — react fastest or spell D-O-N-K-E-Y',
    playersPill: '3-8 players',
    timePill: '~10-20 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
  {
    slug: 'bakwaas-adaalat',
    icon: MegaphoneIcon,
    title: 'Bakwaas Adaalat',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'taupe',
    description: 'Two lawyers argue a silly case out loud on a timer — the room votes on the winner',
    playersPill: '3-12 players',
    timePill: '~15 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
  {
    slug: 'chugli-detective',
    icon: DetectiveHatIcon,
    title: 'Chugli Detective',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'cerulean',
    description: 'Everyone writes an anonymous confession — guess who wrote it, or fool the room',
    playersPill: '3-12 players',
    timePill: '~15 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
  {
    slug: 'codenames',
    icon: GridIcon,
    title: 'Kodename',
    modeBadge: 'Online',
    modeIcon: SignalIcon,
    accent: 'sage',
    description: 'Two teams, one spymaster each — give a one-word clue to guess your words first',
    playersPill: '4-12 players',
    timePill: '~20-30 mins',
    cta: 'Create Room →',
    isOnline: true,
  },
]

export const CATEGORIES = [
  { key: 'cards', label: 'Card Games', blurb: 'Classic desi card games, online with friends' },
  { key: 'party', label: 'Party & Social', blurb: 'Bluff, act, accuse and argue' },
  { key: 'quiz', label: 'Quiz & Classic', blurb: 'Trivia and Tambola' },
]

const CATEGORY_BY_SLUG = {
  cards: ['bluff', 'bhabhi', 'call-break', 'judgement', 'court-piece', 'satti', 'mendikot', 'teen-do-paanch', 'teri', 'donkey'],
  party: ['dumb-charades-offline', 'sabse-zyada-kaun-offline', 'bakwaas', 'bakwaas-adaalat', 'chugli-detective', 'bhed', 'raja-mantri', 'codenames'],
  quiz: ['thinkfast', 'firstbell', 'tambola'],
}

export function cardKey(card) {
  return card.slug ?? card.offlineSlug
}

export function categoryOf(card) {
  const key = cardKey(card)
  return Object.keys(CATEGORY_BY_SLUG).find(c => CATEGORY_BY_SLUG[c].includes(key))
}

// Parses the display pill ("2-6 players", "Exactly 4 players", "2+ players")
// so the player-count filter can't drift from what the card shows.
export function playerRange(card) {
  const nums = (card.playersPill.match(/\d+/g) || []).map(Number)
  if (/\+/.test(card.playersPill)) return [nums[0], Infinity]
  return [nums[0], nums[1] ?? nums[0]]
}

// Every registered slug that has a Home card (dual-mode cards cover both slugs).
export const VISIBLE_SLUGS = new Set(
  VISIBLE_GAMES.flatMap(c => (c.dualMode ? [c.offlineSlug, c.onlineSlug] : [c.slug]))
)
