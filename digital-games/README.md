# Bundled Math Week games

This folder is the maintained copy of the six-game React/Vite app. Edit games here after migration; changes in the original sibling repo are not synchronized automatically. No PIN gate or Average Game is included. Global game CSS stays isolated in an iframe.

Run commands from the main website root:

- npm ci
- npm run dev (builds the game assets once, then starts Next.js)
- npm run build (builds both apps)
- npm start
- npm run test:digital-games
- npm run test:digital-claims

After changing game source during an already-running dev session, run npm run build:digital-games in another terminal, then reload/close-reopen the game. The embedded app is a static build, not a second Vite development server. The build output public/digital-play is generated and gitignored; deploy the whole repository using npm run build.

The host /games iframe loads /digital-play/index.html. Both message directions derive their origin from the current main website URL; no Render URL, VITE_LEADERBOARD_ORIGIN or NEXT_PUBLIC_DIGITAL_GAME_URL is needed. A direct visit to /digital-play/index.html supports gameplay but claiming still requires the host /games context and its existing display authorization. Claim/login/leaderboard/database requests remain on the main website.

Supabase: existing migrations 0010-0012 must already be applied. Execute 0013_all_day_games_remove_average.sql and 0014_same_origin_digital_games.sql in SQL Editor if not applied. The former disables Average and clears six-game date windows; the latter replaces old embed URLs. Neither removes historical submissions. Verify that all six games have their correct digital_key and is_active=true. No new Supabase project, table or OAuth provider is required for the static migration. School login needs the existing main website callback URL allowed in Supabase Auth.

For phone testing, open /games on a phone-reachable host (LAN IP or deployed HTTPS URL). localhost is not reachable from another device. With same-origin static hosting, a single main-site hostname/port is sufficient; no game-specific origin configuration or port 5173 is needed.
