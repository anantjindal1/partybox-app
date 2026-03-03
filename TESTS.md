# PartyBox – Manual Test & Playbook

This file is for **humans**, not Jest. Use it as a **checklist + feedback log** when you or someone else play‑tests PartyBox.

- **Target devices**: low‑end Android, Chrome/Firefox on desktop
- **Supported modes**: Offline single‑device, Online multiplayer via Firestore
- **How to run locally**:

```bash
npm install
npm run dev
# open http://localhost:5173
```

---

## Run automated playbook (watch each test in the browser)

You can run E2E tests that mirror many of the checks below **one by one in the browser** (no manual clicking).

1. **Start the dev server** (in one terminal):
   ```bash
   npm run dev
   ```
2. **Run the playbook with browser visible** (in another terminal):
   ```bash
   npm run test:playbook
   ```
   **Step-through (one test per click):** Run `npm run test:playbook:step`. Cypress Runner opens; choose E2E, Chrome, open tests-playbook.cy.js, then click "Run all tests". Before every test the run pauses—click "Resume" to run that test. Or use `npx cypress open` and click individual test names in the sidebar to run one at a time.

   **Slower (see each visit/click):** To add a delay after every navigation and click so you can watch the UI, run:
   ```bash
   npm run test:playbook:slow
   ```
   This uses an 800 ms pause after each visit and click. Use a different delay (in ms) with:
   `CYPRESS_SLOW_MO=1200 npm run test:playbook:step`

The automated spec lives in `cypress/e2e/tests-playbook.cy.js` and covers §0 (global smoke), §1 (offline games opening, A to Z flow), §3 (profile), and §5 (regression). Jest unit tests are unchanged: run `npm test` separately.

---

## 0. Global Smoke Checks

**Before testing individual games**, verify the app shell and core systems.

- [ ] App loads at `/` without console errors
- [ ] Language toggle (EN/HI) switches text on Home and at least one game
- [ ] Theme switcher works (if visible in `GameChrome`)
- [ ] Profile page opens and shows avatar, name, XP and level
- [ ] XP value is non‑negative and persists after reload

**Technical:**
- [ ] `npm test` passes locally

**Feedback** (global UX / performance)
- What felt slow or janky on device?
- Any screens confusing in Hindi?
- Any layout breaks on small phones?

---

## 1. Offline Single‑Device Games

Route: click tiles in **Offline** grid on Home, or go to `/play/<slug>`.

Offline games (from PRD):
- `dumb-charades` – Dumb Charades
- `tez-hisab` – Tez Hisab
- `spot-the-jugaad` – Spot the Jugaad
- `desi-memory-master` – Desi Memory Master
- `bollywood-emoji-guess` – Bollywood Emoji Guess
- `rapid-fire-quiz` – Tez Dimaag Challenge
- `categories` – A to Z Dhamaka

For each game, use this template, then see the **game‑specific checklists** below.

### Offline Game Template

- [ ] Game appears in Home under Offline section, with correct title/icon
- [ ] Tapping tile opens game without error
- [ ] Back/Home from `GameChrome` returns to Home and **saves** in‑progress game
- [ ] Relaunching game shows **Resume** gate (if supported) and can resume or start new
- [ ] Hindi language works for major labels and CTAs

**Feedback (per game)**
- Difficulty: too easy / good / too hard?
- Any content clearly non‑Indian or off‑tone?
- Any rules unclear?

---

### 1.1 Dumb Charades (`dumb-charades`)

Scenarios:
- [ ] Start new game with 4 players; confirm player setup flow is clear
- [ ] Timer counts down and auto‑ends a round
- [ ] Swiping / input to mark correct/skip behaves as described in its PRD
- [ ] Scoreboard updates correctly after each round
- [ ] XP is awarded on game end and visible on Profile

**Feedback**
- Are the prompts sufficiently “Bollywood / Desi”?
- Any gesture mis‑taps or confusing controls?

---

### 1.2 Tez Hisab (`tez-hisab`)

Scenarios:
- [ ] Start solo session; arithmetic questions look correct
- [ ] Answering correctly increments score as expected
- [ ] Wrong answer penalties (if any) behave as PRD describes
- [ ] Timer pacing feels fair for low‑end devices

**Feedback**
- Are question difficulties ramping reasonably?
- Any ambiguous or mathematically wrong questions?

---

### 1.3 Spot the Jugaad (`spot-the-jugaad`)

Scenarios:
- [ ] Puzzle images / descriptions load correctly
- [ ] Tapping the “jugaad” solution is clearly indicated
- [ ] Timer / scoring (if present) behaves deterministically

**Feedback**
- Any puzzles too confusing or culturally off?
- Is the objective clear without reading a lot of text?

---

### 1.4 Desi Memory Master (`desi-memory-master`)

Scenarios:
- [ ] Start at default difficulty; grid renders correctly
- [ ] Matching pairs increments score; mismatches counted correctly
- [ ] End‑of‑round screen shows score, time bonus, streak bonuses (per PRD)
- [ ] Restarting game clears previous grid and stats

**Feedback**
- Grid size vs device size: any taps too small?
- Did you experience any lag when flipping cards fast?

---

### 1.5 Bollywood Emoji Guess (`bollywood-emoji-guess`)

Scenarios:
- [ ] Emoji puzzles clearly visible; 4‑option MCQ rendering looks clean
- [ ] Selecting an option locks input and shows immediate feedback
- [ ] Timer (if enabled) counts down and locks question on expiry
- [ ] Result screen shows score, streak/bonus correctly

**Feedback**
- Any movie references too niche or too old?
- Any emoji combinations unclear or misleading?

---

### 1.6 Tez Dimaag Challenge (`rapid-fire-quiz`)

Scenarios:
- [ ] Setup supports 2–6 players; entering names is smooth on mobile keyboard
- [ ] Category selection screen shows available categories
- [ ] 10‑second timer per question (per current implementation) feels accurate
- [ ] Answer selection updates player score, correct count, and response time
- [ ] At 5 questions, round ends and winner is calculated; tiebreakers make sense

**Feedback**
- Are categories and questions India‑relevant?
- Any questions repeated too often in a single session?

---

### 1.7 A to Z Dhamaka (`categories`)

Scenarios:
- [ ] Home tile: title “A to Z Dhamaka” and 🔤 icon
- [ ] Setup: choose 2–6 players, edit names, press Start → game starts with **one random letter** and **4 random categories**
- [ ] Round: for each player, 60‑second countdown runs; assisted mode shows tap‑to‑select suggestions from dictionary
- [ ] Tapping a suggested word fills the answer; visible as “selected answer” for that category
- [ ] After last player’s timer, game moves to Reveal automatically

Reveal & scoring:
- [ ] Reveal screen shows **all players** and their words per category
- [ ] Unique valid words are **green** with text “Unique hai!”
- [ ] Duplicates (same word, same category, different players) are **yellow** with “Sabne same likha 😅”
- [ ] Invalid words (wrong starting letter or not in dictionary) are **red** with “Galat lag raha hai…”
- [ ] Result screen shows sorted scoreboard and a clear winner, plus “One more round” and “New game” actions

Dictionary spot‑checks:
- [ ] Try letters A, B, C and some mid‑alphabet letters (e.g. M, S)
- [ ] For a given letter/category, suggestions start with that letter
- [ ] Trying an obviously invalid word (e.g. wrong letter) is correctly marked red at Reveal

**Feedback**
- Does assisted mode (tap suggestions) make the game feel smooth enough with no typing?
- Any missing obvious Indian words you’d like added (note letter + category + example words)?

---

## 2. Online Multiplayer Games

Online games from PRD:
- `lucky-number`
- `number-chain`
- `rapid-fire-battle`

Pre‑req: Firebase project configured, Firestore enabled, `createRoom` working (see README + PRD).

General room flow checklist (applies to all online games):
- [ ] Tapping an online game on Home opens the **Create Room bottom sheet** (not the room directly)
- [ ] Bottom sheet shows Casual (🎲) and Ranked (🏆 amber) options; Ranked shows XP ×1.2 description
- [ ] Host creates room → sees 4‑letter code and room type badge (🎲 Casual / 🏆 Ranked)
- [ ] Secondary device can join via code; player list updates for both
- [ ] Host in waiting room sees ❌ button on other players (not on self); clicking ❌ removes the player
- [ ] No kick button visible once the game starts (only during waiting phase)
- [ ] When host leaves, room ends or transfers host correctly (per current behavior)
- [ ] Connection overlay appears when one device goes offline
- [ ] Joining a room created >2 hours ago shows a full-screen "Room Expired" error with a Return Home button *(simulate in dev by temporarily lowering the TTL constant in `room.js`)*

**Feedback**
- Any issues with room codes being mis‑read (fonts, similar characters)?
- Any obvious abuse scenarios (e.g. double‑joining, kicking behavior)?

---

### 2.1 Lucky Number (`lucky-number`)

Scenarios:
- [ ] 2–8 players join same room
- [ ] Each round: players pick numbers; host resolves winner per rules
- [ ] Scoreboard persists across rounds until game end
- [ ] Ranked vs Casual: XP is 1.2× in ranked; stats written to Profile (wins/gamesPlayed)
- [ ] After winning, open Profile → Badges section shows 🔢 Lucky Guesser badge

Feedback notes:
- How long does an average game take?
- Any ties or edge cases not handled clearly?

---

### 2.2 Number Chain (`number-chain`)

Scenarios:
- [ ] 2–4 players join; initial chain shown identically on all clients
- [ ] Any player can submit simultaneously (no turn gate); host processes all concurrent submissions ordered by server timestamp
- [ ] Duplicate submissions from the same player within a round are ignored (only the first `createdAt` wins)

Feedback notes:
- Any latency issues on 2G/slow Wi‑Fi causing ordering surprises?
- Is the "anyone can go" mechanic clear enough without a turn indicator?

---

### 2.3 Rapid Fire Battle (`rapid-fire-battle`)

Scenarios (from PLAN/PRD):
- [ ] 2–6 players join a room; host picks category or Random in Setup
- [ ] Each question: 15‑second countdown visible on all clients
- [ ] Players can answer once per question; second taps are ignored
- [ ] After 15 seconds or when all have answered, host shows Reveal with correct answer and per‑player correctness
- [ ] 10 questions per match; then Results phase with leaderboard and XP label (showing ranked bonus in ranked mode)
- [ ] Results banner shows "Room closes in 20s" (Rapid Fire Battle uses `resultsDurationMs: 20000`; Lucky Number and Number Chain auto-close in 10s)

Scoring/tie‑break spot‑check:
- [ ] Correct answers award base + speed bonus (≤5s +5, ≤10s +3, ≤15s +1)
- [ ] Tie‑break: total score → lowest avg response time (no "total correct" step)

Feedback notes:
- Does the timer feel fair on low‑end Android?
- Any questions clearly wrong or outdated?

---

## 3. Cross‑Cutting Systems

### 3.1 Profile & XP

- [ ] First load creates default profile (name, avatar, XP=0)
- [ ] Editing name and avatar on Profile persists after reload
- [ ] Playing any offline game and winning increases XP
- [ ] Playing any ranked room increases XP with 1.2× multiplier and updates per‑game stats
- [ ] Level calculation `floor(xp / 100) + 1` behaves as expected when crossing 100‑XP boundaries
- [ ] After completing a ranked room, Profile → per-game stats card shows incremented Wins and Games Played
- [ ] Offline (no Firestore): per-game stat cards show a skeleton/loading state and do not crash

**Feedback**
- Does the XP gain per game feel meaningful vs spammy?
- Any confusion around levels / progress bar?

### 3.2 Saved Games (Offline Resume)

- [ ] Start an offline game, play partway, hit Home → Resume gate appears on relaunch
- [ ] Resuming restores correct phase, scores, and players
- [ ] Choosing New Game clears previous state

**Feedback**
- Any cases where Resume re‑opens a broken or stale game?

### 3.3 Localization (EN/HI)

- [ ] Home, Room, at least 2 offline games, and 1 online game behave correctly when switching EN ↔ HI mid‑session
- [ ] String truncation: long Hindi labels do not overflow buttons

**Feedback**
- Any mistranslations or awkward phrases?

---

## 4. Tester Feedback Template

For each session or build, copy this block and fill it in:

```markdown
### Test Session
- **Tester**: 
- **Date**: 
- **Build / Commit**: 
- **Device(s)**: (model + OS) 
- **Network**: (offline / 2G / 4G / Wi‑Fi)

#### Summary
- Overall impression (1–2 sentences):

#### Issues Found
- [ ] Issue 1 – _short title_  
  - Steps:  
  - Expected:  
  - Actual:  
  - Severity: (blocker / major / minor)  
  - Game / Screen:  

- [ ] Issue 2 – _short title_  
  - Steps:  
  - Expected:  
  - Actual:  
  - Severity:  
  - Game / Screen:  

#### Suggestions / Nice‑to‑Have
- 

#### Content Feedback (India‑specific)
- Any prompts, math, films, or cricket facts that felt wrong or off‑tone:
- Words you think we should definitely add to **A to Z Dhamaka** (letter + category + examples):
```

---

## 5. Regression Checklist (Quick Pass)

Run this **before each release**:

- [ ] Home loads; offline indicator appears when network disabled
- [ ] Profile opens; XP and Level look sane
- [ ] One offline game (e.g. `desi-memory-master`) can start, play, and finish without error
- [ ] One online game (e.g. `rapid-fire-battle`) can create/join a room and complete a match
- [ ] A to Z Dhamaka: can start game, complete at least one full round, and start another round
- [ ] `npm test` passes
