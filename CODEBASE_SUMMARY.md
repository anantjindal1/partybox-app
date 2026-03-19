# PartyBox — Codebase Summary

> Handoff document for new developers and AI assistants.
> Honest about completeness, gaps, and known issues.
> Last updated: 2026-03-19

---

## 1. What the App Is

PartyBox is a Progressive Web App (PWA) with 10 party games. Primary audience: low-end Android devices, 2G networks, low-literacy Indian users.

**Core design decisions:**
- No login. Identity = device UUID in `localStorage.partybox_device_id`.
- Offline-first: all single-device games work without internet via Workbox service worker.
- Online multiplayer over Firebase Firestore with room codes.
- Hindi/English i18n throughout via `LangContext`.
- XP + badge progression; `Profile.jsx` shows stats per game.
- **Home shows only 3 games via tab UI:** ThinkFast (solo tab), Dumb Charades (party tab), FirstBell (online tab). The other 7 games are complete and in the registry but hidden.

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| UI framework | React 18 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 (utility-first, dark/glassmorphism theme) |
| Realtime DB | Firebase Firestore |
| Analytics | Firebase Analytics (conditional — only when `VITE_FIREBASE_MEASUREMENT_ID` set) |
| Local persistence | idb (IndexedDB wrapper) — profile, packs, syncQueue |
| PWA | vite-plugin-pwa + Workbox (injectManifest strategy) |
| Unit tests | Jest + jsdom + @testing-library/react |
| E2E tests | Cypress |
| Routing | react-router-dom v6 |
| Confetti | canvas-confetti (lazy-imported in ResultScreen) |

---

## 3. Games — Status Table

| Game | Slug | Type | Players | Visible | Complete? | Tests |
|------|------|------|---------|---------|-----------|-------|
| FirstBell | `firstbell` | Online | 2–6 | ✅ (online tab) | **Yes — comprehensive** | scoring.js only |
| Dumb Charades | `dumb-charades` | Offline + Online | 2–20 | ✅ (party tab + online) | Yes; online path untested | None |
| ThinkFast | `thinkfast` | Offline singleDevice | 2–6 | ✅ (solo tab) | Yes | 4 files |
| A to Z Dhamaka | `categories` | Offline singleDevice | 2–6 | Hidden | Yes | 4 files |
| Tez Hisab | `tez-hisab` | Offline singleDevice | 1 | Hidden | Yes | 3 files |
| Spot the Jugaad | `spot-the-jugaad` | Offline singleDevice | 1 | Hidden | Yes | 3 files |
| Desi Memory Master | `desi-memory-master` | Offline singleDevice | 1 | Hidden | Yes | 4 files |
| Bollywood Emoji Guess | `bollywood-emoji-guess` | Offline singleDevice | 1 | Hidden | Yes | 4 files |
| Lucky Number | `lucky-number` | Online | 2–8 | Hidden | Functional; no results/XP | None |
| Number Chain | `number-chain` | Online | 2–4 | Hidden | **Incomplete** — no game-end, no XP | None |

**Name history:**
- "Rapid Fire Battle" → **FirstBell** (`src/games/firstbell/`, slug `firstbell`)
- "Tez Dimaag Challenge" → **ThinkFast** (`src/games/thinkfast/`, slug `thinkfast`)
- "A to Z Dhamaka" lives in `src/games/categories/` (slug `categories`)

---

## 4. Folder Structure

```
partybox/
├── src/
│   ├── App.jsx                    # Routes: /, /room/:code, /profile, /play/:slug
│   │                              # GlobalXPSync component here — syncs XP on reconnect
│   ├── firebase.js                # Firebase init (Firestore + Analytics conditional)
│   ├── main.jsx                   # ReactDOM entry, PWA service worker registration
│   ├── index.css                  # Global styles
│   │
│   ├── data/
│   │   └── questions.json         # 2,845 questions — Vite-bundled, used in-game
│   │
│   ├── games/
│   │   ├── registry.js            # React.lazy() for all 10 games + getGame(slug) helper
│   │   │
│   │   ├── firstbell/             # ── ONLINE QUIZ ───────────────────────────────
│   │   │   ├── index.jsx          # All screens + all phase logic (~1050 lines)
│   │   │   ├── questions.js       # Static question bank: 7 categories, 233 questions
│   │   │   ├── scoring.js         # resolveTieBreak() — pure, unit-tested
│   │   │   ├── metadata.js        # slug: firstbell, noAutoClose: true, resultsDurationMs: 20000
│   │   │   └── __tests__/scoring.test.js
│   │   │
│   │   ├── dumb-charades/         # ── OFFLINE + ONLINE ──────────────────────────
│   │   │   ├── DumbCharades.jsx        # Thin router: code prop → online, else offline
│   │   │   ├── DumbCharadesOffline.jsx # Full offline game
│   │   │   ├── DumbCharadesOnline.jsx  # Team-based online game (~807 lines, 0 tests)
│   │   │   ├── ActorPrepScreen.jsx     # 30s prep, up to 3 word replacements
│   │   │   ├── CategorySelect.jsx
│   │   │   ├── HandoffScreen.jsx
│   │   │   ├── ResultScreen.jsx
│   │   │   ├── RoundScreen.jsx
│   │   │   ├── SettingsScreen.jsx
│   │   │   ├── SetupScreen.jsx
│   │   │   ├── Timer.jsx
│   │   │   ├── InputController.js
│   │   │   ├── reducer.js
│   │   │   ├── scoring.js
│   │   │   ├── strings.js
│   │   │   ├── theme.js
│   │   │   ├── wordpacks.js       # 205 Bollywood movies + other packs
│   │   │   ├── metadata.js        # singleDevice: true, onlineEnabled: true
│   │   │   └── metadata-offline.js
│   │   │
│   │   ├── thinkfast/             # ── OFFLINE TURN-BASED QUIZ ───────────────────
│   │   │   ├── ThinkFast.jsx      # Main component (~82 lines)
│   │   │   ├── questionpacks.js   # Thin adapter over firstbell/questions.js
│   │   │   ├── reducer.js         # setup→category_select→question_show→answer_selected→round_end→game_end
│   │   │   ├── scoring.js
│   │   │   ├── stats.js
│   │   │   ├── metadata.js        # slug: thinkfast
│   │   │   ├── CategorySelectScreen.jsx
│   │   │   ├── QuestionScreen.jsx
│   │   │   ├── ResultScreen.jsx
│   │   │   ├── SetupScreen.jsx
│   │   │   ├── Timer.jsx
│   │   │   └── __tests__/         # integration, questionpacks, reducer, scoring
│   │   │
│   │   ├── categories/            # ── A TO Z DHAMAKA (offline 2–6p) ────────────
│   │   │   ├── AtoZDhamaka.jsx
│   │   │   ├── reducer.js
│   │   │   ├── scoring.js
│   │   │   ├── dictionary.js
│   │   │   ├── metadata.js        # slug: categories
│   │   │   ├── SetupScreen.jsx / RoundScreen.jsx / RevealScreen.jsx / ResultScreen.jsx / Timer.jsx
│   │   │   └── __tests__/         # dictionary, reducer, scoring, integration
│   │   │
│   │   ├── tez-hisab/             # ── MATH QUIZ (offline 1p) ────────────────────
│   │   │   ├── TezHisab.jsx
│   │   │   ├── questionGenerator.js
│   │   │   ├── reducer.js / scoring.js
│   │   │   ├── metadata.js        # slug: tez-hisab
│   │   │   ├── SetupScreen.jsx / QuestionScreen.jsx / ResultScreen.jsx / Timer.jsx
│   │   │   └── __tests__/         # questionGenerator, reducer, scoring
│   │   │
│   │   ├── spot-the-jugaad/       # ── ODD-ONE-OUT (offline 1p) ──────────────────
│   │   │   ├── SpotTheJugaad.jsx
│   │   │   ├── puzzlepacks.js
│   │   │   ├── reducer.js / scoring.js
│   │   │   ├── metadata.js        # slug: spot-the-jugaad
│   │   │   ├── SetupScreen.jsx / PuzzleScreen.jsx / ResultScreen.jsx / Timer.jsx
│   │   │   └── __tests__/
│   │   │
│   │   ├── desi-memory-master/    # ── MEMORY MATCH (offline 1p) ─────────────────
│   │   │   ├── DesiMemoryMaster.jsx
│   │   │   ├── boardUtils.js / themes.js / persistence.js
│   │   │   ├── reducer.js / scoring.js
│   │   │   ├── metadata.js        # slug: desi-memory-master
│   │   │   ├── SetupScreen.jsx / Board.jsx / Card.jsx / ResultScreen.jsx
│   │   │   └── __tests__/
│   │   │
│   │   ├── bollywood-emoji-guess/ # ── EMOJI PUZZLE (offline 1p) ─────────────────
│   │   │   ├── BollywoodEmojiGuess.jsx
│   │   │   ├── puzzlepacks.js
│   │   │   ├── reducer.js / scoring.js
│   │   │   ├── metadata.js        # slug: bollywood-emoji-guess
│   │   │   ├── SetupScreen.jsx / QuestionScreen.jsx / ResultScreen.jsx / Timer.jsx
│   │   │   └── __tests__/
│   │   │
│   │   ├── lucky-number/          # ── ONLINE NUMBER GUESS ───────────────────────
│   │   │   ├── index.jsx
│   │   │   ├── metadata.js        # slug: lucky-number
│   │   │   ├── rules.js
│   │   │   └── scoring.js
│   │   │
│   │   └── number-chain/          # ── ONLINE (INCOMPLETE) ───────────────────────
│   │       ├── index.jsx
│   │       └── metadata.js        # slug: number-chain
│   │
│   ├── components/                # ── SHARED UI ─────────────────────────────────
│   │   ├── Button.jsx             # Shared styled button
│   │   ├── Card.jsx               # Shared card container
│   │   ├── Input.jsx              # Shared text input
│   │   ├── CircularTimer.jsx      # SVG countdown: green >60%, amber >30%, red ≤30%
│   │   ├── FloatingReactions.jsx  # Emoji float-up overlay (2.5s CSS animation)
│   │   ├── PlayerIdentityModal.jsx # Name + avatar picker; persists to localStorage
│   │   ├── CreateRoomSheet.jsx    # Bottom sheet: Casual vs Ranked room selection
│   │   ├── ResumeGate.jsx         # Full-screen gate for resuming a saved offline game
│   │   ├── GameChrome.jsx         # Top bar: Home button (saves state), theme, lang
│   │   ├── FadeIn.jsx             # Fade + slide animation between phase changes
│   │   ├── ConnectionOverlay.jsx  # Fixed overlay shown when device is offline
│   │   ├── ReactionBar.jsx        # STUB — returns null; planned emoji reactions
│   │   ├── LangToggle.jsx         # EN/HI toggle
│   │   └── RoomCode.jsx           # Styled room code display
│   │
│   ├── hooks/
│   │   ├── useOnlineRoom.js       # Full Firestore contract for online games
│   │   │                          # Returns: room, roomState, actions, sendAction,
│   │   │                          #          setState, clearActions, isHost, myId, players
│   │   ├── useGamePersistence.js  # Save/resume for offline games
│   │   │                          # Returns: { showResumeGate, resume, startNew }
│   │   ├── useSessionXP.js        # XP + high score award at session end
│   │   │                          # Returns: { isNewRecord }
│   │   ├── useOnlineStatus.js     # Device connectivity status (used by GlobalXPSync)
│   │   ├── useDevMode.js          # Dev mode utilities
│   │   ├── useProfile.js          # Profile CRUD
│   │   └── useRoom.js             # Room-level operations
│   │
│   ├── pages/
│   │   ├── Home.jsx               # Tab UI: solo / party / online
│   │   │                          # TAB_SLUGS = { solo: ['thinkfast'],
│   │   │                          #               party: ['dumb-charades-offline'],
│   │   │                          #               online: ['firstbell'] }
│   │   │                          # CreateRoomSheet for online game creation
│   │   ├── Room.jsx               # Online room lobby + host. Phase lifecycle,
│   │   │                          # room-type badge (🎲 Casual / 🏆 Ranked),
│   │   │                          # results countdown (metadata.resultsDurationMs)
│   │   ├── Profile.jsx            # Avatar, XP/level bar, Firestore stats per game, badges
│   │   └── PlayOffline.jsx        # Wraps offline game in ErrorBoundary + Suspense
│   │
│   ├── services/
│   │   ├── analytics.js           # trackEvent(name, params) — Firebase Analytics wrapper
│   │   ├── contentPack.js         # Dynamic pack loading + IDB cache
│   │   ├── db.js                  # IndexedDB via idb: profile, packs, syncQueue
│   │   ├── gameStatePersistence.js # localStorage save/restore: key partybox_game_state
│   │   ├── highScores.js          # localStorage per-game best: partybox_hs_<slug>
│   │   ├── profile.js             # Device UUID CRUD + awardBadge(id)
│   │   │                          # UUID in localStorage.partybox_device_id
│   │   │                          # Migrates legacy 'guest' IDB key on first run
│   │   ├── questions.js           # fetchGameQuestions({ category, count })
│   │   │                          # Reads questions.json, filters disabled, shuffles options,
│   │   │                          # difficulty mix: 3 easy + 3 medium + 1 hard
│   │   ├── room.js                # Firestore ops: createRoom, joinRoom, writeAction,
│   │   │                          # clearActions, sendRoomAction (deprecated alias)
│   │   ├── stats.js               # writeGameStats(slug, {won, gamesPlayed}) — ranked only
│   │   └── xp.js                  # awardXP(amount, roomType) — 1.2× for ranked
│   │                              # Syncs to Firestore; local queue when offline
│   │
│   ├── store/
│   │   ├── LangContext.jsx        # Hindi/English i18n context + all string keys
│   │   └── GameThemeContext.jsx   # Theme switcher
│   │
│   ├── multiplayer/               # Pure utilities (no React)
│   │   ├── turnManager.js
│   │   ├── speedLockResolver.js
│   │   └── __tests__/             # turnManager.test.js, speedLockResolver.test.js
│   │
│   └── utils/
│       ├── id.js                  # ID generation
│       ├── strings.js             # resolveTitle(gameTitle, lang) — {en,hi} or plain string
│       └── strings.test.js        # 8 tests
│
├── scripts/                       # Node.js question pipeline (never bundled by Vite)
│   ├── fetchOTDB.js               # Fetches OTDB API; handles 429 rate-limits, deduplicates
│   ├── transformOTDB.js           # Raw OTDB → normalized schema
│   ├── validateQuestions.js       # 6-check validator; exits 1 on failure
│   ├── normalizeMaster.js         # Category remapping → questions/normalized.json
│   ├── mergeAllQuestions.js       # Merges all sources → questions/master.json
│   ├── merge2000.js               # Merges pool-2000.json + OTDB + normalized → src/data/
│   ├── buildPool.js               # Filters questions.json to a subset
│   ├── cleanupQuestions.js        # Keyword-based India-audience filter
│   ├── aiCleanupQuestions.js      # Groq API quality filter (needs GROQ_API_KEY)
│   ├── countSources.js            # Counts by source/category
│   ├── generateAndMerge2000.js    # Generates 2000+ new questions (50/35/15 split)
│   ├── generateNew500.js          # One-time batch generator
│   ├── generateQuestionsExtra400.js
│   ├── importToFirestore.js       # Pushes to Firestore (not used for live game)
│   └── pool-2000.json             # Intermediate pool used by merge2000.js
│
├── tools/
│   └── question-editor.html       # Standalone dark-theme question editor (zero deps)
│                                  # Virtual scroll, File System Access API
│                                  # Filter by category/difficulty/status/search
│                                  # Save overwrites file; Export Active Only available
│
├── tests/                         # Service unit tests
├── cypress/                       # E2E specs
├── questions/                     # GITIGNORED pipeline scratch space
│   ├── raw/                       # OTDB fetched JSON
│   └── transformed/               # Pipeline intermediates
│
├── src/data/questions.json        # 2,845 questions — Vite-bundled
├── SampleQuestions.js             # Pipeline input (root level, not used by game)
├── existing_questions.json        # 1,597 strings — dedup reference
├── Batch500_v2.json               # 99 questions — pipeline input
├── New500Batch.json               # 132 questions — pipeline input
├── PRD.md                         # Product requirements (actively maintained)
├── CODEBASE_SUMMARY.md            # This file
├── CHANGELOG.md
└── PLAN.md
```

---

## 5. FirstBell — Deep Dive

The most complex game. Everything is in `src/games/firstbell/index.jsx` (~1050 lines).

### Phase Flow
```
waiting/setup → countdown (4.2s) → question (15s) → lockIn (1.5s) → reveal (3s)
    ↑                                                                      │
    └─────────────── rematch (3s) ← results ←──────────────── loop Q1–Q6 ┘
                                                              (Q7 skips reveal)
```

### Phase Details
| Phase | Duration | Who drives | What happens |
|-------|----------|-----------|--------------|
| `waiting` / `setup` | — | — | SetupScreen: host picks category, guests see player list + tutorial |
| `countdown` | 4.2s | host timer | 3→2→1→GO! animation, player avatars shown |
| `question` | 15s | host timeout | Options displayed, CircularTimer, "X of Y answered" counter, Q1 shows dismissible scoring tooltip |
| `lockIn` | 1.5s | host timer | "All answers in…" pause; host computes round scores |
| `reveal` | 3s (Q1–Q6 only) | host timer | Answer highlight states, prominent explanation card, result banner, StreakBanner, proximity banner, per-player ranking |
| `results` | — | player | Confetti, podium, scoreboard, stat cards, "📋 How You Did" breakdown, share, sticky action buttons |
| `rematch` | 3s | host timer | Countdown + next category preview → back to waiting |

**Q7 special case:** Goes `lockIn → results` directly, skipping `reveal`. ResultScreen captures Q7's answer synchronously in the render path (before JSX return) to avoid ref-not-set-before-render bugs.

### Scoring
```
Correct 0–5s   → 1000 pts
Correct 5–10s  → 900 pts
Correct 10–15s → 800 pts
Wrong / no answer → 0 pts
```
Computed by `computeTieredScore(isCorrect, deltaSeconds)` in `processRound()` (host only). Pre-computed `roundScores` written to Firestore; clients read from there — they never recompute.

### Local Refs (critical — never written to Firestore)
| Ref | Purpose | Reset when |
|-----|---------|-----------|
| `myAnswerIdxRef` | Which option this player tapped | phase → `question` |
| `myAnswersRef` | History array `[{selectedIdx, pts}]` per question | Never (accumulates full game) |
| `xpAwarded` | Guard to prevent double XP award | phase → `waiting` or `countdown` |

### SetupScreen Scoring Explainer (host only)
Below the info pill, the host sees:
- "⚡ Faster answers = more points"
- Three badges: `⚡ 0–5s = 1000` (green) / `🕐 5–10s = 900` (yellow) / `🕑 10–15s = 800` (orange)
- "Wrong or no answer = 0 pts"

### Results Breakdown ("📋 How You Did")
Shows 7 cards (one per question) using `myAnswersRef.current` + `roomState._questions`:
- **Correct** → green card, answer text shown
- **Wrong** → red card, wrong answer strikethrough + correct answer in green
- **No answer** → zinc card, correct answer shown
- Points earned shown top-right of each card

### Key State Passed Through Phases
`_questions` (all 7 questions) is threaded through every setState call.
`roundScores` is in `lockIn` state AND is now also forwarded into `results` state (needed for Q7 breakdown pts).

---

## 6. Firestore Data Model

```
/rooms/{code}
  code, hostId, hostName, gameSlug, hostAvatar
  roomType: 'casual' | 'ranked'
  status: 'waiting'
  state: {}               # game state blob managed by host via setState()
  players: [{id, name, avatar}]
  createdAt: serverTimestamp()
  expired: boolean        # set to true after 2h; Room.jsx checks on join

/rooms/{code}/actions/{playerId}
  playerId
  type: string            # 'ANSWER', 'REMATCH_VOTE', etc.
  payload: {}
  createdAt: serverTimestamp()

/profiles/{userId}
  xp: number
  name, avatar
  badges: string[]

/profiles/{userId}/stats/{gameSlug}
  wins: number            # Firestore increment — ranked games only
  gamesPlayed: number
```

`phase` in FirstBell lives inside `state` (not a top-level field on the room doc).
Questions are **not** in Firestore — they're bundled in `src/data/questions.json`.

---

## 7. Online Game Architecture

### useOnlineRoom(code) — what it returns
```js
{
  room,          // full room doc
  roomState,     // room.state — the game's state blob
  actions,       // current actions subcollection
  sendAction,    // player sends an action
  setState,      // host writes new state to Firestore
  clearActions,  // host clears actions subcollection
  isHost,        // boolean
  myId,          // device UUID
  players,       // array of {id, name, avatar}
}
```

### Responsibilities
- **Host:** drives all phase transitions via `setState()`. Reads `actions`, runs `processRound()`, writes `roundScores` + `totalScores` + `responseTimes` to state.
- **Non-host:** purely reactive. No local `setState`. Reads `roomState.phase` from Firestore subscription and renders accordingly.
- **All players:** share the same `useEffect`s that watch `phase`. Host-specific effects are gated with `if (!isHost) return`.

### Online game contract
- Online games receive `({ code })` prop (not `{ room, playerId }`)
- `noAutoClose: true` in metadata → Room.jsx skips auto-nav; game owns its own Rematch/Home buttons
- Room expiry: 2h client-side check on join; shows error UI if `expired === true`
- Badge: declare `onlineBadge: { id, emoji }` in metadata; call `awardBadge(id)` on win

---

## 8. Shared Hooks

### useGamePersistence(slug, onRestore)
For offline games. Returns `{ showResumeGate, resume, startNew }`.
Saves game state to `localStorage` (key: `partybox_game_state`). Shows `<ResumeGate>` on re-entry.

### useSessionXP({ phase, endPhase, score, slug, computeXP })
Awards XP and updates high score when `phase === endPhase`.
Returns `{ isNewRecord }`.

### useOnlineStatus()
Returns connectivity boolean. Used globally by `GlobalXPSync` in `App.jsx` — not just Home.

---

## 9. Question Bank

### In-game (bundled in JS)
- **`src/data/questions.json`** — 2,845 questions across 6 categories
- **`src/games/firstbell/questions.js`** — static fallback bank, 233 questions, 7 categories

| Category | Count in questions.json |
|----------|------------------------|
| gk | 1,264 |
| science | 535 |
| brain | 405 |
| cricket | 309 |
| bollywood | 174 |
| food | 158 |
| **Total** | **2,845** |

Difficulty: easy 1,059 / medium 1,144 / hard 642.

### Question format (questions.json)
```js
{
  category: 'gk' | 'science' | 'brain' | 'cricket' | 'bollywood' | 'food',
  difficulty: 'easy' | 'medium' | 'hard',
  question: string,
  options: [string, string, string, string],  // unshuffled
  correctAnswer: string,                      // must be one of options[]
  explanation: string,                        // may be empty
  disabled: boolean,                          // optional; filtered out by questions.js
}
```

### How questions.js serves questions
1. Filter by `category` (exact match) + exclude `disabled === true`
2. If `category === 'random'` or pool empty → use all active questions
3. If pool < requested count → backfill from `firstbell/questions.js` static bank
4. Shuffle, then pick: 3 easy + 3 medium + 1 hard
5. Fill any remainder from shuffled full pool
6. `normalizeQuestion()` shuffles options and recomputes `correctIdx`

---

## 10. Scoring Systems

| Game | Scoring |
|------|---------|
| FirstBell | Tiered by speed: 0–5s=1000, 5–10s=900, 10–15s=800, wrong/none=0 |
| Lucky Number | Exact=100 pts; else `max(0, 50 − 5 × \|guess − target\|)` |
| ThinkFast | `calculateQuestionScore(responseTimeMs, streakBefore)` — streak bonus applied |
| Dumb Charades Offline | Timer expires → opponent +1 pt; first to `winPoints` (default 5) wins |
| XP | `awardXP(amount, roomType)` — 1.2× for ranked; Level = `Math.floor(xp/100)+1` |

---

## 11. Dumb Charades — Online Phase Flow

```
team_setup → category_select → settings_select → round_start →
actor_prep (30s) → playing → turn_result → [repeat] → game_end
```

Host processes action types: `REPLACE_WORD`, `START_ACTING`, `CORRECT`, `TIMER_EXPIRED`, `NEXT_TURN`.
Teams assigned by host before game starts. One actor per team per turn.
`DumbCharades.jsx` is a thin router: if `code` prop exists → `DumbCharadesOnline` (lazy); else → `DumbCharadesOffline`.

---

## 12. Test Coverage

**Total: ~281 tests across 30 suites** (all green as of 2026-03-02; FirstBell changes since are untested).

```
Run: npm test
```

| Area | Test files |
|------|-----------|
| ThinkFast | integration, questionpacks, reducer, scoring |
| A to Z Dhamaka | integration, dictionary, reducer, scoring |
| Bollywood Emoji Guess | integration, puzzlepacks, reducer, scoring |
| Desi Memory Master | integration, board, reducer, scoring |
| Tez Hisab | questionGenerator, reducer, scoring |
| Spot the Jugaad | puzzlepacks, reducer, scoring |
| FirstBell | scoring.js only |
| Multiplayer utils | turnManager, speedLockResolver |
| Services | tests/ directory |
| strings.js | src/utils/strings.test.js (8 tests) |
| Lucky Number | **none** |
| Number Chain | **none** |
| Dumb Charades | **none** |

---

## 13. Known Issues

| Issue | File | Severity |
|-------|------|----------|
| `writeGameStats` inside FirstBell uses slug `'rapid-fire-battle'` (stale) | `firstbell/index.jsx` ~line 95 | Medium — ranked stats write to wrong Firestore path |
| Number Chain has no game-end phase — game runs forever | `number-chain/index.jsx` | High |
| Number Chain missing XP award | `number-chain/index.jsx` | High |
| DumbCharadesOnline.jsx is ~807 lines with zero tests | `dumb-charades/DumbCharadesOnline.jsx` | Medium |
| ReactionBar component is a stub — returns null | `src/components/ReactionBar.jsx` | Low |
| `firstbell/index.jsx` exports function named `RapidFireBattle` internally (stale name) | `firstbell/index.jsx` line 47 | Low — cosmetic |
| `show_result` phase referenced in ThinkFast reducer but never set — dead code | `thinkfast/reducer.js` | Low |
| Analytics `trackEvent` calls inside FirstBell still pass `game: 'firstbell'` but the original room_created event is correct; match_completed and question_answered are correct too | `firstbell/index.jsx` | Low |
| No QR code / room invite link in FirstBell lobby | `firstbell/index.jsx` SetupScreen | Low — WhatsApp share exists; pre-game invite link doesn't |
| Root-level question pipeline files (`SampleQuestions.js`, `existing_questions.json`, etc.) clutter project root | project root | Low — informational, not used by game |

---

## 14. Home.jsx — Visibility Logic

```js
const TAB_SLUGS = {
  solo:   ['thinkfast'],
  party:  ['dumb-charades-offline'],
  online: ['firstbell'],
}
```

Games not in any tab's slug list are unreachable from Home. They remain fully functional — accessible via direct URL `/play/<slug>` or `/room/<code>`.

Dumb Charades appears in **both** grids: as `dumb-charades-offline` (singleDevice, party tab) and as `dumb-charades` (online, if online section added).

---

## 15. Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase config |
| `VITE_FIREBASE_PROJECT_ID` | Firebase config |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase config |
| `VITE_FIREBASE_APP_ID` | Firebase config |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional — enables Firebase Analytics |
| `GROQ_API_KEY` | DevDep only — used by `scripts/aiCleanupQuestions.js` |

Firebase Analytics is initialized conditionally. `trackEvent()` no-ops silently without `VITE_FIREBASE_MEASUREMENT_ID`.

---

## 16. Recent Changes (2026-03-19)

All changes in this session are in `src/games/firstbell/index.jsx` only.

**Scoring tiers updated:** 1000/600/300 → 1000/900/800
`computeTieredScore(isCorrect, deltaSeconds)`: thresholds 5s / 10s unchanged; middle/lower tiers raised.

**SetupScreen scoring explainer (host only):**
Below info pill — "⚡ Faster answers = more points" heading + three colored tier badges + "Wrong or no answer = 0 pts".

**Q1 scoring tooltip on QuestionScreen:**
Dismissible banner on first question only. Auto-dismisses after 4s. Stored in `localStorage` key `partybox_fb_score_tip`. Content: "⚡ 0–5s = 1000pts · 5–10s = 900pts · 10–15s = 800pts".

**RevealScreen — explanation moved to prominent position:**
New layout order (top to bottom): Q header → question text → 💡 explanation card (always visible, no fade-in delay, above options) → answer options → result banner → StreakBanner → proximity banner → per-player ranking → next question preview.

**Results screen — "📋 How You Did" breakdown:**
Section added after stat highlight cards. Shows one card per question (7 total) for the local player: correct (green), wrong (shows wrong strikethrough + correct in green), no answer (zinc + correct in green). Points earned shown top-right. Sourced from `myAnswersRef.current` (local ref) + `roomState._questions`.

**Q7 "No answer" bug fixed:**
Root cause: the reveal useEffect (which accumulated `myAnswersRef.current[qIdx]`) never fires for Q7 because Q7 goes `lockIn → results` directly, skipping reveal. Effects run after render, so the ref was still empty when ResultScreen first mounted.
Fix: Q7 answer is captured synchronously inside the `if (phase === 'results')` render block, before the ResultScreen JSX return. Ref writes during render are safe in React. The old `useEffect` approach was removed.
Additionally: `roundScores` is now forwarded into the `results` state (from the `lockIn → results` path) so pts for Q7 read from the same pre-computed source as Q1–Q6.
