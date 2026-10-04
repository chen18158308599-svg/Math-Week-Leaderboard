# Digital-Based Game Embed Spec (for CX)

Handoff spec so the Digital-Based game CX builds drops straight into Subpage 2
(`/games`) and the main hub's rotating panel with no changes on our end. See
`website_prompt.md`'s "Subpage 2 — Daily Digital-Based Games" for the surrounding
context; this file is just the concrete, buildable version of that section.

**Don't build from this doc alone — start from `digital_game_embed_template/index.html`.**
It's a working, runnable shell that already implements everything below (responsive
sizing, touch targets, the exact win-signal call) — copy it once per game rather than
re-implementing this spec from scratch each time. This keeps all 7 games consistent
even if different people (or an AI code generator) build each one.

## What to build — the 7 games

One live game per day across the event week (Oct 19–25, 2026), per `eventflow.md`'s
theme blocks. Names/descriptions below are from that plan — confirm final gameplay
rules with the organiser, this is the starting brief, not a locked spec:

| Day | Game | What it is |
|---|---|---|
| Mon Oct 19 | **Number Sequence Rush** (a.k.a. "Pattern Sequence" in early planning notes) | Player identifies the pattern in a sequence and predicts the next element. Tests logical reasoning / pattern recognition. |
| Tue Oct 20 | **Guess 2/3 of the Average** | Player picks a number, trying to land on two-thirds of the average of everyone's submissions. Classic game-theory demo. |
| Wed Oct 21 | **Deal or No Deal** | Player accepts an offer or keeps going based on remaining possible rewards. Introduces probability, expected value, risk. |
| Thu Oct 22 | **Conway Infinite Loop Challenge** | Player interacts with Conway's Game of Life and tries to set up an initial configuration that becomes a repeating or stable pattern. |
| Fri Oct 23 | **Escape Chase** ("Think Like KNN!") | Player selects the K nearest data points and predicts a class by majority vote; how well they do determines how far a character escapes. |
| Sat Oct 24 | **Symmetry Challenge** | Visual symmetry/reflection puzzles — identify or reconstruct the mirrored pattern. |
| Sun Oct 25 | **Planarity Challenge** | Player drags graph vertices around so no edges cross — a hands-on intro to planar graphs. |

Each is a standalone single-player game, playable start-to-finish by one person in a
couple of minutes — not a multi-round or multiplayer format, since only one win per
(student, game) ever scores (see "Win signal" below).

## What to hand back

One publicly reachable **HTTPS URL per game** — that's the entire deliverable. It
gets pasted directly into our admin panel's `embed_url` field for that game; nothing
else changes on our end.

- **You host it, we just link to it.** Simplest for both sides — a static site on
  Vercel/Netlify/GitHub Pages or similar is fine. We don't need source files, a repo,
  or a build handoff unless something breaks and we need to debug it together.
- **Must allow being framed.** No `X-Frame-Options: DENY/SAMEORIGIN` or restrictive
  `Content-Security-Policy: frame-ancestors` — we load it in an `<iframe>` from our
  domain, so the response headers need to permit that (most static hosts default to
  allowing this; just don't add a stricter policy on top).
- **No login wall, no paywall, no "click to start" splash that needs anything besides
  a tap** — the game needs to be immediately playable the moment the iframe loads.
- **Stays live for the whole event week** (through Oct 25, 2026) — don't tear it down
  or let a free-tier deployment expire mid-week.
- If hosting it yourselves isn't workable, tell us and we'll host a static build you
  hand over instead — just flag it rather than assuming, since it changes who owns
  deploying updates during the event.

## How it's hosted

Your game is loaded in an `<iframe>` we control, on two screens:

1. **`/games`** — the full subpage. Your iframe gets the full viewport minus a thin
   header bar (~60px). Effectively full-bleed.
2. **The main hub's rotating panel** — a smaller embedded view inside a rounded card,
   roughly **960×640 and up**, always at least a 3:2 aspect ratio. Design for this as
   your **minimum** canvas and let the layout scale up for the full-page case — don't
   hard-code pixel dimensions; use relative/responsive layout (`100%` width/height,
   flexible font sizing) so the same build works at both sizes.

Both are the same physical touchscreen — there's exactly one for the whole event, so
you don't need to handle multiple simultaneous instances or per-screen state.

## Input

**Touch only.** No `:hover` states, no right-click, no keyboard shortcuts as the only
way to do something (a touchscreen kiosk has no keyboard). Tap targets at least 44×44
CSS px.

## Win signal

No auth, no session, no token handling on your end — that's entirely our job. When the
player wins, just post a message to the parent frame:

```js
window.parent.postMessage(
  { type: "mathweek:report-win", gameId: "<id>" },
  "*"
);
```

`gameId` is the UUID we assign your game in our admin panel when we configure the
`embed_url` — we'll hand you the exact value once your game is registered. Fire this
once per win; firing it again after a win has already been claimed is harmless (we
de-duplicate on our side), but there's no need to.

## After a win

Show a simple **"You won!"** message in your own UI and stop there — don't try to
show a QR code, a claim link, or anything score-related. The host page (us) takes
over immediately: it swaps to its own win screen with the claim QR, a countdown, and
the return to your game. You don't need to detect or react to that handoff.

## What you don't need to worry about

- Login / sign-in — never happens on this screen. Players can walk up and play with
  zero setup, every time.
- Scoring persistence — we own it entirely via the win signal above.
- Multiple stations — there's only one screen.
- Responsiveness beyond the two sizes above — this isn't served on phones/desktops,
  just the one touchscreen.
