# Changelog

All notable changes to PartyBox are documented here.

---

## [Unreleased] — 2026-03-03

### Design System Overhaul

A unified design token layer and shared component library was introduced across the entire app. This replaces ad-hoc hardcoded Tailwind colors (`zinc-950`, `zinc-800`, `amber-500`, etc.) with semantic tokens and reusable primitives.

#### `tailwind.config.js`
- Added semantic color tokens: `surface`, `surfaceElevated`, `surfaceMuted`, `accent`, `accentMuted`, `accentSoft`, `border`, `borderMuted`
- Added shadow tokens: `shadow-soft`, `shadow-card`, `shadow-card-hover`

#### New shared components
- **`src/components/Card.jsx`** — Reusable card container with `surfaceElevated` bg, `border` token, `shadow-card`, and optional hover lift. Renders as `<button>` when `onClick` is provided.
- **`src/components/Input.jsx`** — Shared text input using design tokens (`surfaceElevated`, `border`, `accent` focus ring).
- **`src/games/dumb-charades/theme.js`** — Dumb Charades–specific theme tokens (`DC`) for the dark `#141414` + teal `#2CE49D` accent palette.

#### Global CSS (`src/index.css`)
- `body` background and `focus-visible` ring offset updated to use `surface` token.

---

### Shared Component Updates

- **`Button.jsx`**: Accepts `className` prop; uses `accent`/`accentMuted`/`accentSoft`/`surfaceMuted` tokens; improved `focus-visible` ring.
- **`ConnectionOverlay.jsx`**: Uses `surface`, `surfaceElevated`, `border` tokens; adds `shadow-card`.
- **`CreateRoomSheet.jsx`**: Bottom sheet uses `surfaceElevated`/`border` tokens; Casual/Ranked room selectors replaced with `<Card>` components.
- **`GameChrome.jsx`**: Adds `shadow-soft` to game top bar.
- **`LangToggle.jsx`**: Uses `surfaceElevated`, `surfaceMuted`, `border` tokens.
- **`ResumeGate.jsx`**: Buttons replaced with shared `<Button>` (primary / ghost variants).
- **`RoomCode.jsx`**: Uses `surfaceElevated`, `border`, `accent` tokens; adds `shadow-card`.

---

### Page Updates

#### `Home.jsx`
- Hero background: full-bleed background images (`partybox-home-bg-mobile.png` on mobile, `partybox-home-bg.png` on desktop) with a dark gradient overlay for legibility.
- All game cards, join-code panel, and in-progress game chips converted to `<Card>` component.
- Join-room input converted to `<Input>` component; Join button uses `<Button>`.
- All hardcoded color classes replaced with semantic tokens.

#### `Profile.jsx`
- Avatar picker, XP/level block, stats cards, and badge display converted to `<Card>`.
- Name input converted to `<Input>`.
- All hardcoded color classes replaced with semantic tokens.

#### `Room.jsx`
- Waiting state panel and "game not found" panel converted to `<Card>`.
- All hardcoded `bg-zinc-950` and `border-zinc-800` replaced with `surface`/`border` tokens.

---

### Game Updates

#### Dumb Charades (all screens)
- Extracted `DC` theme object into `src/games/dumb-charades/theme.js`.
- `ActorPrepScreen`, `CategorySelect`, `DumbCharades`, `DumbCharadesOnline`, `ResultScreen`, `RoundScreen`, `SettingsScreen`, `SetupScreen`, `Timer` — all refactored to use `DC.*` tokens instead of inline Tailwind color strings.

#### Tez Hisab — `ResultScreen.jsx`
- Score, correct-count, and XP cards converted to `<Card>`.
- "New Record" banner uses `accentSoft`/`accent` tokens.
- Background uses `surface` token.

#### A to Z Dhamaka — `SetupScreen.jsx`
- Player name inputs converted to `<Input>` inside a `<Card>` wrapper.

---

### New Assets
- `public/partybox-home-bg-mobile.png` — portrait hero image for Home page (mobile).
- `public/partybox-home-bg.png` — landscape/grid hero image for Home page (desktop).
