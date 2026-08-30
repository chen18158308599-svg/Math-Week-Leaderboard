# Digital-Based Game Embed Spec (for CX)

Handoff spec so the Digital-Based game CX builds drops straight into Subpage 2
(`/games`) and the main hub's rotating panel with no changes on our end. See
`website_prompt.md`'s "Subpage 2 — Daily Digital-Based Games" for the surrounding
context; this file is just the concrete, buildable version of that section.

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
