# Answers to the Organiser's Technical Questions

## 1. Data Privacy — what user data do we get from Microsoft sign-in?

With Microsoft/Entra ID sign-in restricted to the university's tenant, requesting only
`openid email profile` scopes, we receive:
- Their university **email address** (e.g. `mat2509001@xmu.edu.my` — note this already
  encodes their matriculation number, so we effectively have a student-identifiable
  field even without asking for one separately).
- Their **display name**, if Microsoft provides it (not currently shown anywhere in
  the app — we only store/display the student-chosen nickname).

**Still open**: how long to retain this data after the event (raised earlier, not yet
decided). Worth deciding alongside this question rather than separately.

## 2. Code Hosting — can the repo go on GitHub for the team to track?

Yes — already done. The repository is at
`github.com/chen18158308599-svg/Math-Week-Leaderboard` under Public status. Notify me if you want to be a collaborator.

## 3. Hosting & Domain — do we need to buy a custom domain?

Not required. The site is already live for free on Vercel's `*.vercel.app` subdomain
(`math-week-leaderboard.vercel.app`). A custom domain (e.g. `mathweek.xmum.edu.my` or
similar) is optional polish — costs roughly $10–15/year plus DNS setup, and Vercel
supports attaching one at any time without a rebuild.

One relevant caveat for this team specifically: `*.vercel.app` domains are sometimes
unreliable or blocked behind mainland China's firewall. If teammates in China need
reliable access, a custom domain (which can be routed through a China-friendly CDN)
is worth budgeting for; if everyone accessing it is in Malaysia, the free subdomain is
fine as-is.

## 4. Server Capacity — what's the max concurrent load before it breaks?

Both Vercel (hosting) and Supabase (database/auth) are on free tiers, which is fine
for a one-week campus event but does have real ceilings:
- **Vercel free tier**: 100 GB bandwidth/month, generous serverless function
  invocations — realistically handles a few hundred concurrent users without issue for
  a site this size.
- **Supabase free tier**: up to 50,000 monthly active users for auth, 500 MB database
  storage, 200 concurrent database connections. For an event with a few hundred to a
  couple thousand students, this is comfortably within range.

If the event scales up materially (e.g. a large public livestream driving traffic, or
multiple large screens hammering the leaderboard with tight polling), the two things
to watch are Supabase's connection limit and Vercel's function execution time — both
have a paid tier to fall back on if needed, with no rebuild required, just a plan
upgrade.

## 5. Digital-Based Login — can sign-in be made faster on the touchscreen?

Good news: **it already is, and no design change is needed.** The current flow never
requires signing in to play a digital game at all — anyone can walk up and play
immediately, no login, no name entry, nothing. Sign-in only happens *after* a win, on
the *student's own phone* (via the claim QR), never on the shared touchscreen. So the
touchscreen experience is already as fast as "skipping login entirely" — because it
already has no login step.

This also means the lighter-weight login ideas (in-game name only, or name + Student
ID as a password) aren't needed, and are worth avoiding: either one would let anyone
type in someone else's nickname and claim their points — reopening exactly the
account-hijacking risk the organiser's own note says Microsoft auth was meant to
close.

**Confirmed by the organiser: drop the faster-login idea, keep the current design
exactly as-is.**

## 6. Location Restrictions — can Digital-Based be locked to the official touchscreen only?

Being direct about the limits here rather than building something that looks secure
but isn't: **there's no way to truly enforce "only this specific TV can access this
page."** Anything checked from a public link — IP address, user agent, screen size —
can be spoofed by someone who wants to. A few real options, in order of how much they
actually help vs. how much effort they take:

- **Do nothing extra (recommended for now)**: since playing requires no login, someone
  playing "remotely" only wastes their own time — they still can't claim any points
  without the win being reported by the actual embedded game instance and then
  claiming via QR, which only appears on the real screen. This limits the practical
  benefit of accessing it remotely without solving the underlying puzzle by design,
  rather than by access control.
- **IP allowlist**: if the library's touchscreen sits on a known, stable IP or a
  distinct subnet (ask IT), the Digital-Based subpage can reject requests from outside
  that range. Real but coarse — breaks if the network setup changes, and blocks
  nothing for anyone on the same campus Wi-Fi.
- **A per-screen access token baked into the display's URL** (e.g.
  `/games?key=<long-random-string>` set once when the screen is configured): stops
  casual link-sharing (a hijacked link still needs the token) without needing IT
  involvement, but doesn't stop someone who deliberately copies the full URL including
  the token.

None of these fully close the "share the link" scenario, since fundamentally it's a
public website. Recommend starting with "do nothing extra" given playing alone can't
score anything, and revisiting only if it turns out to be an actual problem in
practice.

## 7. Attempt Limits — confirmed change

Confirmed: card/digital puzzle attempts move from unlimited to **3 tries per student
per puzzle**, with a distinct "out of attempts" message after the third wrong answer.
Implementing this now.

## 8. MAT Stock Market scope — confirmed placeholder for now

Confirmed: Subpage 3 ships as a "coming soon" placeholder in this pass. The full
trading-system spec (5 real-data indices, buy/sell rules, daily pricing formulas) is
in the event flow plan and will be scoped as its own task later, per "we'll add the
rest of MMB once this is organized."

## 9. Subpage 2 architecture — resolved

Confirmed the Digital-Based subpage is the actual playable game, not just a
description page, **and** confirmed there is exactly one physical touchscreen for the
whole event. This means the existing "which game is live today" scheduling (by date
window) is all that's needed — no per-screen distinction. Where a theme block lists
several candidate digital games, they'll be spread across that block's individual
days (one live game per day) rather than shown simultaneously.

## 10. Side panels — what do they show?

Each small card (Digital Based / MAT Stock Market / Leaderboard) shows a live,
compact preview of its subpage — not just a static label — and is tappable to jump
straight to the full subpage. Separately, the 15–30s auto-rotation expands whichever
card is "up" into its full content in the big panel (the complete top-5 leaderboard,
the actual playable game, etc.), matching the wireframe's card → panel arrows.

## 11. Code (Card) Based content — timing

The organiser will hand over the Code (Card) Based games PDF once the website itself
is built, so the real printed-QR set can be generated from it. Not blocking this
build — the one sample puzzle already seeded (Age Difference Puzzle) demonstrates the
mechanism in the meantime.
