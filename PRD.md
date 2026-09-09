# PartyBox — LLM Reference

## 1. Project Overview

PartyBox is an offline-first PWA for party games played on a single shared device or via Firestore
multiplayer. Target audience: low-end Android phones, 2G, low-literacy Indian users. All games
support English + Hindi (hi).

**Stack:** React 18, Vite 5, Tailwind 3, Firebase Firestore, IndexedDB (idb), Jest + jsdom.

## 2. Games Inventory

| Slug | Title (EN) | Type | Players |
|------|-----------|------|---------|
| `thinkfast` | ThinkFast | Offline single-device | 1 |
| `dumb-charades-offline` / `dumb-charades` | Dumb Charades | Offline single-device / online (online mode broken, see below) | 2–20 |
| `firstbell` | FirstBell | Online only | 2–6 |
| `raja-mantri` | Raja Mantri Chor Sipahi | Online only | 4–8 |
| `sabse-zyada-kaun-offline` / `sabse-zyada-kaun` | Sabse Zyada Kaun | Dual-mode (offline + online) | 3–12 |
| `tambola` | Tambola (Housie) | Online only | 2–20 |
| `bhed` | Bhed (Jasoos) | Online only | 4–8 |
| `tez-hisab` | Tez Hisab | Offline single-device, **hidden** — teen/learning, being refined | 1 |
| `spot-the-jugaad` | Spot the Jugaad | Offline single-device, **hidden** — kids/learning, being refined | 1 |
| `desi-memory-master` | Desi Memory Master | Offline single-device, not yet triaged | 1 |

Deleted (triaged out): `lucky-number`, `number-chain`, `bollywood-emoji-guess`, `categories` (A to Z Dhamaka).

Dumb Charades' online mode (`dumb-charades` slug) is pre-existing broken wiring — both registry entries load the same offline-only component, and the dead `DumbCharadesOnline.jsx` calls a function `wordpacks.js` doesn't export. Not fixed; sits in Home's "For review" list undecided.

Full UI runs on the **"Ivory & Jewel"** design system (`src/index.css` + `tailwind.config.js`) — warm ivory light theme, jewel-tone accents, Rozha One display font, no emoji in any newly-built game (inline SVG icons only via `src/components/gameIcons.jsx`). Each flagship game owns exactly one accent color: `teal`=ThinkFast, `terracotta`=Dumb Charades, `gold`=FirstBell, `plum`=Raja Mantri, `rose`=Sabse Zyada Kaun, `sapphire`=Tambola, `emerald`=Bhed; `maroon` is the reserved app-wide brand color. This supersedes the "emoji-heavy" note in the Design Constraints section below, which predates the rebuild.

`singleDevice: true` in metadata → offline. No flag → online multiplayer.

## 3. App Shell

- **Routes:** `/` Home · `/room/:code` Room · `/profile` · `/play/:slug`
- Home splits: `singleDevice: true` → "Offline" grid; no flag → "Online Games" section
- Tapping an online game opens `<CreateRoomSheet>` (bottom sheet) — user picks Casual or Ranked, then room is created
- `Room.jsx` is generic — picks up any online game via `gameSlug` in the room doc
- `PlayOffline.jsx` wraps game components in `<ErrorBoundary>` + `<Suspense>`
- All game components lazy-loaded via `React.lazy()` in `src/games/registry.js`

## 4. Offline Game Pattern

**Required files:**
- `src/games/<slug>/metadata.js` — `{ slug, title:{en,hi}, icon, minPlayers, maxPlayers, singleDevice:true }`
- `src/games/<slug>/<GameName>.jsx` — top-level component, receives `{ slug, gameTitle }` props
- `src/games/registry.js` — add `React.lazy()` import + spread metadata + `Component`

**Must use:**

| Hook / Component | Purpose |
|-----------------|---------|
| `useGamePersistence(slug, onRestore)` → `{ showResumeGate, resume, startNew }` | Save/resume boilerplate |
| `<ResumeGate gameTitle onResume onNewGame />` | Full-screen resume prompt |
| `<GameChrome slug gameTitle state>` | Top bar — Home (saves state), lang toggle, theme |
| `<FadeIn key={phase}>` | Fade animation between phases |

Reducer must handle `RESTORE_STATE` action to rehydrate persisted state.

**Optional:** `useSessionXP({ phase, endPhase, score, slug, computeXP })` → `{ isNewRecord }` — XP + high score at end.

## 5. Online Game Pattern

**How it works:** Players write to `actions/{playerId}` subcollection. Host's `useEffect([actions])`
applies game logic, writes result to `room.state` via `setState()`, then calls `clearActions()`.
All clients subscribe via `onSnapshot` → reactive UI. Single host writer avoids conflicts.

**Firestore schema:**
```
/rooms/{code}
  { code, hostId, gameSlug, roomType:'casual'|'ranked',
    players:[{id,name,avatar}], state:{}, createdAt }

/rooms/{code}/actions/{playerId}
  { playerId, type, payload, createdAt: serverTimestamp() }

/rooms/{code}/reactions/{playerId}
  { emoji, createdAt }   ← ephemeral; Week 3 implementation

/profiles/{userId}/stats/{gameSlug}
  { wins, gamesPlayed }  ← ranked rooms only
```

**Room types:**
- `casual` — standard XP, no win tracking
- `ranked` — XP ×1.2, wins written to `/profiles/{id}/stats/{slug}`

**Phase lifecycle (online games):**
- Host sets `roomState.phase` as game progresses (e.g. `picking → playing → results`)
- When `roomState.phase === 'results'`, Room.jsx starts a countdown (default 10s; configurable via `metadata.resultsDurationMs`) then calls `endGame()` and navigates home
- Each client awards its own XP/stats/badge inside a `useEffect([roomState.phase])` — no host-only award
- Rapid Fire Battle phase sequence: `waiting → setup → question → reveal → question … (×10) → results` (`resultsDurationMs: 20000`)

**Required files:**
- `src/games/<slug>/metadata.js` — same shape as offline, **no** `singleDevice` field
- `src/games/<slug>/index.jsx` — receives `({ code })` prop
- Register in `registry.js` the same way as offline games

**`useOnlineRoom(code)` API** (from `src/hooks/useOnlineRoom.js`):
```js
const { room, roomState, actions, sendAction, setState, clearActions,
        isHost, players, myId, connected, expired, endGame, kickPlayer }
      = useOnlineRoom(code)
```
- `room` — full room doc including `room.roomType` and `room.hostId`
- `roomState` — shared state object; host writes via `setState(newState)`
- `sendAction({type, payload})` — player writes to their actions doc (flat schema)
- `clearActions()` — host batch-deletes action docs after processing
- `endGame()` — host: `deleteRoom` + all redirect `/`; `kickPlayer(id)` — waiting phase only

**Host action-processing pattern:**
```js
useEffect(() => {
  if (!isHost || !actions.length) return
  // sort by a.createdAt?.seconds, read a.type and a.payload directly
  // setState(newState), clearActions()
}, [actions])
```

**Client-side game end pattern:**
```js
useEffect(() => {
  if (roomState.phase !== 'results' || !myId) return
  awardXP(myScore, room?.roomType)           // 1.2x if ranked
  if (room?.roomType === 'ranked') writeGameStats(slug, { won, gamesPlayed: 1 })
  if (isWinner) awardBadge('someId')
}, [roomState.phase])
```

**Room lifecycle:**
- `createRoom(hostId, name, slug, avatar, roomType='casual')` → 4-char code
- `joinRoom(code, id, name)` — throws if >2h old
- `<ConnectionOverlay connected />` rendered by Room.jsx — no action needed in game component
- Room.jsx shows room type badge (🎲 Casual / 🏆 Ranked) in header
- `<ReactionBar roomCode={code} />` rendered below player list (stub, full impl Week 3)

**Optional:** `onlineBadge: { id, emoji }` in metadata.js + `awardBadge(id)` on win.

## 6. Multiplayer Engine Utilities

Located in `src/multiplayer/` — pure functions, no Firebase, no React, fully unit-testable.

**`turnManager.js`** — turn sequencing for future turn-based games:
```js
createTurnState(players)          → { playerIds, currentIdx, round }
getCurrentPlayer(turnState)       → { id } | null
advanceTurn(turnState)            → new turnState (increments round when wrapped)
removePlayer(turnState, playerId) → new turnState without that player
isRoundComplete(turnState)        → boolean
```

**`speedLockResolver.js`** — first-valid-action winner for speed rounds:
```js
resolveSpeedRound(actions, validateFn) → { winnerId, resolvedAt, lateActions, invalidActions }
```
Sorts ascending by `action.createdAt?.seconds`. First action where `validateFn(action)` is true → winner.

## 7. Shared Services

| Service | File | What it does |
|---------|------|-------------|
| Profile | `src/services/profile.js` | `getProfile()`, `saveProfile()`, `awardBadge()` — IndexedDB, UUID identity |
| Room | `src/services/room.js` | `createRoom(hostId, name, slug, avatar, roomType)`, `joinRoom`, `deleteRoom`, `kickPlayer`, `subscribeToActions`, `writeAction` (flat schema), `clearActions`, `updateRoomState` |
| XP | `src/services/xp.js` | `awardXP(amount, roomType='casual')` — 1.2x multiplier for ranked; local increment + queued Firestore sync on reconnect |
| Stats | `src/services/stats.js` | `writeGameStats(slug, {won, gamesPlayed})` — Firestore increment to `/profiles/{id}/stats/{slug}`; ranked rooms only |
| Analytics | `src/services/analytics.js` | `trackEvent(name, params)` — Firebase Analytics wrapper; no-ops when `VITE_FIREBASE_MEASUREMENT_ID` is absent |
| High Scores | `src/services/highScores.js` | `checkAndUpdateHighScore(slug, score)` — localStorage |
| Game State | `src/services/gameStatePersistence.js` | `saveGameState`, `getSavedState`, `clearSavedState` — localStorage |

## 8. Shared Components (online-specific)

| Component | File | Purpose |
|-----------|------|---------|
| `<CreateRoomSheet game onClose />` | `src/components/CreateRoomSheet.jsx` | Bottom sheet — Casual/Ranked picker; calls `createRoom` then navigates |
| `<ReactionBar roomCode />` | `src/components/ReactionBar.jsx` | Stub (returns null) — full emoji reactions in Week 3 |
| `<ConnectionOverlay connected />` | `src/components/ConnectionOverlay.jsx` | Fixed overlay when offline |

## 9. i18n

- `useLang()` from `src/store/LangContext.jsx` → `{ lang, t, setLang }`
- Add new string keys to both `en` and `hi` objects in `LangContext.jsx`
- Game titles use `{ en, hi }` objects; render with `resolveTitle(title, lang)` from `src/utils/strings.js`
- Current keys include: `casualRoom`, `rankedRoom`, `casualDesc`, `rankedDesc`, `roomClosesIn`, `rapidFireBattle`, `pickCategory`, `timeLeft`, `correctAnswer`, `yourScore`, `rankedBonus`, `level`, `wins`, `gamesPlayed`

## 10. Profile Page

- **Level:** `Math.floor(xp / 100) + 1`
- **XP progress bar:** `xp % 100` fill with `Level N` label — reads from IndexedDB (always available)
- **Per-game stat cards:** `wins` + `gamesPlayed` fetched async from Firestore `/profiles/{id}/stats/{slug}` — online games only; skeleton shown when offline or loading

## 11. Testing

- **Run:** `npm test` — Jest + jsdom + @testing-library/react; **618 tests, 75 real suites, all green** (3 suites fail in this checkout only due to stray `.claude/worktrees/*` duplicate-module noise — not a real regression)
- Game tests: `src/games/<slug>/__tests__/`; service tests: `tests/`; multiplayer util tests: `src/multiplayer/__tests__/`
- Mock `crypto.randomUUID`: use `Object.defineProperty(global, 'crypto', ...)` — `jest.spyOn` fails on jsdom

## 12. Design Constraints

**UI:** Big text, big buttons (tap targets ≥ 44px), Indian-themed content, no emoji in newly-built
UI (inline SVG icons only — see the Ivory & Jewel note in section 2). Readable at a glance — no
small print, no complex navigation. Every screen must work in Hindi and English.

**Performance:** On-device content generation (questions, puzzles, word queues) must complete in
<20ms. Avoid large static assets — use lightweight identifiers (text/URLs), lazy-load via code
splitting, no blocking operations on the main thread.

**Out of scope:** User authentication, persistent server-side accounts, chat or voice in rooms,
push notifications, admin panel.
