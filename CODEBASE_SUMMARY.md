# PartyBox Codebase Summary

> Written for AI assistants. Honest about completeness, gaps, and known issues.
> Last updated: 2026-03-07

---

## Current Status (as of today)

### FIRSTBELL

**Phase flow (all 8 phases):**
```
waiting/setup → countdown → question → lockIn → reveal → [repeat question→lockIn→reveal] → results → rematch → waiting
```
- `waiting` and `setup` both render the same `SetupScreen` (host picks category, guests wait)
- `countdown`: 3→2→1→GO! animation, 4.2s total (3×1s + 1.2s for GO! display), shows player avatars
- `question`: 15s timer per question, CircularTimer displayed, answer buttons, live "X of Y answered" counter
- `lockIn`: 1.5s "All answers in…" pause between last answer and reveal — pure animation screen
- `reveal`: 3s, speed-ranked leaderboard with 🥇🥈🥉 medals, StreakBanner, proximity banner, next question preview
- `results`: confetti, visual podium (2nd|1st|3rd order), full scoreboard with accuracy %, stat highlights, share button, sticky Rematch/Home buttons
- `rematch`: 3s RematchScreen countdown with next category preview → back to `waiting`
- 7 questions per game, total 8 distinct phase values in state

**Name/avatar entry:**
- NOT handled inside FirstBell. `PlayerIdentityModal.jsx` (in `src/components/`) is shown before any online room join. FirstBell receives player data via the room system.
- No in-game identity step; everything flows from Room.jsx / PlayerIdentityModal.

**Share/invite flow:**
- Share **results** is built — ResultScreen has a "📱 Share Result" button using `navigator.share` with clipboard fallback.
- Share **room invite link** (to recruit players before game starts) is **NOT built**. No QR code, no link-copy button in SetupScreen or Room lobby.

**Results screen:** Fully built. Sections: winner announcement + XP display, visual podium, full scoreboard with accuracy %, three stat cards (⚡Fastest / 🎯Accurate / 🔥Streak), share card, sticky action buttons.

**Rematch:** Fully built — host-only trigger. Rotates category via `CATEGORY_ROTATION` array. 3s RematchScreen countdown. XP award resets so a second XP award is possible.

**Circular timer:** Built — `src/components/CircularTimer.jsx`. SVG-based. Green >60%, amber >30%, red ≤30%. Center number pulses red when urgent. Used in FirstBell's QuestionScreen.

**Questions source:** `src/data/questions.json` (2,845 questions, served via `src/services/questions.js`). Static firstbell bank (233 q) used as fallback only if normalized pool is insufficient.

**Question count in questions.json:** **2,845 total** across 6 categories:
| Category | Count |
|----------|-------|
| gk | 1,264 |
| science | 535 |
| brain | 405 |
| cricket | 309 |
| bollywood | 174 |
| food | 158 |
| **Total** | **2,845** |

Difficulty split: easy 1,059 / medium 1,144 / hard 642. No disabled questions currently.

---

### THINKFAST

**End-to-end game flow:**
1. **Setup** — enter 2–6 player names (simple text inputs, no avatar in this game)
2. **Category select** — one category chosen for the round (6 options: Bollywood & OTT, Cricket, India GK, Food & Daily Life, Modern India, Brain Teasers — note: "science" is excluded from ThinkFast's list)
3. **Question phase** — turn-based: questions rotate across players (question n → player index n % numPlayers). Each question has a 10s timer. One player answers at a time. The others watch.
4. After answer: `answer_selected` phase briefly shows correct/wrong feedback, then `NEXT_QUESTION` advances
5. After 5 questions: `round_end` → winner calculated → `game_end` shows results
6. Game ends — ResultScreen shows winner and per-player stats. No rematch implemented (would require resetting state)

**Questions source:** `src/games/thinkfast/questionpacks.js` — a thin adapter over `firstbell/questions.js`. It remaps `correctIdx → correctIndex` and short category keys → display strings (`gk → 'India GK'`, etc.). All question data originates from the same static 233-question bank.

**Question count:** Same 233 questions sourced from firstbell/questions.js. However, ThinkFast's `CATEGORIES` list omits `science`, so science questions are only reachable if the user somehow selects that category (they can't — it's not shown). Effective pool per game: 5 questions randomly drawn from the chosen category.

**Phase flow:**
```
setup → category_select → question_show ↔ answer_selected → [repeat 5 questions] → round_end → game_end
```
- `round_end` renders a brief "Calculating winner…" screen before immediately auto-advancing to `game_end`
- `show_result` is listed as a valid `NEXT_QUESTION` source in the reducer but is never set — effectively unused

---

### QUESTIONS / CONTENT

**Total questions used in-game:** 233 (all from `src/games/firstbell/questions.js`)

**Format used in-game (`firstbell/questions.js`):**
```js
{
  category: 'gk' | 'bollywood' | 'cricket' | 'science' | 'food' | 'modern' | 'brain',
  difficulty: 'easy' | 'medium' | 'hard',
  question: string,
  options: [string, string, string, string],  // always 4
  correctIdx: 0 | 1 | 2 | 3
}
```

**Root-level question files (pipeline artifacts, not used directly by game code):**

| File | Status |
|------|--------|
| `SampleQuestions.js` | Large JS question array — used as input by merge scripts |
| `existing_questions.json` | 1,597 question-text strings — deduplication reference |
| `Batch500_v2.json` | 99 question objects — merge input |
| `New500Batch.json` | 132 question objects — merge input |

**`scripts/` — question pipeline (all have been run):**
- `fetchOTDB.js` — fetches from Open Trivia DB API → `questions/raw/otdb_fetched.json`. Handles 429 rate limits with 30s retry, deduplicates, saves incrementally.
- `transformOTDB.js` — transforms raw OTDB format → normalized schema
- `validateQuestions.js` — 6-check validator (required fields, 4 options, correctAnswer in options, difficulty, length, duplicates)
- `normalizeMaster.js` — remaps category names, writes `questions/normalized.json`
- `generateNew500.js` — generated `New500Batch.json`
- `generateQuestionsExtra400.js` — generated additional batches
- `mergeAllQuestions.js` — merges all sources into `questions/master.json`
- `importToFirestore.js` — pushes questions to Firestore (if needed)
- `buildPool.js` — filters `questions.json` for a specific pool
- `cleanupQuestions.js` — keyword-based India-audience filter; writes removed questions to `tools/removed_questions.json`
- `aiCleanupQuestions.js` — AI-powered (Groq API) quality filter, batches of 50; requires `GROQ_API_KEY`
- `countSources.js` — reports question count by source/category
- `generateAndMerge2000.js` — generates 2,000+ new questions targeting 50/35/15 easy/medium/hard split
- `merge2000.js` — merges pool-2000.json + OTDB raw + normalized into `src/data/questions.json`

**`questions/` directory:** gitignored scratch space. `raw/` holds fetched OTDB files; `transformed/` and `normalized.json` hold pipeline intermediates.

---

### DATABASE

**Firestore collections actively used by app:**
```
/rooms/{code}           — game rooms (created on "Create Room", TTL 2h)
/rooms/{code}/actions/{playerId}  — player action events during game
/profiles/{userId}      — XP, name, avatar, badges[]
/profiles/{userId}/stats/{gameSlug}  — wins + gamesPlayed per game (ranked only)
```

**Is Firestore being used for questions?** **No.** All 2,845 in-game questions are bundled in `src/data/questions.json` (imported at build time by Vite). There is no `/questions` Firestore collection. `importToFirestore.js` exists but has not been used for the live game.

**Firebase Analytics:** Initialized conditionally (only when `VITE_FIREBASE_MEASUREMENT_ID` is set). Currently tracks 3 events: `room_created`, `question_answered`, `match_completed`.

---

## 1. What the App Does

PartyBox is a Progressive Web App (PWA) with 10 party games targeting low-end Android devices on 2G networks with low-literacy Indian users.

**Key design decisions:**
- No login. Identity = device UUID stored in `localStorage.partybox_device_id`.
- Offline-first: all 7 single-device games work without internet via service worker (Workbox).
- Online multiplayer uses Firebase Firestore with room codes.
- Hindi/English i18n throughout via `LangContext`.
- XP + badge progression system; profile page shows stats per game.
- **Only 3 games visible on Home right now:** ThinkFast (offline), FirstBell (online), Dumb Charades (both). The other 7 remain in the registry but are hidden via `VISIBLE_SLUGS` in `Home.jsx`.

---

## 2. Games — Completeness Status

| Game | Slug | Type | Players | Complete? | Tests? |
|------|------|------|---------|-----------|--------|
| Lucky Number | `lucky-number` | Online | 2–8 | Functional (no results/XP) | None |
| Number Chain | `number-chain` | Online | 2–4 | **Incomplete** — no game-end, no XP, no ranked | None |
| FirstBell | `firstbell` | Online | 2–6 | **Yes — comprehensive** | Scoring only |
| Dumb Charades | `dumb-charades` | Offline + Online | 2–20 | Yes, complex; online untested | None |
| Tez Hisab | `tez-hisab` | Offline | 1p | Yes | 3 files |
| Spot the Jugaad | `spot-the-jugaad` | Offline | 1p | Yes | 3 files |
| Desi Memory Master | `desi-memory-master` | Offline | 1p | Yes | 4 files |
| Bollywood Emoji Guess | `bollywood-emoji-guess` | Offline | 1p | Yes | 4 files |
| ThinkFast | `thinkfast` | Offline | 2–6 | Yes | 4 files |
| A to Z Dhamaka | `categories` | Offline | 2–6 | Yes | 4 files |

**Notes:**
- "Rapid Fire Battle" was renamed to **FirstBell** (`src/games/firstbell/`). Slug: `firstbell`.
- "Tez Dimaag Challenge" was renamed to **ThinkFast** (`src/games/thinkfast/`). Slug: `thinkfast`.
- "A to Z Dhamaka" lives in `src/games/categories/`.
- Dumb Charades appears in both offline and online game grids.
- Lucky Number has no `singleDevice` flag — online section only.
- `firstbell/index.jsx` exports function named `RapidFireBattle` internally (stale name, no impact).
- `writeGameStats` inside FirstBell still uses slug `'rapid-fire-battle'` in one hardcoded call — minor bug.

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 18 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 (utility-first, dark theme) |
| Realtime DB | Firebase Firestore |
| Analytics | Firebase Analytics (conditional — only when `VITE_FIREBASE_MEASUREMENT_ID` set) |
| Local storage | idb (IndexedDB wrapper) — profile, packs, syncQueue |
| PWA | vite-plugin-pwa + Workbox service worker |
| Unit tests | Jest + jsdom + @testing-library/react |
| E2E tests | Cypress |
| Question fetch | `he` + `node-fetch` (devDependencies, for scripts only) |

---

## 4. Folder Structure

```
partybox/
├── src/
│   ├── App.jsx                    # Routes: /, /room/:code, /profile, /play/:slug
│   ├── firebase.js                # Firebase init (Firestore + Analytics conditional)
│   ├── games/
│   │   ├── registry.js            # Game metadata + React.lazy() imports for all 10 games
│   │   ├── lucky-number/
│   │   │   ├── index.jsx
│   │   │   ├── metadata.js
│   │   │   ├── rules.js
│   │   │   └── scoring.js
│   │   ├── number-chain/
│   │   │   ├── index.jsx
│   │   │   └── metadata.js
│   │   ├── firstbell/             # Online 2–6 player quiz (formerly rapid-fire-battle)
│   │   │   ├── index.jsx          # All screens + phase logic, ~1020 lines
│   │   │   ├── questions.js       # Shared question bank: 7 categories, 233 questions
│   │   │   ├── scoring.js         # Pure scoring utils (unit-tested)
│   │   │   ├── metadata.js        # slug: firstbell, noAutoClose: true, resultsDurationMs: 20000
│   │   │   └── __tests__/
│   │   │       └── scoring.test.js
│   │   ├── dumb-charades/
│   │   │   ├── DumbCharades.jsx        # Thin router → offline or online
│   │   │   ├── DumbCharadesOffline.jsx
│   │   │   ├── DumbCharadesOnline.jsx  # ~807 lines, team-based, untested
│   │   │   ├── ActorPrepScreen.jsx
│   │   │   ├── CategorySelect.jsx
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
│   │   │   └── metadata.js
│   │   ├── tez-hisab/             # Math quiz, offline 1p
│   │   ├── spot-the-jugaad/       # Spot-the-difference, offline 1p
│   │   ├── desi-memory-master/    # Memory matching, offline 1p
│   │   ├── bollywood-emoji-guess/ # Emoji puzzle, offline 1p
│   │   ├── thinkfast/             # Turn-based quiz (formerly rapid-fire-quiz)
│   │   │   ├── ThinkFast.jsx      # Main component (~82 lines)
│   │   │   ├── questionpacks.js   # Thin adapter over firstbell/questions.js
│   │   │   ├── reducer.js         # Phases: setup→category_select→question_show→answer_selected→round_end→game_end
│   │   │   ├── scoring.js
│   │   │   ├── metadata.js        # slug: thinkfast
│   │   │   ├── CategorySelectScreen.jsx
│   │   │   ├── QuestionScreen.jsx
│   │   │   ├── ResultScreen.jsx
│   │   │   ├── SetupScreen.jsx
│   │   │   ├── Timer.jsx
│   │   │   └── __tests__/         # 4 test files
│   │   └── categories/            # A to Z Dhamaka, offline 2–6p
│   ├── components/                # 15 shared UI components
│   │   ├── Button.jsx             # Shared button component
│   │   ├── Card.jsx               # Shared card component
│   │   ├── Input.jsx              # Shared input component
│   │   ├── LangToggle.jsx
│   │   ├── RoomCode.jsx
│   │   ├── ResumeGate.jsx         # Full-screen pause gate
│   │   ├── GameChrome.jsx         # Top bar (Home, theme switcher, lang toggle)
│   │   ├── FadeIn.jsx             # Fade animation between phases
│   │   ├── ConnectionOverlay.jsx  # Fixed overlay when offline
│   │   ├── ReactionBar.jsx        # STUB — returns null (planned)
│   │   ├── CircularTimer.jsx      # SVG countdown circle — green/amber/red, pulse when urgent
│   │   ├── FloatingReactions.jsx  # Fixed overlay — emojis float up per player after each round
│   │   ├── PlayerIdentityModal.jsx # Name + avatar picker before joining online room
│   │   └── CreateRoomSheet.jsx    # Bottom sheet: Casual/Ranked mode selection
│   ├── hooks/
│   │   ├── useGamePersistence.js  # Save/resume boilerplate for offline games
│   │   ├── useSessionXP.js        # XP award + high score on session end
│   │   ├── useOnlineRoom.js       # Full plug-in contract for online games
│   │   ├── useOnlineStatus.js
│   │   ├── useDevMode.js
│   │   ├── useProfile.js
│   │   └── useRoom.js
│   ├── pages/
│   │   ├── Home.jsx               # Offline grid + online section (only 3 games visible)
│   │   ├── Room.jsx               # Online room lobby + game host
│   │   ├── Profile.jsx            # Avatar, XP/level, per-game stats, badges
│   │   └── PlayOffline.jsx        # Wraps game in ErrorBoundary + Suspense
│   ├── services/
│   │   ├── firebase.js            # (see src/firebase.js — these differ; services/ has none)
│   │   ├── db.js                  # IndexedDB via idb (profile, packs, syncQueue)
│   │   ├── profile.js             # Device UUID CRUD + awardBadge()
│   │   ├── room.js                # Firestore room ops (createRoom, joinRoom, writeAction, clearActions)
│   │   ├── xp.js                  # awardXP() — 1.2x multiplier for ranked
│   │   ├── stats.js               # writeGameStats() — Firestore increment
│   │   ├── highScores.js          # localStorage per-game best
│   │   ├── gameStatePersistence.js
│   │   ├── contentPack.js         # Dynamic pack loading + IDB cache
│   │   └── analytics.js           # trackEvent() wrapper for Firebase Analytics
│   ├── store/
│   │   ├── LangContext.jsx        # Hindi/English i18n
│   │   └── GameThemeContext.jsx   # Theme switcher
│   ├── multiplayer/
│   │   ├── turnManager.js
│   │   ├── speedLockResolver.js
│   │   └── __tests__/
│   └── utils/
│       ├── id.js
│       ├── strings.js             # resolveTitle(gameTitle, lang) — handles {en,hi} or string
│       └── strings.test.js
├── scripts/                       # Node.js question pipeline (not bundled by Vite)
│   ├── fetchOTDB.js               # Fetch OTDB API → questions/raw/; 30s retry on 429
│   ├── transformOTDB.js           # Raw → normalized schema
│   ├── validateQuestions.js       # 6-check validator
│   ├── normalizeMaster.js         # Category remapping → questions/normalized.json
│   ├── generateNew500.js          # Generated New500Batch.json
│   ├── generateQuestionsExtra400.js
│   ├── mergeAllQuestions.js       # Merges all sources → questions/master.json
│   ├── importToFirestore.js       # Push to Firestore (not used for live game)
│   ├── buildPool.js               # Filters questions.json for a specific pool
│   ├── cleanupQuestions.js        # Keyword-based India-audience filter
│   ├── aiCleanupQuestions.js      # Groq API quality filter (requires GROQ_API_KEY)
│   ├── countSources.js            # Reports counts by source/category
│   ├── generateAndMerge2000.js    # Generates 2000+ questions, 50/35/15 difficulty split
│   ├── merge2000.js               # Merges pool-2000.json + OTDB + normalized → src/data/
│   └── pool-2000.json             # Intermediate pool used by merge2000.js
├── tools/
│   └── question-editor.html       # Standalone dark-theme question editor (no deps)
│                                  # Virtual scroll (172px cards), File System Access API
│                                  # Filter by category/difficulty/status/search, save/export
├── questions/                     # Gitignored pipeline scratch space
│   ├── raw/                       # OTDB fetched JSON files
│   └── transformed/               # Intermediate transformed files
├── src/data/
│   └── questions.json             # 2,845 questions — bundled by Vite, used in-game
├── tests/                         # Service unit tests
├── cypress/                       # E2E specs
├── SampleQuestions.js             # Large JS question array — pipeline input
├── existing_questions.json        # 1,597 question-text strings, deduplication reference
├── Batch500_v2.json               # 99 question objects — pipeline input
├── New500Batch.json               # 132 question objects — pipeline input
├── PRD.md                         # Actively maintained product requirements
├── CODEBASE_SUMMARY.md            # This file
├── CHANGELOG.md
└── PLAN.md
```

---

## 5. Firestore Data Model

```
/rooms/{code}
  - code, hostId, hostName, gameSlug, hostAvatar
  - roomType: 'casual' | 'ranked'
  - status: 'waiting'
  - phase: managed by game (not top-level field — lives inside state{})
  - state: {}          # game-specific state blob managed by host
  - players: [{id, name, avatar}]
  - createdAt: serverTimestamp()

/rooms/{code}/actions/{playerId}
  - playerId
  - type: string        # e.g. 'ANSWER', 'CORRECT', 'TIMER_EXPIRED'
  - payload: {}
  - createdAt: serverTimestamp()

/profiles/{userId}
  - xp: number
  - name, avatar, badges[]

/profiles/{userId}/stats/{gameSlug}
  - wins: number        # Firestore increment
  - gamesPlayed: number

# No /questions collection — questions are static in JS bundle
```

**Note:** `phase` in FirstBell is stored inside `state` (via `setState()`), not as a top-level field on the room document.

---

## 6. Shared Patterns (Required for All Games)

### Shared Hooks
- `useGamePersistence(slug, onRestore)` → `{ showResumeGate, resume, startNew }` — offline games
- `useSessionXP({ phase, endPhase, score, slug, computeXP })` → `{ isNewRecord }` — awards XP + high score
- `useOnlineRoom(code)` → plug-in contract for online games

### Shared Components
- `<ResumeGate gameTitle onResume onNewGame />` — full-screen gate for resuming saved state
- `<GameChrome slug gameTitle state>` — top bar (Home saves state, theme switcher, lang toggle)
- `<FadeIn key={phase}>` — fade animation between game phases
- `<ConnectionOverlay connected />` — fixed overlay when offline
- `<CircularTimer totalSeconds secondsLeft size />` — SVG countdown
- `<FloatingReactions reactions />` — emoji float-up overlay

### Online Game Contract
- Online games receive `({ code })` prop
- Host manages all state via `setState()` in room doc's `state` field
- Players send actions via `sendAction()` → host processes
- `noAutoClose: true` in metadata → Room.jsx skips auto-navigation after results

---

## 7. Online Game Phase Lifecycles

**FirstBell (8 phases):**
```
waiting/setup → countdown (4.2s) → question (15s) → lockIn (1.5s) → reveal (3s) → [loop] → results → rematch (3s) → waiting
```
- Host drives all phase transitions
- `noAutoClose: true` — ResultScreen owns its own Rematch/Home buttons
- XP: awarded on `results` entry; resets on rematch

**Dumb Charades Online:**
```
team_setup → category_select → settings_select → round_start → actor_prep → playing → turn_result → game_end
```

**Lucky Number / Number Chain:** `waiting → playing` (Number Chain never ends — no results phase)

---

## 8. Scoring Systems

**Lucky Number:** `score = 100` (exact) or `max(0, 50 − 5 × |guess − target|)`

**FirstBell:** Base 10 (correct) + speed bonus (≤5s: +5, ≤10s: +3, ≤15s: +1) = max 15/round. Streaks tracked across rounds. Deduplicates by playerId (first `createdAt` wins).

**ThinkFast:** `calculateQuestionScore(responseTimeMs, streakBefore)` — defined in `scoring.js`. Streak bonus applied.

**Dumb Charades Offline:** Timer expires → opponent +1 pt; first to `winPoints` (default 5) wins.

**XP:** `awardXP(amount, roomType)` — 1.2× multiplier for `ranked`. Syncs to Firestore on reconnect via `GlobalXPSync` in `App.jsx`. Level = `Math.floor(xp/100)+1`.

---

## 9. Test Coverage

**Total: 281 tests across 30 test suites (all green as of 2026-03-02)**

| Area | Status |
|------|--------|
| ThinkFast | 4 test files (integration, questionpacks, reducer, scoring) |
| A to Z Dhamaka | 4 test files |
| Bollywood Emoji Guess | 4 test files |
| Desi Memory Master | 4 test files |
| Tez Hisab | 3 test files (questionGenerator, reducer, scoring) |
| Spot the Jugaad | 3 test files |
| FirstBell (scoring.js only) | 1 file |
| Multiplayer utils | `src/multiplayer/__tests__/` (2 files) |
| Services | `tests/` directory |
| strings.js | `src/utils/strings.test.js` (8 tests) |
| Lucky Number | **None** |
| Number Chain | **None** |
| Dumb Charades | **None** |
| scripts/ | **None** |

Run tests: `npm test`

---

## 10. Known Issues and Incomplete Areas

| Issue | Location | Severity |
|-------|----------|----------|
| Number Chain has no game-end phase | `src/games/number-chain/` | High — game never ends |
| Number Chain missing XP award | `src/games/number-chain/` | High |
| `writeGameStats` in FirstBell uses slug `'rapid-fire-battle'` (stale) | `firstbell/index.jsx:74` | Medium — wrong Firestore path for ranked stats |
| DumbCharadesOnline.jsx is ~807 lines, zero test coverage | `dumb-charades/DumbCharadesOnline.jsx` | Medium |
| Lucky Number, Number Chain, Dumb Charades have zero test coverage | Various | Medium |
| ReactionBar is a stub (returns null) | `src/components/ReactionBar.jsx` | Low — planned |
| No room invite link / QR code in FirstBell lobby | FirstBell SetupScreen | Low — share results exists; share room link doesn't |
| Root-level question files (SampleQuestions.js, existing_questions.json, Batch500_v2.json, New500Batch.json) are pipeline inputs only — not used directly by game | project root | Low — informational |
| `show_result` phase referenced in reducer but never set | `thinkfast/reducer.js` | Low — dead code path |
| Analytics tracks only 3 events; all hardcoded to game `'rapid-fire-battle'` | `firstbell/index.jsx` | Low |

---

## 11. End-to-End User Flow

1. **Home** — Only 3 games visible: ThinkFast (offline), FirstBell (online), Dumb Charades (offline + online). 7 others hidden via `VISIBLE_SLUGS`.
2. **Offline game** → `/play/:slug` → game loads via React.lazy + Suspense; ErrorBoundary catches chunk-load failures
3. **Online game** → CreateRoomSheet (Casual/Ranked) → `/room/:code` → Room.jsx manages lobby
4. **FirstBell** — SetupScreen (host picks category) → 4.2s countdown → 7 question/lockIn/reveal loops → Results (confetti, podium) → optional Rematch
5. **Profile** → avatar, XP/level bar, async Firestore stats cards per online game, badges earned
6. **Offline games persist** — resume gate shown if saved state exists (via `useGamePersistence`)

---

## 12. Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase config |
| `VITE_FIREBASE_PROJECT_ID` | Firebase config |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase config |
| `VITE_FIREBASE_APP_ID` | Firebase config |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional — enables Firebase Analytics |

Firebase Analytics is initialized only when `VITE_FIREBASE_MEASUREMENT_ID` is present; `trackEvent()` no-ops without it.

---

## 13. Recent Changes

### Today (2026-03-07) — Question Editor, Expanded DB, Disabled Filter

- `tools/question-editor.html` (NEW): Standalone dark-theme question editor. No dependencies. Virtual scroll (172px fixed cards, 10-card buffer) handles 2,845 questions smoothly. Left sidebar: stats (Total/Active/Disabled), category/difficulty/status filters, real-time search. Cards show category + difficulty pills, radio-style correct-answer indicator, italic explanation below question, inline dropdowns to edit category/difficulty, checkbox to disable. Save overwrites same file via File System Access API; Export Active Only writes `questions_active_{date}.json`.
- `src/data/questions.json`: Expanded from 2,833 → 2,845 questions via new merge scripts. 6 categories (gk 1264, science 535, brain 405, cricket 309, bollywood 174, food 158). Difficulty: easy 1059 / medium 1144 / hard 642.
- `src/services/questions.js`: Both filter paths (category-specific + random/fallback) now exclude `q.disabled === true` questions. Disabled questions remain in JSON but never appear in game.
- `scripts/fetchOTDB.js`: Fully rewritten — fetches up to 1,000 unique questions across 20 OTDB categories, handles 429 rate limits (30s wait + continue), saves incrementally after each batch, deduplicates by question text.
- New scripts added: `buildPool.js`, `cleanupQuestions.js` (keyword India-audience filter), `aiCleanupQuestions.js` (Groq API quality filter), `countSources.js`, `generateAndMerge2000.js`, `merge2000.js`, `pool-2000.json`.
- Pre-launch cleanup: deleted `GeneratedQuestions.js` (orphaned), added top-level doc comments to `fetchOTDB.js`, `transformOTDB.js`, `validateQuestions.js`, `normalizeMaster.js`.

### 2026-03-07 — Vercel Build Fix
- `src/data/questions.json` (NEW path): Moved from `questions/normalized.json` (gitignored) to `src/data/questions.json` (tracked). Vite can now bundle it at build time.
- `src/services/questions.js`: Import updated from `../../questions/normalized.json` → `../data/questions.json`.

### 2026-03-06 — OTDB Pipeline Setup
- `scripts/fetchOTDB.js` (NEW): Fetches 50 questions per category/difficulty from Open Trivia DB. Handles token expiry (response_code 4), merges + deduplicates art_culture (3 OTDB category IDs map to same filename), decodes HTML entities with `he`.
- `scripts/transformOTDB.js` (NEW): Reads all `otdb_*.json` raw files, shuffles options (Fisher-Yates), writes `questions/transformed/otdb_transformed.json`. Logs category breakdown.
- `scripts/validateQuestions.js` (NEW): 6 checks per question (required fields, 4 options, correctAnswer in options, valid difficulty, question length >10, no duplicates). Exits 1 with `❌` messages on failure.
- `questions/raw/.gitkeep` + `questions/transformed/.gitkeep` (NEW): Empty dirs tracked in git.
- `.gitignore`: Appended `questions/` + `!questions/**/.gitkeep`.
- `package.json`: Added `he` + `node-fetch` as devDependencies.
- **Pipeline not yet run** — `questions/raw/` and `questions/transformed/` are empty.

### Sprint 4 — FirstBell Start/End Polish (2026-03-05)
- `src/games/firstbell/index.jsx` — CountdownScreen: 3→2→1→GO! pre-game animation.
- `src/games/firstbell/index.jsx` — ResultScreen rebuilt: canvas-confetti, visual podium (2nd|1st|3rd display order), full scoreboard with accuracy %, 3 stat highlight cards, share button.
- `src/games/firstbell/index.jsx` — Rematch: `rematch` phase (3s countdown + category preview) → `waiting`. Category rotates via `CATEGORY_ROTATION`.
- `src/games/firstbell/metadata.js` — Added `noAutoClose: true`.
- `src/pages/Room.jsx` — Added `if (game?.noAutoClose) return` guard; suppresses "Room closes in Xs" banner.
- `src/games/registry.js` + `src/games/firstbell/` — Renamed folder from `rapid-fire-battle` to `firstbell`. Slug: `firstbell`.

### Sprint 3 — Social Mechanics (2026-03-05)
- `src/components/FloatingReactions.jsx` (NEW): Emojis float up 2.5s CSS animation, staggered 200ms per player.
- `src/games/firstbell/index.jsx` — Streak tracking across rounds (`streaks`, `bestStreaks`, `correctCounts`, `fastestTimes`). Streak badges on reveal. StreakBanner auto-dismisses.
- `src/games/firstbell/index.jsx` — RevealScreen: next question category preview, "FINAL QUESTION" gold text on last round.

### Sprint 2 — FirstBell Question Loop (2026-03-05)
- `src/components/CircularTimer.jsx` (NEW): SVG circular countdown. Green/amber/red color shifts.
- `src/games/firstbell/index.jsx` — QuestionScreen: CircularTimer replaces flat timer bar; "X of Y answered" counter.
- `src/games/firstbell/index.jsx` — `lockIn` phase (1.5s pause after all answers before reveal).
- `src/games/firstbell/index.jsx` — RevealScreen: speed-ranked leaderboard with medals, response times, staggered FadeInRow animations, proximity banner.

### Session: Question Merge + ThinkFast Rename + Visibility (2026-03-06)
- `src/games/firstbell/questions.js` — Unified 233-question bank (7 categories, `difficulty` field on all entries).
- `src/games/thinkfast/questionpacks.js` — Thin adapter over `firstbell/questions.js`. Remaps field names.
- `src/games/thinkfast/` (formerly `rapid-fire-quiz/`) — Folder, file (`TezDimaagChallenge → ThinkFast`), slug (`rapid-fire-quiz → thinkfast`), display title all renamed.
- `src/pages/Home.jsx` — Added `VISIBLE_SLUGS = new Set(['thinkfast', 'firstbell', 'dumb-charades'])`.

### Design System Overhaul (2026-03-05, commit 0530d89)
- Semantic tokens, `Card.jsx` + `Input.jsx` shared components, hero background on Home.

### Dumb Charades Full Upgrade (2026-03-02)
- New phases, ActorPrepScreen, expanded wordpacks (80→205 movies), online variant, team-based play.
