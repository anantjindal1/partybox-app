# PartyBox — Product Requirements Document

## Overview

PartyBox is an offline-first social microgame container PWA. It ships **8 games**: Lucky Number, Dumb Charades, Tez Hisab, Spot the Jugaad, Desi Memory Master, Bollywood Emoji Guess, Tez Dimaag Challenge (Rapid Fire Quiz), and A to Z Dhamaka. It lets small groups play casual party games together using a shared room code, with no accounts required. Primary audience: low-literacy, low-bandwidth users on low-end Android devices (guards, maids, travellers).

---

## Goals

- Zero-friction entry: play without signing up
- Works on 2G / intermittent connectivity
- Readable at a glance: big text, big buttons, emoji-heavy UI
- Hindi and English support via a single tap
- Extensible: adding a new game requires only 4 files

---

## User Personas

| Persona | Device | Literacy | Primary need |
|---|---|---|---|
| Ravi (security guard) | Android Go, 2G | Low | Quick game during break |
| Priya (domestic worker) | Shared Android, WiFi | Medium | Play with family |
| Traveller | Any, offline | Any | Pass time without network |

---

## Features & Requirements

### F1 — Guest Profile
- Auto-created on first launch (no sign-up)
- Stores name, emoji avatar, XP, badges in IndexedDB
- Persists across sessions and app restarts

### F2 — Language Toggle
- Single tap switches between English and Hindi
- All UI strings update instantly without reload
- Toggle is accessible from every screen

### F3 — Create Room
- Host picks a game from the registry
- A 4-character alphanumeric room code is generated
- Room is created in Firestore; host is redirected to the Room page

### F4 — Join Room
- Player enters a 4-character code
- If the room exists, they are added to the player list
- Player is redirected to the Room page

### F5 — Real-time Room
- Player list updates live via Firestore `onSnapshot`
- Room code is always visible for sharing
- Host is visually distinguished (crown icon)

### F6 — Lucky Number Game
- Host picks a secret number 1–10
- All other players submit a guess
- Host reveals the answer; scores are computed: `score = 100` for exact match, otherwise `max(0, 50 − 5 × |guess − target|)`
- Winner earns XP

### F7 — XP & Offline Sync
- XP is awarded locally (IndexedDB) immediately after a game
- Sync to Firestore happens when online
- If offline, sync is queued and retried on next `online` event
- Sync failures are silent — no error shown to user

### F8 — Offline / PWA
- App shell (HTML/CSS/JS) is precached by service worker
- App renders from cache when network is unavailable
- `/offline.html` shown for navigation requests when fully offline
- App is installable (meets PWA criteria)

---

## Test Cases & Acceptance Criteria

### TC-01 — Default profile creation
**Given** a user opens the app for the first time
**When** the Home page loads
**Then** a guest profile is auto-created with `name: "Player"`, `avatar: "🎲"`, `xp: 0`, `badges: []`

**Acceptance:** `getProfile()` returns the default object; `saveProfile` is called once with the default shape.

---

### TC-02 — Profile persistence
**Given** a user sets their name to "Ravi" and avatar to "🦁"
**When** they close and reopen the app
**Then** the name and avatar are unchanged (loaded from IndexedDB)

**Acceptance:** `saveProfile({ name, avatar })` writes to idb; `getProfile()` returns the merged record on the next call.

---

### TC-03 — Language toggle (EN → HI)
**Given** the app is in English
**When** the user taps the language toggle
**Then** all visible labels switch to Hindi instantly (e.g. "Create Room" → "कमरा बनाएं")

**Acceptance:** Cypress — after clicking `[aria-label="Toggle language"]`, `cy.contains('कमरा बनाएं')` is visible.

---

### TC-04 — Language toggle (HI → EN)
**Given** the app is in Hindi
**When** the user taps the toggle again
**Then** labels revert to English

**Acceptance:** Toggle cycles `en → hi → en` correctly.

---

### TC-05 — Home page buttons visible
**Given** the app loads at `/`
**When** no interaction has occurred
**Then** "Create Room", "Join Room", and "Profile" buttons are all visible

**Acceptance:** Cypress — all three `[aria-label]` buttons pass `.should('be.visible')`.

---

### TC-06 — Create Room generates valid code
**Given** a host selects "Lucky Number" and taps Start
**When** `createRoom()` is called
**Then** a 4-character uppercase alphanumeric code is returned and the Firestore doc is written with the correct shape (`hostId`, `gameSlug`, `players`, `status: "waiting"`, `state: {}`)

**Acceptance:** Jest — `setDoc` called once; doc contains all required fields; code matches `/^[A-Z0-9]{4}$/`.

---

### TC-07 — Join Room appends player
**Given** a room with code "ABCD" exists
**When** `joinRoom("ABCD", playerId, playerName)` is called
**Then** `updateDoc` is called with `arrayUnion({ id, name })`

**Acceptance:** Jest — `updateDoc` called once with `players: { __arrayUnion: ... }`.

---

### TC-08 — Real-time subscription delivers room data
**Given** `subscribeToRoom(code, callback)` is called
**When** Firestore emits a snapshot
**Then** `callback` is invoked with the room data object

**Acceptance:** Jest — mock `onSnapshot` triggers callback; unsubscribe function is returned.

---

### TC-09 — sendRoomAction updates state
**Given** a room "ABCD" exists
**When** `sendRoomAction("ABCD", { target: 7, guesses: {} })` is called
**Then** `updateDoc` is called with `{ state: { target: 7, guesses: {} } }`

**Acceptance:** Jest — `updateDoc` called with exact state shape.

---

### TC-10 — Lucky Number scoring (exact match)
**Given** a player guesses `7` and the target is `7`
**When** `score(7, 7)` is called
**Then** the result is `100`

**Acceptance:** Unit — `score(7, 7) === 100`.

---

### TC-11 — Lucky Number scoring (near miss)
**Given** a player guesses `5` and the target is `7`
**When** `score(5, 7)` is called
**Then** the result is `40` (`max(0, 50 − 2×5)`)

**Acceptance:** Unit — `score(5, 7) === 40`.

---

### TC-12 — Lucky Number scoring (minimum score)
**Given** a player guesses `1` and the target is `10`
**When** `score(1, 10)` is called
**Then** the result is `5` (`max(0, 50 − 9×5) = 5`; the floor of 0 is never reached within the 1–10 range)

**Acceptance:** Unit — `score(1, 10) === 5`.

---

### TC-13 — XP awarded locally when offline
**Given** the device is offline
**When** `awardXP(50)` is called
**Then** `saveProfile({ xp: 50 })` is called and the new XP total is returned; Firestore is NOT called

**Acceptance:** Jest — `saveProfile` called with incremented XP; `setDoc` not called.

---

### TC-14 — XP sync queued in idb
**Given** `awardXP(100)` is called
**When** the function completes
**Then** a sync entry `{ userId, xp, ts }` is written to the `syncQueue` object store

**Acceptance:** Jest — `mockDB.put('syncQueue', ...)` called with correct shape.

---

### TC-15 — XP syncs when online
**Given** the device comes online
**When** `syncXP()` is called with items in the queue
**Then** `setDoc` is called with the current XP and the queue is cleared

**Acceptance:** Jest — `setDoc` called once; `mockDB.delete` called for each queued item.

---

### TC-16 — Sync failure is silent
**Given** Firestore throws an error during `syncXP()`
**When** the error occurs
**Then** the function resolves without throwing and the queue is NOT cleared (retry on next online event)

**Acceptance:** Jest — `syncXP()` resolves; `mockDB.delete` not called.

---

### TC-17 — Empty sync queue is a no-op
**Given** the sync queue is empty
**When** `syncXP()` is called
**Then** Firestore is not contacted

**Acceptance:** Jest — `setDoc` not called when `getAll` returns `[]`.

---

### TC-18 — Service worker installs and precaches
**Given** the production build is served
**When** the app is opened in Chrome
**Then** the service worker registers, precaches the app shell, and the app loads from cache on second visit with network disabled

**Acceptance:** Lighthouse PWA audit — installable + offline-capable; `dist/sw.js` exists after `npm run build`.

---

### TC-19 — Offline fallback page
**Given** the service worker is active and the device is offline
**When** the user navigates to any route
**Then** `/offline.html` is returned instead of a network error

**Acceptance:** Manual — disable network in DevTools, navigate; offline.html content visible.

---

### TC-20 — Join Room with bad code shows error
**Given** the user enters a code for a non-existent room
**When** they tap "Join Room"
**Then** an error message is shown and no navigation occurs

**Acceptance:** Manual / Cypress — error text visible; URL remains `/`.

---

## Out of Scope (v1)

- User authentication / persistent accounts
- Chat / voice in rooms
- Admin panel or room moderation
- Push notifications
- Analytics

---

## Definition of Done

- [ ] All test cases pass (automated or manual as noted)
- [x] `npm test` → 205/205 Jest tests green (updated 2026-03-01)
- [ ] `npm run build` → exits 0, `dist/sw.js` present
- [ ] Lighthouse PWA score ≥ 90 on mobile preset
- [x] Hindi and English strings complete for all UI labels (save, noBadgesYet, onlineGames, createRoomFailed added 2026-03-01)
- [ ] App renders on Chrome Android (low-end device simulation in DevTools)

## Offline Finalisation Fixes (2026-03-01)

| Fix | Status | Notes |
|-----|--------|-------|
| `public/offline.html` | ✅ Already existed | Friendly offline page for SW fallback |
| ErrorBoundary in PlayOffline | ✅ Done | Catches lazy-load chunk failures |
| Global XP sync (App.jsx) | ✅ Done | `GlobalXPSync` component; runs on all pages |
| Cypress E2E tests rewritten | ✅ Done | Tests current game-grid Home UI |
| Lucky Number Create Room | ✅ Done | Online Games section in Home; calls `createRoom()` |
| Dumb Charades XP + badges | ✅ Already implemented | `GameEndScreen` in ResultScreen.jsx |
| index.html body bg | ✅ Done | Changed `bg-slate-900` → `bg-zinc-950` |
| Profile untranslated strings | ✅ Done | Save / noBadgesYet now use `t()` |
| resolveTitle unit tests | ✅ Done | 8 tests in `src/utils/strings.test.js` |

---

---

# Feature: Dumb Charades (v1)

**Added:** Single-device, fully offline party game. No Firebase. No network required.

## Overview

2–4 teams take turns acting out words (Bollywood movies, actors, objects, animals, professions) while teammates guess. Supports Hindi/English toggle, configurable timer (30/60/90s), two scoring modes, and three input methods.

## Game Architecture

| Layer | File | Responsibility |
|---|---|---|
| State machine | `reducer.js` | Pure reducer — all game logic, zero side effects |
| Word data | `wordpacks.js` | 400 words × 5 categories, tagged by difficulty |
| Scoring | `scoring.js` | `calcRoundScore`, `calcXP`, `findWinners`, `computeBadges` |
| Input | `InputController.js` | Tap / Swipe / Volume key abstraction (custom hook) |
| Timer | `Timer.jsx` | SVG countdown with beep + vibration on end |
| Screens | `SetupScreen`, `CategorySelect`, `SettingsScreen`, `RoundScreen`, `ResultScreen` | Phase-specific UI |
| Top-level | `DumbCharades.jsx` | `useReducer` + phase router |

## State Machine Phases

```
team_setup → category_select → settings_select → round_start → playing → round_end → [round_start | game_end]
```

## Features

### F9 — Team Setup
- Choose 2, 3, or 4 teams
- Custom team names (up to 20 chars each)
- Default names: Team 1 / Team 2

### F10 — Category Selection
- 5 categories: Bollywood Movies 🎬, Bollywood Stars ⭐, Everyday Objects 🏠, Animals 🦁, Professions 👷
- Select one or more; at least one required
- Difficulty toggle: Easy / Medium / Hard
  - Easy: ~25 actable words per category
  - Medium: easy + medium pool (~60 words per category)
  - Hard: all words (~80 words per category)

### F11 — Game Settings
- Timer: 30s / 60s / 90s (default 60s)
- Rounds per team: 1 / 2 / 3 (default 2)
- Scoring mode: Max Words in Time / Fastest Guess
- Input mode: Tap Buttons / Swipe / Volume Keys

### F12 — Round Flow (Max Words in Time)
- Full-screen handover: "Team X ka Turn!" → tap to start
- Countdown timer (SVG ring, colour shifts green→amber→red in last 20s / 10s)
- Beep + vibration pattern on timer end
- Correct: +1 score, vibrate short, green flash, next word
- Pass: no score change, vibrate triple, red flash, next word
- Round ends when timer expires OR words run out (no repeat)

### F13 — Round Flow (Fastest Guess)
- Same UI; per-word timing recorded
- Score = (correct words × 10) + speed bonus (based on average ms per correct word)
- Faster average time = higher bonus

### F14 — Input Modes
- **Tap** (default): two big buttons — PASS (left) / CORRECT (right)
- **Swipe**: swipe right = correct, swipe left = pass (min 60px horizontal delta)
- **Volume keys**: Vol Up = correct, Vol Down = pass (best-effort, keyboard events)

### F15 — Round End & Scoreboard
- Shows words guessed / passed for the acting team
- Running scoreboard for all teams
- Teasing messages: "Arre bhai jaldi!", "Team ne disappoint kar diya 😂", etc.
- "Next Team's Turn →" button → hands device to next team

### F16 — Game End & Badges
- Final ranked leaderboard (medals 🥇🥈🥉)
- Winner announcement or tie message
- Badges awarded:
  - 🎭 MVP Actor — team with most correct words in a single round
  - ⚡ Fastest Round — team with highest score in a single round
  - 🔥 Unstoppable Team — winning team(s)
- XP awarded offline (1 XP per correct word + 5 bonus for winners) via existing `awardXP` service

### F17 — Word Pack (400 words)
- 5 categories × ~80 words each
- Difficulty tagged: easy / medium / hard
- Shuffled uniquely each round; no repeats within a round
- `buildWordQueue(slugs, difficulty)` deduplicates across categories

---

## Test Cases (Dumb Charades)

### TC-21 — shuffleArray returns same elements
**Given** an array of 10 elements
**When** `shuffleArray` is called
**Then** the result has the same elements in the same length, in a (usually) different order

**Acceptance:** Jest — sorted result equals sorted input; multiple calls produce different orderings.

---

### TC-22 — buildWordQueue deduplicates across categories
**Given** two categories are selected
**When** `buildWordQueue` is called
**Then** the returned array contains no duplicate words

**Acceptance:** Jest — `new Set(words).size === words.length`.

---

### TC-23 — Easy pool is smaller than hard pool
**Given** the same single category
**When** `buildWordQueue` is called with 'easy' vs 'hard'
**Then** the hard pool is strictly larger

**Acceptance:** Jest — `hardWords.length > easyWords.length`.

---

### TC-24 — START_ROUND initialises round state
**Given** the game is in settings_select phase
**When** `START_ROUND` is dispatched with a word queue
**Then** phase becomes 'playing', counters reset to 0, word queue is stored

**Acceptance:** Jest — `state.phase === 'playing'`, `roundCorrect === 0`, `wordQueue === payload`.

---

### TC-25 — CORRECT increments score, not pass count
**Given** the game is in playing phase with 5 words
**When** `CORRECT` is dispatched
**Then** `roundCorrect` increases by 1, `roundPassed` stays 0, `currentWordIndex` advances

**Acceptance:** Jest — `roundCorrect === 1`, `roundPassed === 0`, `currentWordIndex === 1`.

---

### TC-26 — PASS increments pass count, not score
**Given** the game is in playing phase
**When** `PASS` is dispatched
**Then** `roundPassed` increases by 1, `roundCorrect` stays 0

**Acceptance:** Jest — `roundPassed === 1`, `roundCorrect === 0`.

---

### TC-27 — CORRECT on last word transitions to round_end
**Given** there is only one word in the queue at index 0
**When** `CORRECT` is dispatched
**Then** phase becomes 'round_end'

**Acceptance:** Jest — `state.phase === 'round_end'`.

---

### TC-28 — TIMER_END forces round_end regardless of word position
**Given** the game is playing with words remaining
**When** `TIMER_END` is dispatched
**Then** phase becomes 'round_end', current score preserved

**Acceptance:** Jest — `state.phase === 'round_end'`, score unchanged.

---

### TC-29 — CONFIRM_ROUND adds score to current team
**Given** team 0 just played with 3 correct words (max_words mode)
**When** `CONFIRM_ROUND` is dispatched
**Then** team 0's score increases by 3

**Acceptance:** Jest — `teams[0].score === 3`.

---

### TC-30 — CONFIRM_ROUND switches to next team
**Given** team 0 just finished their turn
**When** `CONFIRM_ROUND` is dispatched
**Then** `currentTeamIndex` becomes 1, phase is 'round_start'

**Acceptance:** Jest — `currentTeamIndex === 1`, `phase === 'round_start'`.

---

### TC-31 — Game ends after all teams complete all rounds
**Given** 2 teams × 2 rounds = 4 turns; this is turn 4 (roundNumber === 4)
**When** `CONFIRM_ROUND` is dispatched
**Then** phase becomes 'game_end'

**Acceptance:** Jest — `state.phase === 'game_end'`.

---

### TC-32 — RESET returns to initial state
**Given** the game has been played to game_end
**When** `RESET` is dispatched
**Then** all state returns to defaults (phase='team_setup', scores=0, roundNumber=1)

**Acceptance:** Jest — `state.phase === 'team_setup'`, all team scores 0.

---

### TC-33 — Fastest Guess: faster time = higher score
**Given** two rounds with identical correct word count but different average times
**When** `calcRoundScore` is called with 'fastest_guess' mode
**Then** the faster round yields a higher score

**Acceptance:** Jest — `fastScore > slowScore`.

---

### TC-34 — No word repeated within a round
**Given** words are shuffled for a round
**When** the player plays through all words
**Then** no word appears twice in the session

**Acceptance:** Jest — word queue built with `buildWordQueue` + `shuffleArray` has no duplicates (Set size === array length).

---

### TC-35 — Swipe right triggers CORRECT (integration)
**Given** input mode is 'swipe'
**When** a right swipe of ≥ 60px is detected
**Then** `onCorrect` callback fires once

**Acceptance:** Manual / jsdom — simulate `touchstart` + `touchend` with `deltaX = 80`; callback invoked.

---

### TC-36 — Minimum swipe threshold rejects short swipes
**Given** input mode is 'swipe'
**When** a swipe of < 60px is detected
**Then** neither `onCorrect` nor `onPass` fires

**Acceptance:** Manual — simulate `touchend` with `deltaX = 30`; no callback invoked.

---

### TC-37 — Tap buttons visible in tap mode, hidden in swipe mode
**Given** the game is in playing phase
**When** inputMode is 'tap'
**Then** CORRECT and PASS buttons are rendered
**When** inputMode is 'swipe'
**Then** swipe hint text is shown instead of buttons

**Acceptance:** Manual / Cypress.

---

### TC-38 — Hindi strings render correctly
**Given** the language is set to Hindi
**When** the Dumb Charades setup screen is shown
**Then** "कितनी टीमें?" and "आगे →" labels are visible

**Acceptance:** Manual / Cypress — toggle language, check Hindi text in DOM.

---

# Feature: Tez Hisab (v1)

**Added:** Offline-only single-player fast math challenge. No Firebase. No network required.

## Overview

Tez Hisab is a rapid mental math game designed for Indian users. It is fully offline, single-player, and optimized for low-end Android devices. The UI uses large numeric buttons and minimal text to support low literacy levels. Questions are generated dynamically per session to ensure replayability.

## Game Architecture

| Layer | File | Responsibility |
|---|---|---|
| State machine | `reducer.ts` | Pure reducer — deterministic game flow |
| Question logic | `questionGenerator.ts` | Dynamic math question creation |
| Scoring | `scoring.ts` | Score, speed bonus, streak bonus, XP logic |
| Timer | `Timer.tsx` | 8-second countdown per question |
| Screens | `SetupScreen`, `QuestionScreen`, `ResultScreen` | UI per phase |
| Top-level | `TezHisab.tsx` | `useReducer` + phase router |

## State Machine Phases

```
setup → question_show → answer_selected → show_result → next_question → session_end
```

## Features

### F18 — Session Setup
- Player selects difficulty: Easy / Medium / Hard
- Session contains 15 questions
- No repeated question within a session

### F19 — Question Types
- Addition
- Subtraction
- Multiplication
- Division (integer results only)
- Percentage basics
- Short word math problems

### F20 — Question Generation
- Generated dynamically (no static pack)
- Division always produces integer answers
- Options are plausible numeric distractors
- Correct answer randomly positioned
- Generation time < 20ms

### F21 — Timer
- 8-second countdown per question
- Auto advance on timeout
- Accuracy within 100ms of system clock

### F22 — Scoring
- Correct = 10 points
- Speed bonus:
  - <3 sec = +5
  - <5 sec = +3
  - <7 sec = +1
- Streak bonus:
  - 3 correct in a row = +5
- Wrong = 0

XP:
- +2 XP per correct
- +5 XP if 12+ correct in session

### F23 — UX
- Large numeric answer buttons
- Immediate answer lock
- Highlight correct (green) / incorrect (red)
- Hinglish feedback:
  - "Sahi jawab!"
  - "Galat hisaab!"
  - "Tez ho tum!"
  - "Calculator mat bano 😄"

## Test Cases (Tez Hisab)

### TC-39 — Question generator produces valid arithmetic
**Given** `generateQuestion('easy')` is called
**Then** a valid arithmetic question object is returned with 4 options and one correctIndex

**Acceptance:** Unit — question string exists; options length === 4; correctIndex in range.

---

### TC-40 — Division never produces decimals
**Given** a division question is generated
**Then** correct answer is an integer

**Acceptance:** Unit — `Number.isInteger(correctAnswer) === true`.

---

### TC-41 — No repeated question within session
**Given** a 15-question session
**When** all questions are generated
**Then** no two questions are identical

**Acceptance:** Unit — Set size equals array length.

---

### TC-42 — Score calculation correct
**Given** correct answers with varying response times
**When** `calculateScore()` is called
**Then** base + speed + streak bonuses are correctly applied

**Acceptance:** Unit — known input produces expected output.

---

### TC-43 — Streak bonus applied correctly
**Given** 3 consecutive correct answers
**Then** +5 bonus applied once

**Acceptance:** Unit — streak bonus equals 5 for every 3 correct streak.

---

### TC-44 — Timer auto advances
**Given** no answer selected within 8 seconds
**Then** next question loads automatically

**Acceptance:** Integration — phase transitions to next_question.

---

### TC-45 — Session ends after 15 questions
**Given** 15 questions completed
**When** `NEXT_QUESTION` dispatched
**Then** phase becomes 'session_end'

**Acceptance:** Unit — `state.phase === 'session_end'`.

---

### TC-46 — XP awarded offline
**Given** session ends
**When** XP is calculated
**Then** XP is awarded via existing `awardXP` service

**Acceptance:** Jest — awardXP called with correct amount.

---

# Feature: Spot the Jugaad (v1)

**Added:** Offline-only single-player “odd one out” puzzle game. No Firebase. No network required.

## Overview

Spot the Jugaad is a quick puzzle game where the player sees four options (words or images) and must tap the one that does not belong. It is fully offline, single-player, and optimized for low-end devices. The UI uses a 2×2 grid of large cards with words (or optional images). Puzzles are drawn from curated packs with Indianised categories. Items are words or lightweight image identifiers (e.g. image URLs); no emoji/smileys for the puzzle options.

## Game Architecture

| Layer | File | Responsibility |
|-------|------|-----------------|
| State machine | `reducer.js` | Pure reducer — deterministic game flow |
| Puzzle data | `puzzlepacks.js` | 150+ puzzles, getPuzzlesByDifficulty, generateSessionPuzzles |
| Scoring | `scoring.js` | calculatePuzzleScore, calculateSessionXP |
| Timer | `Timer.jsx` | 10-second countdown per puzzle |
| Screens | `SetupScreen`, `PuzzleScreen`, `ResultScreen` | UI per phase |
| Top-level | `SpotTheJugaad.jsx` | useReducer + phase router |

## State Machine Phases

```
setup → puzzle_show → answer_selected → show_result → next_puzzle → session_end
```

## Features

### F24 — Session Setup
- Player selects difficulty: Easy / Medium / Hard
- Session contains 10 puzzles
- No repeated puzzle within a session

### F25 — Puzzle Format
- Each puzzle has exactly 4 items (words or image URLs)
- 3 items share a category, 1 is the odd one out
- Indianised categories: Animals vs Object, Indian Food vs Non-food, Cricket vs random, Bollywood vs non-actor, States vs city, Vehicles India vs foreign, Festivals vs normal day, Professions vs random

### F26 — Puzzle Display
- 2×2 grid of large clickable cards
- Items shown as words (or images if URL)
- Immediate answer lock on tap
- Green = correct, Red = wrong

### F27 — Timer
- 10-second countdown per puzzle
- Auto advance on timeout (TIMEOUT action)
- Accuracy within 100ms of system clock

### F28 — Scoring
- Correct = 10 points
- Speed bonus: <3s = +5, <6s = +3, <9s = +1
- Streak: 3 consecutive correct = +5
- Wrong = 0

XP:
- +2 XP per correct
- +5 XP if session score > 80

### F29 — UX
- Hinglish feedback: "Sahi pakda!", "Galat hai bhai!", "Tez dimaag!", "Dhyaan do 😅"
- Light vibration on correct (if supported)
- Play Again on result screen

## Test Cases (Spot the Jugaad)

- 4 items per puzzle; correctIndex in 0–3; no duplicate puzzles in session (puzzlepacks tests).
- Speed and streak bonus correct; XP logic (totalScore > 80) correct (scoring tests).
- START_SESSION initializes; RECORD_ANSWER updates score; TIMEOUT advances; after 10 puzzles → session_end; XP awarded via awardXP (reducer tests).

## Updated Definition of Done

- [ ] All 38 test cases pass (automated or manual)
- [ ] `npm test` → 57/57 Jest tests green
- [ ] `npm run build` → exits 0
- [ ] Dumb Charades playable offline (no Firebase calls)
- [ ] Timer accurate within 100ms (system clock based)
- [ ] No word repeats within a round (verified by TC-34)
- [ ] Swipe detection works on 6-inch Android (manual)
- [ ] Tez Hisab playable fully offline
- [ ] All Tez Hisab test cases pass (TC-39 to TC-46)
- [ ] No repeated question within session
- [ ] Question generation under 20ms
- [ ] Spot the Jugaad playable fully offline
- [ ] Spot the Jugaad uses words or images (no emoji for puzzle options)
- [ ] No duplicate puzzle within session
- [ ] All Spot the Jugaad tests pass

---

# Feature: Desi Memory Master (v1)

**Added:** Offline single-player pair-matching memory game. No Firebase.

## Overview

Players flip cards to find matching pairs on a themed grid. Fully offline. Supports 3 difficulty levels and multiple Indian-themed card sets (food, festivals, animals, etc.).

## Architecture

| Layer | File | Responsibility |
|---|---|---|
| State machine | `reducer.js` | setup → board_generate → playing → match_check → game_complete |
| Board logic | `boardUtils.js` | Generate shuffled pair grid |
| Themes | `themes.js` | Indian-themed card content sets |
| Persistence | `persistence.js` | localStorage best time + fewest mistakes per difficulty |
| Scoring | `scoring.js` | Time-based score + mistake penalty |
| Screens | `SetupScreen`, `Board`, `Card`, `ResultScreen` | UI per phase |
| Top-level | `DesiMemoryMaster.jsx` | useReducer + side-effect orchestration |

## Features

### F30 — Setup
- Choose difficulty: Easy (4×4 grid, 8 pairs), Medium (4×6 grid, 12 pairs), Hard (6×6 grid, 18 pairs)
- Choose theme: Indian Food, Animals, Festivals, Cricket, Bollywood

### F31 — Gameplay
- Cards face down; tap to flip (max 2 at a time)
- Match found → cards stay revealed; phase momentarily enters match_check → back to playing
- Mismatch → cards flip back after 800ms delay (shown in match_check phase)
- Live elapsed timer (200ms interval)
- Mistake counter

### F32 — Completion
- All pairs matched → game_complete phase
- Final score: time-based (faster = better) minus mistake penalty
- Personal best (time + mistakes) stored per difficulty via persistence.js

### F33 — XP
- +5 XP on completion
- +3 XP bonus for personal best

---

# Feature: Bollywood Emoji Guess (v1)

**Added:** Offline single-player emoji quiz. No Firebase.

## Overview

Player sees emoji clues and must pick the correct Bollywood movie or actor from 4 multiple-choice options. 10 questions per session.

## Architecture

| Layer | File | Responsibility |
|---|---|---|
| State machine | `reducer.js` | setup → question_show → answer_selected → session_end |
| Puzzle data | `puzzlepacks.js` | Curated emoji clue sets by difficulty |
| Scoring | `scoring.js` | Base + speed bonus |
| Screens | `SetupScreen`, `QuestionScreen`, `ResultScreen` | UI per phase |
| Top-level | `BollywoodEmojiGuess.jsx` | useReducer + XP award |

## Features

### F34 — Session Setup
- Difficulty: Easy / Medium / Hard
- 10 questions per session, no repeats

### F35 — Question Format
- Large emoji clue(s) displayed prominently
- 4 multiple-choice answer tiles (tap to select)
- Immediate answer lock on tap
- Green highlight = correct, Red = wrong

### F36 — Timer
- 10-second countdown per question
- Auto-advance on timeout

### F37 — Scoring & XP
- Correct = 10 pts + speed bonus (<3s +5, <5s +3, <7s +1)
- XP: +2 per correct, +5 if score > 80

---

# Feature: Tez Dimaag Challenge / Rapid Fire Quiz (v1)

**Added:** Offline local multi-player turn-based quiz. No Firebase.

**In-game title:** "Tez Dimaag Challenge" (`slug: rapid-fire-quiz`, file: `TezDimaagChallenge.jsx`).

## Overview

2–6 players take turns answering multiple-choice questions from themed categories. Tracks per-player scores across rounds.

## Features

### F38 — Setup
- 2–6 players with custom names
- Select question categories

### F39 — Turn-Based Flow
- Player's turn: device shows question, they tap an option
- Immediate correct/wrong reveal
- Device passed to next player

### F40 — Question Format
- Category-based question packs
- 4 multiple-choice options
- Timer per question

### F41 — Scoring & Result
- Points per correct answer + speed bonus
- Final leaderboard with ranked scores

---

# Feature: A to Z Dhamaka (v1)

**Added:** Offline local multi-player pass-device word game. No Firebase.

## Overview

2–6 players are given a random letter and 4 categories. Each player gets 60 seconds (on their turn with the device) to tap words starting with that letter for each category. Players with unique valid answers score more than those who match others.

## Architecture

| Layer | File | Responsibility |
|---|---|---|
| State machine | `reducer.js` | setup → round_active → reveal → round_end |
| Dictionary | `dictionary.js` | Word database per letter × category; hasWord() validation |
| Scoring | `scoring.js` | Unique = 10, Duplicate = 5, Invalid = 0; bonuses for all-valid / all-unique |
| Timer | `Timer.jsx` | 60s interval-based countdown using Date.now() |
| Screens | `SetupScreen`, `RoundScreen`, `RevealScreen`, `ResultScreen` | UI per phase |
| Top-level | `AtoZDhamaka.jsx` | useReducer + side-effect scoring on reveal |

> **Note:** Source folder is `src/games/categories/` (not `atoz-dhamaka/`).

## Features

### F42 — Setup
- 2–6 players with custom names

### F43 — Round Flow (Pass Device)
- Random letter drawn (A–Z, excluding hard letters)
- Random 4 categories selected from pool of 10
- Each player gets 60s on device to tap word suggestions per category
- Progress indicator shows which player is active (e.g. "Player 2 (2/3)")
- "Done" button to submit early; timer auto-advances on expiry
- Color-coded timer: normal → amber at 20s → red + pulse at 10s

### F44 — Reveal Phase
- All players' answers shown side by side
- Validation: word must start with letter and exist in dictionary
- Color-coded: green = unique valid, yellow = duplicate valid, red = invalid

### F45 — Scoring & XP
- Unique valid answer: 10 pts
- Duplicate valid answer: 5 pts
- Invalid: 0 pts
- Bonus: +5 if all 4 categories valid, +5 if all 4 unique
- XP: +1 per valid word, +3 for round winner

---

# Feature: High Score Tracking (v1)

**Added:** Per-game personal best stored in localStorage.

## Overview

Solo games track the player's all-time high score locally. Displayed on the setup screen before each session and celebrated on the result screen.

## Service

`src/services/highScores.js`

- `getHighScore(slug)` → `number | null`
- `setHighScore(slug, score)` → stores score + ISO date
- `checkAndUpdateHighScore(slug, score)` → `{ isNewRecord, previousBest }`

## Features

### F46 — Personal Best Display
- Setup screen shows "🏆 Personal best: X pts" in accent color (if record exists)
- Result screen shows previous best if not beaten ("Best: X pts")

### F47 — New Record Celebration
- Result screen shows "🎉 New Record!" with amber glow badge + bounce animation
- Applies to: Tez Hisab, Spot the Jugaad, Bollywood Emoji Guess

---

# Feature: Game State Persistence (v1)

**Added:** Pause and resume in-progress games. Fully offline via localStorage.

## Service

`src/services/gameStatePersistence.js`

- `getSavedState(slug)` → `state | null` — load paused game state
- `saveGameState(slug, state, gameTitle)` — persist current game state with timestamp
- `getInProgressGames()` → `[{ slug, gameTitle, savedAt }]` — list all paused games
- `clearSavedState(slug)` — remove entry after game completes or is abandoned
- Storage key: `partybox_game_state` (JSON object keyed by slug)

## Features

### F50 — Pause & Resume
- Any in-progress offline game can be paused (via GameChrome) and resumed later
- State survives app close / browser refresh (stored in localStorage)
- Home screen shows "Continue" chip for any saved game

---

# Feature: GameChrome Component (v1)

**Added:** Consistent in-game shell with pause/home navigation and status bar.

`src/components/GameChrome.jsx`

## Features

### F51 — In-Game Chrome
- Wraps every offline game's phase router
- Top bar shows a single **🏠 Home** button — saves game state then navigates to `/`
- Applies game-specific theme background via `GameThemeContext`
- Also exposes theme switcher and language toggle in the top bar

---

# Feature: Phase Transitions (v1)

**Added:** Subtle CSS animations between game phases.

## Overview

All game screens fade in when a phase changes. Buttons have press feedback. Win moments use a more prominent animation.

## Features

### F48 — Phase Fade-In
- Custom Tailwind keyframe: `fade-in` (opacity 0→1, translateY 6px→0, 0.18s ease-out)
- `FadeIn` wrapper component (`src/components/FadeIn.jsx`) applied to all game phase routers
- `key` prop set to phase name so re-mount triggers animation on phase change
- Gameplay phases (e.g. `question_show`/`answer_selected`) share same key to avoid re-animating within a question

### F49 — Button Press Feedback
- `Button.jsx` base class includes `active:scale-95` (95% scale on press)
- Provides tactile-feel without requiring any additional libraries

---

## Definition of Done (current)

### Automated
- [ ] `npm test` → all Jest tests green (unit + integration across all 8 games)
- [ ] `npm run build` → exits 0, `dist/sw.js` present

### Gameplay
- [ ] All 8 games playable offline (no Firebase required for single-device games)
- [ ] Lucky Number multiplayer flow: create room → join room → play → results
- [ ] Dumb Charades: full round flow, swipe detection, timer accuracy within 100ms
- [ ] Tez Hisab: 15-question session, no repeats, question generation < 20ms
- [ ] Spot the Jugaad: 10-puzzle session, no duplicate puzzles
- [ ] Desi Memory Master: flip/match mechanic, personal best persisted per difficulty
- [ ] Bollywood Emoji Guess: emoji clues display correctly, 10-question session
- [ ] Tez Dimaag Challenge: turn-based quiz, device-passing flow, 2–6 players
- [ ] A to Z Dhamaka: letter draw, 4-category input, reveal scoring, result screen

### UX
- [ ] Tez Hisab, Spot the Jugaad, Bollywood Emoji Guess: personal best on setup screen; "New Record!" on result
- [ ] All game phase transitions animate with fade-in
- [ ] Button presses show `scale-95` tactile feedback
- [ ] Pause/resume works: state survives app close for all offline games
- [ ] Hindi strings complete for all UI labels

### PWA
- [ ] Lighthouse PWA score ≥ 90 on mobile preset
- [ ] App installable; loads from cache when offline
- [ ] App renders on Chrome Android (low-end device simulation in DevTools)

---

# Architecture Patterns

This section documents the shared abstractions used across all offline games. New games must use these patterns.

## Shared Components

### `ResumeGate` (`src/components/ResumeGate.jsx`)
Full-screen overlay shown when a saved game is detected on load.
```jsx
<ResumeGate gameTitle={string} onResume={fn} onNewGame={fn} />
```
Internally uses `useLang` for strings and `useGameTheme` for styling. Replaces the identical local component that was copy-pasted in each game.

### `GameChrome` (`src/components/GameChrome.jsx`)
Top-level wrapper for every offline game. Provides the header bar (Home button, theme switcher, language toggle) and a themed container.
```jsx
<GameChrome slug={slug} gameTitle={gameTitle} state={state}>
  {/* phase router */}
</GameChrome>
```
The **Home button** saves state via `saveGameState` then navigates to `/`. There is no separate Pause button — saving is automatic on exit.

### `FadeIn` (`src/components/FadeIn.jsx`)
Animates children on mount. Set `key` to the phase name to re-trigger on phase change. Gameplay sub-phases (e.g. `question_show`/`answer_selected`) share the same key to avoid re-animating within a question.

## Shared Hooks

### `useGamePersistence(slug, onRestore)` (`src/hooks/useGamePersistence.js`)
Encapsulates save/resume boilerplate. Used by every offline game.
```js
const { showResumeGate, resume, startNew } = useGamePersistence(slug, (saved) => {
  dispatch({ type: ACTIONS.RESTORE_STATE, payload: saved })
})
// Render: if (showResumeGate) return <ResumeGate ... onResume={resume} onNewGame={startNew} />
```

### `useSessionXP({ phase, endPhase, score, slug, computeXP })` (`src/hooks/useSessionXP.js`)
Fires exactly once when `phase === endPhase`. Awards XP, checks high score, clears saved state.
Used by: TezHisab, SpotTheJugaad, BollywoodEmojiGuess.
```js
const { isNewRecord } = useSessionXP({
  phase: state.phase, endPhase: 'session_end',
  score: state.score, slug,
  computeXP: () => calculateSessionXP(...)
})
```

## Shared Utilities

### `resolveTitle(gameTitle, lang)` (`src/utils/strings.js`)
Converts `{ en, hi }` title objects or plain strings to a locale string.
```js
resolveTitle({ en: 'Tez Hisab', hi: 'तेज़ हिसाब' }, 'hi') // → 'तेज़ हिसाब'
resolveTitle('Lucky Number', 'hi')                          // → 'Lucky Number'
```

## Code Splitting

All 8 game components are loaded via `React.lazy()` in `src/games/registry.js`. `PlayOffline` wraps them in `<Suspense>`. Each game is a separate JS chunk — initial bundle does not include any game code.

## Game Component Contract

Every offline game component receives:
```js
{ slug: string, gameTitle: string | { en: string, hi: string } }
```
It is responsible for its own state machine, persistence (via `useGamePersistence`), and XP (via `useSessionXP` or direct `awardXP`). It renders inside `<GameChrome>`.

## Adding a New Offline Game

1. Create `src/games/<slug>/` with: `metadata.js`, `reducer.js`, `scoring.js`, `<GameName>.jsx`, screen components
2. `metadata.js` must export `{ slug, title: { en, hi }, icon, minPlayers, maxPlayers, singleDevice: true, offline: true }`
3. Top-level component uses `useGamePersistence` + `ResumeGate` + `GameChrome`
4. Register in `registry.js` with `React.lazy(() => import('./<slug>/<GameName>.jsx'))`
5. Reducer must handle `RESTORE_STATE` action
