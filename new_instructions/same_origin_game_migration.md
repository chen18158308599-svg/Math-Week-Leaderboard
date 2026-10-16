# Same-origin game migration

Maintained game source: digital-games/src. Audio/static files: digital-games/public. Main build command invokes scripts/build-digital-games.mjs, generating public/digital-play with Vite base /digital-play/. The host loads /digital-play/index.html in its existing isolated iframe, and both sides use the current website origin for postMessage. The static path bypasses login middleware, while the claim-result API retains display authorization and phone claiming retains school login. The original sibling repository is retained as a backup; edit the migrated copy from now on.

## Local use

From the Math-Week-Leaderboard repository: npm ci, then npm run dev. Open http://localhost:3000/games and enter the existing main display password if requested. Individual games have no PIN. Close/reopen the embedded game after rebuilding game source. No port 5173, Render deployment, VITE_LEADERBOARD_ORIGIN or NEXT_PUBLIC_DIGITAL_GAME_URL is required. For phones, use the main site's LAN IP or deployed HTTPS host on both the computer and phone; localhost cannot be scanned across devices.

## Supabase operations

A read-only inspection during migration found all six game keys already registered and enabled, but old date windows/Render embed URLs remain and Average is still active. The new static hosting itself needs no new database tables or OAuth provider.

1. If already applied, do not rerun schema migration 0010. Ensure existing scaling migration 0012 has been applied (0011 expiry behavior is also included in later claim-function migrations).
2. In SQL Editor, run all of 0013_all_day_games_remove_average.sql. This disables Average, removes the six games' old day windows and updates the claim function to reject the retired game while retaining scaling and 60-second expiry.
3. Run all of 0014_same_origin_digital_games.sql. This changes six game embed_url fields to /digital-play/index.html.
4. Verify:

```sql
select name, digital_key, is_active, active_from, active_until, embed_url
from public.games where type = 'digital' order by digital_key;
```

The six remaining keys should be enabled, have null date bounds, and use /digital-play/index.html. Average should be disabled. Existing scores remain untouched.

No service role key belongs in digital-games source. Retain main .env.local/server deployment Supabase settings. Existing main-domain login callback stays unchanged. Add the current local/LAN callback to Supabase Auth Redirect URLs only when testing login through a new local/LAN hostname. No separate game-origin callback is needed.

## Deployment

Deploy the main repository using npm ci and npm run build. This builds both apps and copies audio/assets into the main site's public output. Serve via the existing Next.js deployment. Every game and leaderboard API now uses the same origin. A real school-account login/claim remains an external acceptance test.
