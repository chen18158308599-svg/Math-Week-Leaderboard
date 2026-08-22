# Build Prompt: Math Week Scorekeeping & Leaderboard Kiosk System

## Context
This is a campus event website for "Math Week," a week-long university event with game
booths (physical and digital) that students participate in to earn points. Points
accumulate into a live leaderboard displayed on a shared monitor/touchscreen at the
library entrance. This is a student-council-run event, not a commercial product —
prioritize simplicity, fast build time, and low/free hosting cost over enterprise-grade
infrastructure.

A separate committee member is independently building 7 digital mini-games (one per
day of the event), which need to be embedded into this system on a rotating daily
schedule. This prompt covers the full system: student accounts, the kiosk display,
game embedding/rotation, the win-to-points claim flow, physical booth handling, and
anti-cheat/admin basics.

## System Overview

The **library monitor is a kiosk** that switches between two states:
- **Idle state (default)**: shows the live leaderboard.
- **Playing state**: shows the embedded digital mini-game scheduled for today (via
  iframe), which anyone walking up can play directly on the touchscreen — no login
  required to start playing.

Login/identity is only needed at the point of **claiming points after a win**, via a
QR-code flow (details below). This keeps the walk-up experience frictionless (matches
the event's "foot-traffic teaser booth" strategy) while still tying points to a real,
unique student account.

## Core User Flow

### A. Digital games (embedded on the library kiosk screen)
1. Kiosk screen is idle, showing the leaderboard.
2. A student walks up and plays the embedded game directly on the touchscreen — no
   login needed to start.
3. On win, the game (built by the partner committee member) calls a simple backend API
   to report the win: `POST /api/games/report-win { game_id: "conway-soldier" }`. The
   game code does NOT need to know about tokens, sessions, or users — it just reports
   "a win happened on this game" and nothing else.
4. Backend generates a **short-lived (~20–30 second), single-use claim token** and tells
   the kiosk to display it as a QR code: `yoursite.com/claim?token=XYZ`.
5. Student scans the QR with their own phone → lands on the site → logs in via campus
   SSO if not already logged in → sets nickname if first time → clicks submit.
6. Backend validates the token (unused, unexpired) → awards points to that student's
   account → marks the token used. If the token is already claimed or expired, show a
   clear "already claimed" or "expired, ask staff" message rather than a generic error.
7. After the claim window passes (or once claimed), the kiosk **automatically returns
   to idle/leaderboard state**, ready for the next player.

### B. Physical/offline booths
- No embedded game/computer at the booth. Student check-in works via a QR code at the
  booth that links into the site, which:
  - Requires the student to be logged in (campus SSO) at that point.
  - Records a check-in/completion tied to their session for that specific booth's game.
- This does not need the "report-win → claim token" flow since there's no digital game
  state to report from — it's a direct authenticated check-in.

## Daily Game Rotation (7 games, one per day) — must NOT require code changes daily

Do not hardcode which game is "live" on which day. Instead, build this as
**date-driven, data-backed scheduling**:

- A `games` table includes an `active_date` field (or `active_from`/`active_until` range)
  per game entry, along with its `embed_url` (the iframe source for that day's game).
- The kiosk's "playing state" logic queries: *find the game where `active_date` matches
  today's date*, and embeds that game's `embed_url`.
- All 7 games (and their embed URLs) can be entered into the system **once, ahead of
  time**, covering all 7 days of the event. After that, the system automatically shows
  the correct game each day with zero manual intervention or redeploys.
- Build a simple admin page to add/edit/reorder these 7 entries (game name, embed URL,
  date, active toggle) so the organizer can adjust the schedule themselves without
  needing a developer, in case a game isn't ready in time or needs to be swapped.

## Auth Requirements
- OAuth login restricted to the university's email domain:
  - Microsoft 365 → Microsoft Entra ID (Azure AD) OAuth, restricted to the tenant/domain.
  - Google Workspace → Google OAuth restricted to the domain (via `hd` parameter or
    server-side domain check).
  - Confirm with stakeholder which provider applies; support both if unsure.
- One account per real student email — no duplicate accounts.
- Nickname set on first login (used for public leaderboard display instead of real
  name/email). Default assumption: nickname is editable later via a simple profile
  page unless told otherwise — confirm with stakeholder.
- Recommended: Supabase Auth or NextAuth.js — both support Microsoft/Google OAuth with
  domain restriction out of the box.

## Data Model (suggested — adjust as needed)
- `users`: id, email, nickname, group_id (nullable, for future group-mode leaderboard),
  created_at
- `groups`: id, name (for future group leaderboard mode — build the column now even if
  unused initially)
- `games`: id, name, type (`digital` | `physical`), points_value, embed_url (for
  digital games), active_date (or active_from/active_until), is_active
- `claim_tokens`: id, game_id, token, created_at, expires_at, used_at (nullable),
  claimed_by_user_id (nullable until claimed)
- `submissions`: id, user_id, game_id, points_awarded, source (`claim_token` |
  `qr_checkin`), created_at — enforce **UNIQUE (user_id, game_id)** to guarantee one
  scored submission per student per game (prevents re-farming the same game multiple
  times, including via repeated QR claims on the same day)

## API Endpoints (suggested)
- `POST /api/auth/*` — handled by chosen auth library
- `POST /api/profile/nickname` — set/update nickname
- `GET /api/games/today` — returns today's active digital game (embed URL) based on
  current date, for the kiosk to render
- `POST /api/games/report-win` — called by the partner's embedded game on a win;
  input: `{ game_id }`; generates and returns a claim token; no user identity required
  at this step
- `GET /api/claim/:token` — claim landing page/endpoint; requires login; on submit,
  validates token (exists, unexpired, unused) and the UNIQUE (user_id, game_id)
  constraint, then awards points and marks token used
- `POST /api/booth/checkin` — for physical booths; requires login; records a
  submission tied to the authenticated user and the booth's game_id
- `GET /api/leaderboard?mode=individual|group&limit=10` — returns ranked list of
  nickname (or group name) + total points
- Real-time: use Supabase Realtime, Firebase, or WebSockets/SSE so the leaderboard
  updates live without manual refresh; polling every 5–10s is an acceptable fallback.

## Kiosk Display Behavior
- Default/idle view: live leaderboard, top 5–10 students (or groups, if group mode is
  toggled on), updating in near-real-time as real submissions come in.
- No fake/simulated activity — only real submissions should trigger any visual update.
  Keep the leaderboard understated (this is a quiet monitor at a library entrance, not
  a hype screen) — smooth number/rank-change animation is enough; no toasts, sound
  effects, or synthetic "someone just scored" messages for events that didn't happen.
- On a reported win, kiosk switches to a win/QR screen showing the claim QR code for
  ~20–30 seconds (or until claimed), then automatically returns to idle/leaderboard.
- Support a `mode` toggle (individual vs group) even if group mode isn't populated yet
  — build the leaderboard query and UI to accept both from day one.

## Anti-Cheat / Integrity Notes
- Claim tokens are single-use and short-lived (~20–30 seconds) to limit the window in
  which someone other than the actual player could photograph and scan the QR code.
- One scored submission per (user, game) enforced at the database level — prevents
  farming points by replaying the same game multiple times in a day.
- Full real-time prevention of "someone else scans a QR before the actual player does"
  is out of scope and accepted as a reasonable limitation for a casual event — mitigate
  via the short token lifetime above, not by adding heavier verification.
- Build a simple admin-facing audit view: a sortable/filterable table of all
  submissions (timestamp, user, game, source) so committee members can manually review
  and flag/disqualify outliers before final prizes are awarded. This does not need to
  be automated — a plain table is sufficient.

## Requirements to Share With the Partner Building the 7 Digital Games
Forward this list directly to the committee member building the games:

1. **Format**: must be a **web-based game** (any frontend framework is fine — plain
   HTML/JS, React, Vue — as long as it runs at a URL in a browser). No native apps or
   installs; must run directly in-browser on the library's screen.
2. **Input**: must be fully **touch-compatible** (the library screen is a touchscreen)
   — no reliance on hover states or keyboard-only interactions.
3. **Sizing**: fixed **landscape** layout matching the kiosk screen's resolution
   (confirm exact resolution once known, e.g. 1920×1080). No mobile responsiveness
   needed — this is designed for one specific large screen only.
4. **Reporting a win**: on win, the game calls one simple API:
   `POST /api/games/report-win { game_id: "<assigned id>" }` — no user/session/token
   handling needed on their end at all; the games system handles everything after
   the win is reported.
5. **After win**: show a simple "You won!" message; the games system (not their game)
   handles displaying the QR code and returning the kiosk to the leaderboard — they
   don't need to build any redirect/timeout logic themselves.
6. **Needed from them ahead of time**: an `embed_url` per game (7 total) and each
   game's expected play duration (so an optional timeout/session limit can be set if
   needed), so the organizer can enter these into the schedule before the event.

## Admin Panel (basic)
- Simple authenticated area (restrict by email allowlist, or a role flag on `users`)
  for committee members to:
  - Add/edit/deactivate games, including setting each digital game's `embed_url` and
    `active_date` for the 7-day rotation.
  - View submissions and flag/delete suspicious ones (integrity audit table).
  - View/export leaderboard data.
- Keep this minimal — a basic CRUD UI is sufficient; this is not the priority feature.

## Explicit Assumptions to Confirm With Stakeholder (flag these, don't silently guess)
1. Which SSO provider applies (Microsoft 365 vs Google Workspace) for student emails.
2. Whether nicknames are editable after first set.
3. Data retention: how long to keep student email/participation data after the event.
4. Who needs admin panel access (just the organizer, or multiple committee members).
5. Exact resolution/specs of the library kiosk screen, and whether it's touch-enabled
   (confirmed: yes, touch — but exact model/resolution still TBD).
6. Claim token lifetime — 20–30 seconds is the working assumption; confirm this is
   short enough to feel secure but long enough for a real student to comfortably scan
   in practice (test on-site if possible).

## Tech Stack Recommendation (adjust if stakeholder has a preference)
- Frontend: Next.js (React) — supports the student-facing app, the kiosk display, and
  the admin panel as separate routes within one project.
- Backend/DB/Auth/Realtime: Supabase (Postgres + Auth with OAuth providers + Realtime
  subscriptions) — minimizes moving parts for a small team on a deadline.
- Hosting: Vercel (frontend) + Supabase (backend) — both have free tiers suitable for
  a one-week campus event's scale.

## Deliverable
A working web app covering: SSO login restricted to campus domain, nickname setup, a
kiosk display that toggles between an idle leaderboard and an embedded daily digital
game (auto-rotating by date with no code changes needed), a report-win → QR claim →
login/submit → points-awarded flow, physical booth check-in via authenticated QR scan,
one-submission-per-game enforcement at the database level, a real-time (or
near-real-time) public leaderboard suitable for kiosk display, and a minimal admin
panel for managing the 7-day game schedule and reviewing submissions for integrity
issues.
