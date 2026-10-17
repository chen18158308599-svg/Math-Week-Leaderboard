# Build Prompt v3: Math Week Main Website (Leaderboard becomes one subsection)

## Context & Scope Change

Per the organiser's latest direction, this project is no longer just a scorekeeping/
leaderboard tool — it becomes **the main website for Math Week**. The leaderboard is
now one of four subpages, not the whole site. This prompt describes what changes and
what's added on top of the existing build (auth, claim flow, card puzzles, admin panel
— all still standing).

This is v3 of the build prompt lineage:
- v2 (`MathWeek_Scorekeeping_BuildPrompt_v2.md`) — original scorekeeping/leaderboard-only scope.
- v3 (this file) — main-website pivot, per the organiser's wireframe
  (`Math Week Website PIc.jpg` / `math_week_website_plc.md`).

**Not in this pass** (per organiser: "we'll add the rest of MMB later"): the full MAT
Stock Market trading system (real data feeds, buy/sell, daily pricing). Subpage 3 is a
placeholder only — see "Subpage 3" below.

## Site Structure

**Main Page** (renamed from "Leaderboard") — the default/idle view, matching the
wireframe:
- Header: "MATH WEEK" wordmark + subtitle, MAT + XMUM logos on the right (assets
  needed from the design team — see "Assets Needed" below), styled to the MAT logo's
  color palette.
- Body: one large active panel (left) + three smaller side cards (right): Digital
  Based, MAT Stock Market, Leaderboard.
- **Auto-rotation**: every 15–30 seconds, the content that's currently in a side card
  swaps into the large panel, cycling through: Large panel → Digital Based → MAT Stock
  Market → Leaderboard → back to large panel. The large panel's own content (poster /
  intro video, see below) is what plays when it's "home" in the rotation.
- **Side cards do double duty**: each shows a live, compact preview (not just a
  static label) — e.g. the Leaderboard card shows the current #1 name + score, the
  Digital Based card shows today's game name. Since this is a touchscreen, tapping a
  card jumps straight to that subpage. Independently, the auto-rotation expands
  whichever card is "up" into its *full* content in the big panel (full top-5
  leaderboard, the actual playable game, etc.) — matches the wireframe's card → panel
  arrows.
- Large panel content: rotates between a daily event poster (MME or committee-based
  activity happening today/tomorrow) and a looping PGVG intro video, plus a
  "Learn More" link/button through to Subpage 1 (Event Directory).
- Footer: sponsor logo slot (left, asset needed) + "Math Week · Oct 19–25, 2026 · XMUM
  Library" (right, already implemented).

**A note before the 4 subpages below**: the organiser's "Embedding" instructions
actually cover two unrelated things, easy to conflate — worth stating plainly so
they're not confused with each other:
- **Code (Card) Based pages** — standalone pages built from the Teams-folder content,
  each reached only by scanning a printed card's own QR code (`/puzzle/<slug>`, as
  already built). **Not part of the 4-item main navigation below, and never
  embedded/iframed anywhere.**
- **The Digital-Based embed template** — a spec handed to CX so their game embeds
  correctly into **Subpage 2** below. This is the only thing that gets embedded.

**Subpage 1 — Event Directory**: a basic guide to what's happening during Math Week
(themes by day-block, floor plan / zone locations, activity list). Content-driven, not
much interactivity — closest existing analog is the "sidebar" content already on the
old kiosk view (today's theme, nearby activities, promo chips); this subpage is the
fuller version of that.

**Subpage 2 — Daily Digital-Based Games**: **this is the actual playable game**, not
just a page describing it — confirmed with the team. This replaces/absorbs the
separate "station" concept from v2: instead of a dedicated unsupervised computer per
digital game, the digital game embeds directly into this subpage of the main site.
Practical implications to build around:
- **Confirmed: there is exactly one physical screen for the whole event.** The
  multi-station concept from v2 is unnecessary — one fixed `stations` row (or none at
  all) covers it. No per-screen picker needed anywhere.
- **Still date-driven scheduling**, same mechanism as v2 (`active_from`/`active_until`
  per game) — this is what picks the one game live "today." Where a theme block lists
  several candidate digital games (e.g. Theme 1's three), spread them across that
  block's individual days (one game per day) rather than trying to show more than one
  at a time — reuses the existing scheduling with zero new logic.
- Still **no login required to play** — win reporting still goes through the same
  `postMessage → parent page → POST /api/games/report-win → claim QR` flow as v2.
  **Confirmed by the organiser: drop the "faster login" idea entirely, keep this
  design exactly as-is.**
- **Embed template for CX**: the games team needs a template/spec so the Digital-Based
  page they design fits this subpage consistently. Provide:
  - Fixed dimensions matching the subpage's game-embed area (confirm exact px once the
    main-page layout is built — the wireframe's large-panel proportions are the
    starting point).
  - Touch-only input, no hover-dependent interactions.
  - On win: `window.parent.postMessage({ type: "mathweek:report-win", gameId: "<id>" },
    "*")` — no auth/session/token handling on their end.
  - After win: show a simple "You won!" message; the host page (this subpage) takes
    over from there (QR display, countdown, return to idle).

**Subpage 3 — MAT Stock Market**: placeholder only for this pass. A simple "Coming
soon" page linked from the Main Page card — no trading logic, no data feeds. Full spec
exists in the event flow plan (page 29–32) for when this gets scoped as its own task.

**Subpage 4 — Leaderboard**: the existing kiosk leaderboard view (individual ranking,
realtime), now reframed as a subpage of the main site rather than its own top-level
destination. Content/behavior unchanged from the current build.

## Questions Module Changes (Card-Based & Digital-Based puzzles)

- **Prompt display**: the screen shows only the short interrogative sentence (e.g.
  "Enter the age.") — never the full question/context text. The full context lives on
  the printed physical card; the screen is deliberately incomplete without it. Where a
  puzzle's `prompt` field currently holds full context, split it: keep a short
  on-screen prompt separate from any longer text (which doesn't need to live in our
  system at all — it's printed on the card, not shown by us).
- **Attempt limit**: 3 attempts per student per puzzle, not unlimited. Wrong answer on
  attempt 3 should lock further tries for that (student, puzzle) pair with a clear
  "out of attempts, ask staff" message, distinct from "wrong, try again" on attempts 1
  and 2. This replaces the earlier unlimited-retries decision — confirmed intentional
  change.

## Anti-Cheat Policy (Clarification, Resolved)

Per the organiser: account hijacking is a solved problem for the *main* event because
Microsoft sign-in is the identity anchor for claiming any points, anywhere. The
remaining ask is just "keep Digital-Based sign-in convenient" — which the existing
design already satisfies (**no sign-in at all is needed to play** a digital game; sign-
in only happens afterward, on the student's own phone, to claim the win). No change
needed here beyond communicating this clearly — see answers.md.

## Location Restriction (Digital-Based)

Genuinely hard to fully enforce (see answers.md for the honest tradeoffs) — flagged as
an open decision, not something to silently build a false sense of security around.

## UI/UX Polish

- Palette must align with the **MAT Logo's colors** — need the actual logo file/brand
  colors from the design team (see "Assets Needed").
- Otherwise keep the existing design language (dark, quiet, understated per the
  original leaderboard direction) unless the organiser's palette pushes it elsewhere.

## Assets Needed From the Team

1. MAT logo + XMUM logo files (for header).
2. Sponsorship logos (for footer) — may not exist yet; footer can ship with the slot
   empty/hidden until they're provided.
3. MAT logo's official brand colors (hex values) or the source logo file to extract
   them from.
4. The Code (Card) Based content sitting in the Presidium Teams folder — needed to
   build out the real printed-card puzzle set (prompts + correct answers) beyond the
   one sample already seeded. **Unrelated to the 4 main subpages** (see "Code (Card)
   Based Pages" below) — **pending**: the organiser will hand this over once the
   website itself is built, so we can generate the real QR set from it. Not blocking
   this build.

## Explicit Assumptions to Confirm (flagged, not silently guessed)

See `answers.md` for the numbered open questions this build is waiting on.
