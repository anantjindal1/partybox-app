# PartyBox Design System — "Ivory & Jewel"

Live canvas (source of truth for visuals): https://claude.ai/code/artifact/6fd47d40-e29f-44df-945b-9347932c35a8

Replaces the previous ad hoc dark-navy/amber Tailwind theme. Light theme is the
default surface; dark theme is a first-class companion using the same hue
family at adjusted values, not a straight color inversion.

## Color tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-bg` | `#FBF3E7` | `#1C0F13` | page background |
| `--color-surface` | `#FFFDF8` | `#2B1A1F` | cards |
| `--color-surface-elevated` | `#FFFFFF` | `#35212A` | modals, sheets |
| `--color-surface-muted` | `#F3E6D3` | `#3A232A` | secondary/hint panels |
| `--color-border` | `#E9D7BE` | `rgba(201,161,90,0.25)` | all borders |
| `--color-text-primary` | `#2B1116` | `#F3E7D9` | headings, primary copy |
| `--color-text-secondary` | `#5B4038` | `#D9C3B0` | secondary copy |
| `--color-text-muted` | `#7A5F58` | `#B79A8A` | captions, meta text |
| `--color-accent-maroon` | `#7A1F2B` (primary CTA) | `#A83A52` (brand mark only) | see rule below |
| `--color-accent-gold` | `#B8873E` | `#C9A15A` | FirstBell / XP / highlight |
| `--color-accent-teal` | `#146A58` | `#2B8A73` | ThinkFast / solo / success |
| `--color-accent-terracotta` | `#A6402F` | `#C2543E` | Dumb Charades / party |
| `--color-error` | `#D64545` | `#E05B4C` | errors, wrong-answer states |

**Rule:** maroon is the primary CTA fill in light theme (bold on ivory) but
drops to brand-mark-only in dark theme (maroon-on-near-black reads muddy) —
gold takes over as the dark-theme primary CTA. Same hue family, different job
per theme; don't force one hex to do both.

**Rule:** each of the three flagship games owns one accent as its identity
color, used consistently for its card border, mode label, and CTA — never
borrow another game's accent (e.g. ThinkFast's streak badge is gold/XP, not
terracotta, even though "streak" feels fire-adjacent).

## Typography

- One display font reserved for big moments only: **Rozha One** (Google
  Fonts, single 400 weight, ~18–20KB — chosen because it's built to pair with
  Devanagari, not decorative for its own sake). Used for hero copy and screen
  titles, 20px+ only. Never for card titles, buttons, or anything read under
  time pressure — a serif display face is slower to scan small.
- Everything else is the system-ui stack — zero additional font weight to
  fetch on 2G beyond that one headline face.
- Type scale: Display/Hero 28/34, Display/Header 20/26 (both Rozha One) ·
  Heading 16/22 (system-ui 700) · Body 14/20 (system-ui 400) · Caption 11/16
  (system-ui 600) · Score/Number (system-ui 800, `font-variant-numeric:
  tabular-nums` — keeps XP counters and timers from jiggling layout on tick).

## Spacing & radius

- Spacing scale (4px base): 4 / 8 / 12 / 16 / 20 / 24 / 32px.
- Radius is intentional, not one blanket value: `sm` 6px (inputs, small tags),
  `md` 10px (buttons), `lg` 14px (cards, sheets), `full` 999px (avatars, seal
  badges, meta pills).
- **Rule:** not everything is a pill. Meta tags (players, time) stay pills.
  Mode/category labels (Solo, Party, Online) use an underlined-tab treatment
  instead — info and classification are different jobs and shouldn't look
  identical.

## Components

Primary button (maroon light / gold dark), secondary/online button (teal
outline), game card (colored border matching the game's accent, not a gray
hairline), tags (pill for meta, underline-tab for mode), score/XP display
(tabular numbers), countdown timer (ring shifts teal → gold → error-red as
time runs low — a status change readable at a glance without reading the
number), room-code input, bottom sheet. All interactive elements are 44px
minimum tap target. Full states (default/hover/pressed/disabled) are on the
Components artboard in the canvas.

## Icons

Inline SVG only, stroke-based, one consistent style per context — never
emoji. The canvas replaces every emoji currently in the codebase (🎉 🔢 🎬 ⚡
🧠 etc.) with a matching line icon.

## Applied screens (proof the system holds up on real content)

Canvas includes the system applied to real app screens, pulled from actual
source (not invented copy): Home (light + dark), ThinkFast question screen,
Dumb Charades acting + turn-result screens, FirstBell lobby + live reveal.

## Engineering handoff (not yet done)

- Translate tokens into `tailwind.config.js` (replaces `surface`, `accent`,
  etc. currently there).
- Self-host/subset Rozha One rather than depending on Google Fonts CDN at
  runtime, to keep the 2G weight budget predictable.
- Replace all emoji usage across components with the icon set established in
  the canvas.
