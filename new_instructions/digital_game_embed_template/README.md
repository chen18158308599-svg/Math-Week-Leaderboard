# Digital Game Embed Template

Starting point for each of the 7 Digital-Based games (see
`../digital_game_embed_spec.md` for the full rules this template already follows).

## How to use

1. Copy `index.html` into your own project folder — one copy per game.
2. Replace everything inside `#game-root` with your actual game UI.
3. Set `GAME_ID` near the top of the `<script>` block once the Math Week team gives
   you the real ID for your game (they assign it when they register your `embed_url`
   in their admin panel — until then, leave the placeholder in).
4. Call `reportWin()` from wherever your own win condition fires. Delete the demo
   button once you don't need it.
5. Open the file directly in a browser to test standalone (it detects it isn't in an
   iframe and just logs to the console instead of posting a message) — no build step,
   no server needed for local development.
6. When ready, host it wherever's convenient (Vercel, Netlify, GitHub Pages, etc.) and
   hand back the public HTTPS URL — see "What to hand back" in the spec doc.

## What's already handled for you

- Responsive layout (`%`/`vh`/`clamp()`, no hard-coded pixel sizes) so the same file
  works both full-bleed on `/games` and shrunk into the main hub's smaller panel.
- Touch-friendly basics: 44×44px minimum tap targets, no hover-only interactions, text
  selection and the iOS tap-highlight disabled.
- The exact `postMessage` win-signal contract, already wired to a demo button so you
  can see it work before you've written any real game logic.

## What you still have to build

Everything inside `#game-root` — this file is deliberately just the shell/contract,
not a game. See the table in `../digital_game_embed_spec.md`'s "What to build" section
for which of the 7 games this copy is for and what it's supposed to do.
