# PartyBox — Game Backlog

New game mode concepts. Names + one-line descriptions only — no design/spec yet;
each gets its own detailed build prompt before implementation.

Built on the existing multiplayer engine (event-passing + room state) — not new
infrastructure, except where flagged.

All 17 concepts are kept — nothing cut. Priority waves below reflect build order,
not a keep/cut decision.

## HIGH PRIORITY — card-game UX gaps (raised 2026-09-10, before continuing Wave 3)

Affects every shipped card game (Bluff, Bhabhi, Call Break) and every
future one. Evaluated below; not yet implemented.

- **A. Hand sorting** — hands currently render in raw shuffle order
  (`sortHand()` exists in `src/multiplayer/hand.js` but is never called by
  any game). Bluff needs a NEW rank-primary sort (group same-rank cards
  together, ranks increasing) — `sortHand()`'s existing suit-primary sort
  is wrong for it. Bhabhi/Call Break (and future trick games) want
  `sortHand()`'s existing suit-grouped, rank-increasing-within-suit order
  — just needs to actually be called.
- **B. Highlight important cards** (e.g. trump) — no highlight concept
  exists on `CardTable`/`PlayingCard` today (only `selectedCardIds`
  offset and `disabledCardIds` dimming). Needs a new generic
  `highlightedCardIds` prop, e.g. a yellow glow ring.
- **C. Card-game tutorials** — written rules on the waiting screen, a
  "How to Play" 2-3 slide tutorial modal, auto-dismissing if the game
  actually starts while it's open. Currently zero rules text or tutorial
  content exists anywhere in any game. Biggest of the four — needs a
  reusable modal/carousel component plus real written content per game.
- **D. Even card distribution** — `dealUneven()` (used by Bluff and
  Bhabhi) deliberately deals the WHOLE deck round-robin even when it
  doesn't divide evenly (some players get one extra card). New
  requirement: everyone gets the SAME number of cards; if the deck
  doesn't divide evenly, the leftover cards are simply not dealt at all
  (removed from play for that hand/round), not distributed unevenly.
  This reverses a deliberate Wave-2 design decision — `dealCards()`
  already supports this exactly (deal `Math.floor(52/players)` each,
  ignore `remaining`), so the fix is smaller than it sounds, but it
  changes two already-shipped games' behavior.

## Priority waves

**Wave 1 — no new infra, build first: ✅ COMPLETE (2026-09-09)**
- ✅ Raja Mantri Chor Sipahi — online, plum accent
- ✅ Sabse Zyada Kaun — dual-mode (offline + online), rose accent
- ✅ Tambola (Housie) — online, sapphire accent
- ✅ Bhed (Jasoos) — online, emerald accent

**Wave 2 — infra ✅ DONE (2026-09-09):**
- Shared card-dealing engine + card-table UI built (`src/multiplayer/{deck,deal,hand,trick}.js`, `src/components/cards/`) — see the shared dependency epic below.
- ✅ Bluff — online, indigo accent (2026-09-09). First real game built on the engine — proved it out, one small generic addition to `CardTable` (`centerSlot` prop) along the way.
- ✅ Bakwaas (renamed from "Kahani Judge") — online, fuchsia accent (2026-09-09). Fill-a-prompt's-blank + anonymous room voting, extending Sabse Zyada Kaun's prompt/tag/voting pattern with a new free-text answering phase.
- Wave 2 complete.

**Wave 3 — trick-taking depth, once the engine is proven:**
- ✅ Call Break — online, turquoise accent (2026-09-10). Exactly 4 players, spades always trump, 5-round bidding game. First real test of `dealCards()` (exact 13-per-player split) and `resolveTrick()`'s trump branch. Cumulative scores can go negative, which required deliberately diverging from Bakwaas's tie-handling/XP pattern rather than copying it verbatim.
- Judgement (Kachuful)
- Court Piece (Rang)
- ✅ Bhabhi — online, slate accent (2026-09-09). First real trick-taking game — first exercise of `resolveTrick()`, first no-trump caller. Sudden-death win condition (first to empty hand wins immediately) made this simpler than a classic scored trick game. Promoted Bluff's `dealUneven` into the shared engine; added `getLegalPlays()` and `CardTable`'s `disabledCardIds` prop, both reusable by the remaining Wave 3 games.
- Satti (Sevens)

**Post-Wave-3 — full regression pass:**
- Once all 5 Wave 3 games are shipped, spawn multiple agents in parallel to
  comprehensively test every game in the app (Wave 1 + Wave 2 + Wave 3, plus
  anything in the "for review" list) for regressions and bugs before moving
  on to any unscheduled backlog item.

**Unscheduled — kept in backlog, no wave assigned yet:**
- Bakwaas Adaalat
- Chugli Detective
- Donkey (Gadha)
- 3-2-5 (Teen Do Paanch)
- Mendikot (Mindi)
- Codenames

## Party / social (reuse existing vote-tally + event engine)

1. ✅ **Sabse Zyada Kaun** — Room votes which player best fits a cheeky superlative; match the majority to score.
2. ✅ **Bhed (Jasoos)** — Everyone gets a secret word except one hidden outsider; players say related words aloud, then vote to find the Bhed.
3. **Bakwaas Adaalat** — Two players argue a ridiculous case ~30s each; the room votes the winner.
4. ✅ **Bakwaas** (formerly "Kahani Judge") — Fill a prompt's blank with a funny short answer; room votes the best (typing).
5. **Chugli Detective** — Everyone submits an anonymous "I once…" confession; room guesses who wrote each.
6. ✅ **Raja Mantri Chor Sipahi** — Phone secretly deals the four+ roles; Mantri guesses the Chor to protect the points.

## Card games (need a new card-dealing / trick-tracking layer — shared dependency, see epic below)

7. ✅ **Bluff** — Play cards face-down claiming a rank; anyone can call "Bluff!" and the phone reveals (round-based: one player fixes a rank per round, others pass/add-more/challenge the latest addition only; three ways a round ends, each opening the next round with a different player).
8. **Satti (Sevens)** — Build sequences up/down from the 7 in each suit; first to empty their hand wins.
9. **Donkey (Gadha)** — Pass cards to collect four of a kind; last to react is the donkey.
10. **3-2-5 (Teen Do Paanch)** — Three-player trick game; each must win an exact target of tricks.
11. ✅ **Bhabhi (Get Away)** — Sudden-death shedding game; follow suit or dump, first to empty your hand wins immediately.
12. **Mendikot (Mindi)** — Four-player partnership trick game; capture the four 10s.
13. **Court Piece (Coatpees / Rang)** — Four-player fixed-partnership trick game; caller picks trump, race to seven tricks.
14. **Judgement (Kachuful)** — Bid exactly how many tricks you'll win each round; score only if you hit it.
15. ✅ **Call Break** — Thirteen-card spades-style trick game with per-round bidding.

## Other

16. ✅ **Tambola (Housie)** — Indian bingo; phone generates tickets, host calls numbers, players self-claim and the host manually approves each prize (built as host-verified, not auto-verified — keeps the real "shout it out" tension of the original game).
17. **Codenames** — Team spymaster gives one-word clues linking grid words; teams guess their own, avoid the assassin. (Literate audience.)

## Shared dependency epic

- ✅ **Card-dealing / trick-tracking engine** — DONE (2026-09-09). Shared shuffle/deal/trick-resolution layer required by games 7–15, plus a reusable card-table UI (opponent seats with face-down stacks, own hand fanned face-up, center play zone, score bar). `src/multiplayer/{deck,deal,hand,trick}.js` + `src/components/cards/`. Proven out by Bluff — `resolveTrick()` itself remains unexercised by a real game until the first Wave 3 trick-taking game.
