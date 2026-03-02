# PartyBox — Multiplayer Expansion Plan (v2.0)

---

## ✅ Week 1 — Multiplayer Engine Foundation (COMPLETED)

- [x] Flat action schema: `{ playerId, type, payload, createdAt: serverTimestamp() }`
- [x] `roomType: 'casual' | 'ranked'` in room doc + `createRoom()` API
- [x] `src/multiplayer/turnManager.js` — pure turn sequencing utility
- [x] `src/multiplayer/speedLockResolver.js` — pure speed-round winner resolver
- [x] `src/services/stats.js` — `writeGameStats()` to `/profiles/{id}/stats/{slug}`
- [x] `src/services/xp.js` — 1.2× ranked multiplier
- [x] `src/components/CreateRoomSheet.jsx` — Casual / Ranked picker bottom sheet
- [x] `src/components/ReactionBar.jsx` — stub (Week 3)
- [x] `firestore.rules` — trust-based rules
- [x] Lucky Number + Number Chain refactored to new schema + phase lifecycle
- [x] Room.jsx: results countdown, room type badge, ReactionBar stub
- [x] 266 tests passing across 30 suites

---

## 🚀 Week 2 — Rapid Fire Battle (Online)

### Game Design (LOCKED)

| Property | Value |
|----------|-------|
| Players | 2–6 (host plays too) |
| Questions | 10 per match |
| Timer | 15s per question (hybrid: client shows countdown, host cuts off by serverTimestamp) |
| Format | 4-option MCQ `{ question, options:[x4], correctIdx, category }` |
| Categories | GK (India), Bollywood, Cricket, Science — ~37–38 questions each |
| Source | Reuse rapid-fire-quiz packs + add `category` field retroactively |
| Reveal | 3s — correct answer + who got it right + points earned this round |
| Results | 20s auto-close (via `resultsDurationMs: 20000` in metadata.js) |

### Scoring
```
Correct answer = 10 pts
Speed bonus (correct only, based on createdAt − questionStartedAt):
  ≤ 5s  → +5
  ≤ 10s → +3
  ≤ 15s → +1
  else  → +0
```

### Tie-break
1. Total score → 2. Total correct → 3. Lowest avg response time → 4. Shared winner

### Timer / Round Flow
- Host writes `{ phase: 'question', currentQuestion: {...}, questionStartedAt: serverTimestamp(), questionIdx: N }` to room.state
- **Round closes when:** `actions.length === players.length` (early) OR local 15s setTimeout fires
- Host filters: only process actions where `action.createdAt.seconds − questionStartedAt.seconds ≤ 15`
- Duplicate prevention: UI locks after tap + host deduplicates by playerId (first action wins)
- After scoring, host writes `{ phase: 'reveal', scores: {...}, roundScores: {...} }` — 3s client timer → host advances
- After Q10, host writes `{ phase: 'results', totalScores: {...} }`

### Phase Sequence
```
waiting → setup → question → reveal → question → … (×10) → results
```

### Ranked Rules
- XP × 1.2 (existing `awardXP` multiplier)
- Winner (highest score) → `wins++`
- All players → `gamesPlayed++`
- Written via `writeGameStats('rapid-fire-battle', { won, gamesPlayed: 1 })`

### speedLockResolver
**Not used** for Rapid Fire — all players scored independently. Reserved for future buzzer-style games.

### Content Pack Schema
```json
{
  "id": "rfq_001",
  "question": "Who won the 2023 ICC Cricket World Cup?",
  "options": ["India", "Australia", "England", "Pakistan"],
  "correctIdx": 1,
  "category": "cricket"
}
```
Categories: `"gk"` | `"bollywood"` | `"cricket"` | `"science"`

> **Note (as-built):** Questions are bundled in `src/games/rapid-fire-battle/questions.js` (~38 per category). Existing `rapid-fire-quiz` packs were NOT enriched — Rapid Fire Battle maintains its own independent question bank.

### Analytics (Firebase Analytics — needs setup)
- Add `getAnalytics()` to `src/firebase.js`
- Create `src/services/analytics.js` → `trackEvent(name, params)` wrapper
- Events to fire: `room_created`, `question_answered`, `match_completed`

### Implementation Tasks
- [x] Add `getAnalytics()` to `src/firebase.js`; create `src/services/analytics.js`
- [x] Question bank built as standalone `src/games/rapid-fire-battle/questions.js` (~38 q/category) — did NOT enrich existing rapid-fire-quiz packs
- [x] Create `src/games/rapid-fire-battle/metadata.js` (slug, resultsDurationMs: 20000)
- [x] Room.jsx: read `game?.resultsDurationMs ?? 10000` instead of hardcoded 10s
- [x] `SetupScreen` — host picks category (or Random), starts game
- [x] `QuestionScreen` — shows question + 4 options + client-side countdown; locks after tap
- [x] `RevealScreen` — 3s auto-advance; shows correct answer, ✅/❌ per player, round points
- [x] `ResultScreen` — leaderboard, total scores, XP gained (ranked bonus label)
- [x] Host action-processing: `useEffect([actions])` — dedup by playerId, score by serverTimestamp delta, auto-advance via setTimeout
- [x] `awardXP` + `writeGameStats` in `useEffect([roomState.phase])` when phase==='results'
- [x] Unit tests: scoring logic, speed bonus calculation, host cutoff logic
- [ ] Closed beta: 20–50 users

---

## 🏆 Week 2.5 — Ranked Visibility Layer

### Level Formula
```js
level = Math.floor(profile.xp / 100) + 1
```

### Profile Page Additions
- [x] XP progress bar (`xp % 100` fill, `Level N` label) — reads from IDB (always available)
- [x] Overall Level badge
- [x] Per-game stat cards: wins + gamesPlayed fetched async from Firestore `/profiles/{id}/stats/{slug}` (online only; skeleton shown when offline/loading)

### Room UI Additions
- [ ] "Lvl N" badge next to each player name in Room.jsx player list — **deferred to Week 4** (XP not stored in room.players)
- [ ] Results screen: "+X XP" label; if ranked, show "(Ranked Bonus! ×1.2)"
- [ ] Light XP counter animation (CSS transition on number)

---

## 🎉 Week 3 — Vote & Roast + Emoji Reactions

### Vote & Roast Game Design
**Loop:**
1. Host (or auto) selects a roast prompt — e.g. "Who in this group would be last to survive a jungle?"
2. Each player secretly votes for another player (not themselves) — via `sendAction({ type: 'VOTE', payload: { votedFor: playerId } })`
3. Host collects all votes → writes `state.votes = { p1: 'p3', p2: 'p1', ... }` in one `setState` call → triggers reveal simultaneously on all clients
4. Most-voted player is "roasted" — shown prominently
5. New round — new prompt

**Firestore flow:** actions subcollection → host aggregates → single `setState({ votes, phase: 'reveal' })`

**Content:** Indianised prompts; casual + ranked support

### ReactionBar (Full Implementation)
- [ ] Subscribe to `/rooms/{code}/reactions` via `onSnapshot`
- [ ] Each player sends `{ emoji, createdAt: serverTimestamp() }` to their reactions doc
- [ ] Client-side rate limit: 1 reaction per 3 seconds
- [ ] Auto-expire client-side after 5 seconds (filter by `Date.now() - reaction.createdAt.toMillis() < 5000`)
- [ ] Max 3 visible floating reactions at once

### Tasks
- [ ] Build Vote & Roast game (`src/games/vote-and-roast/`)
- [ ] Full ReactionBar implementation
- [ ] Sound cues for reveal
- [ ] Performance profiling on low-end Android

---

## 🧠 Week 4 — Stability + Judgement Card Game

### Stability
- [ ] Load testing with simulated rooms
- [ ] Firestore write estimation validation (~50–60 writes per Rapid Fire room)
- [ ] Billing alert thresholds configured
- [ ] Sentry integration (basic error capture)

### Judgement (Card Game)
- [ ] Private hand logic via `state.private[playerId]`
- [ ] Turn-based flow using `turnManager`
- [ ] Trick resolution logic
- [ ] Casual + Ranked support

---

## 📊 Cost Safeguards

| Control | Detail |
|---------|--------|
| Room TTL | 2h auto-expiry (existing) |
| Rapid Fire writes | ~50–60 per room (4 players × 10 rounds × actions + state updates) |
| Batch clear | `clearActions()` after each question |
| Billing alert | Configure in Firebase Console before beta |

---

## 🧪 Beta & Rollout Plan

**Phase 1 — Closed Beta** (Week 2 end)
- 20–50 invited users
- Monitor: Firestore reads/writes, DAU, crash rate

**Phase 2 — Gradual Exposure**
- 10% → 25% → 50% → 100%
- Rollback: feature flag to disable online mode

---

## 📈 KPIs (Track Weekly)

- DAU / WAU
- Rooms created per day, avg players per room
- Avg session length (target > 6 min)
- D1 / D7 retention
- Firestore reads/writes per session

---

## 🔮 3-Month Roadmap

| Milestone | Target |
|-----------|--------|
| End Month 1 | Rapid Fire Battle + Vote & Roast live |
| End Month 2 | Judgement + Word War live |
| End Month 3 | Bluff Raja + 3-2-5 + Mini Grid + Rapid Logic Duel |

---

## 🎯 Immediate Next Steps

1. Add Firebase Analytics + `trackEvent` wrapper
2. Enrich question packs with `category` field
3. Build Rapid Fire Battle skeleton (SetupScreen → QuestionScreen → RevealScreen → ResultScreen)
4. Make Room.jsx results duration configurable via `metadata.resultsDurationMs`
5. Ranked Visibility UI (Profile page + Room player level badges)
6. Run closed beta

---

## Game Release Checklist (per title)

- [ ] PRD.md updated
- [ ] Game metadata + content pack validated
- [ ] Unit tests: reducer, scoring, phase transitions
- [ ] Integration tests: full room lifecycle
- [ ] Manual QA: deterministic resolution, no dupes, offline fallback unaffected
- [ ] Beta tested ≥ 25 users
- [ ] Firestore cost estimated
- [ ] Analytics events wired

---

## Architecture Principles

- **Host-authoritative:** only host writes `room.state`; clients write to `actions/{playerId}`
- **Phase lifecycle:** host drives phase via room.state; Room.jsx watches `phase === 'results'` for auto-close; clients watch phase for XP/stats
- **Timer pattern (Rapid Fire):** client renders local countdown; host uses serverTimestamp delta to enforce cutoff
- **Ranked vs Casual:** Ranked → XP ×1.2 + `writeGameStats()`; Casual → XP only
- **Results duration:** declared in `metadata.resultsDurationMs`; Room.jsx reads `game?.resultsDurationMs ?? 10000`
- **Stats display:** XP + Level from IDB (always); wins/gamesPlayed from Firestore async (online only)
- **Trust model:** no Firebase Auth; device UUID identity; tighten rules before public beta

Owner: You | Version: v2.0
