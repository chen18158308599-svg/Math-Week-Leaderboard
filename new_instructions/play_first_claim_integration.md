# Play first, sign in to claim - implementation

This replaces the proposed pre-game pairing flow for the current seven-game website.

## Rollout

1. Apply `supabase/migrations/0010_digital_result_claims.sql` to the existing Supabase database. Then apply 0011_digital_claim_hard_expiry.sql and 0012_digital_points_scaling.sql. This adds immutable per-attempt result/score snapshots and replaces the claim RPC while preserving its account/game uniqueness and token locking.
2. In `/admin/games`, select a distinct digital game key on each actual digital row: `average`, `conway`, `deal`, `knn`, `sequence`, `planarity`, `symmetry`. Confirm enabled flags and event dates manually. No migration guesses mappings from outdated seed dates/names or enables games automatically.
3. Deploy both repositories. The game deployment is unchanged by default. Set `NEXT_PUBLIC_DIGITAL_GAME_URL` for a replacement/local game origin and rebuild the leaderboard. Set `VITE_LEADERBOARD_ORIGIN` for a replacement/local leaderboard origin and rebuild the game. Local example: Vite on http://localhost:5173, leaderboard on http://localhost:3000.
4. Open the leaderboard `/games` and pass the existing display password. Play inside its iframe. The standalone game URL cannot mint authorized claim codes.
5. Acceptance-test a real school login, nickname onboarding, and confirmation on a separate phone. These external provider flows are not exercised by local automated tests.

## Data flow and policy

Game `mathweek:claim-result` message -> validated host iframe bridge -> same-origin POST `/api/games/claim-result` -> durable `claim_tokens` result snapshot -> host renders QR -> game displays QR in its post-game panel -> phone opens `/claim/<token>` -> existing Microsoft sign-in/callback/onboarding -> authenticated `claim_token` RPC -> `submissions` -> existing leaderboard sums.

`result_payload` stores gameKey, attemptId, playerSlot, finalScore, outcome, finalizedAt on both the claim and submission. Normal digital points use the game-specific 0-19 scale in digital-points.ts and migration 0012, not the raw finalScore or games.points_value. Losses/partial progress may therefore earn points. Each school account can claim one result per game, preserving existing policy. The result is frozen on first acceptance; conflicting retries are rejected. Two-player games get separate tokens per slot. Neither phone credentials nor identity is returned to the shared game screen.

Average preserves its chosen number in result_payload.finalScore, associates it with the logged-in user and creates a zero-point pending submission. Final competition settlement is not automated: an organizer must define and perform settlement after all entries are collected. A selected number must never be treated as earned points.

QR lifetime is 60 seconds. The result screen also shows the exact claim URL and a link that opens it in a new browser tab. Expired codes cannot be renewed or claimed. The game returns to its homepage after expiry. Apply migration 0011 for existing databases to enforce the 60-second cap in the claim transaction, including old codes. Claimed status includes no participant identity. Polling is sequential and retryable, and responses bypass caches. A bounded claim hold prevents idle navigation during phone login. Actual input is forwarded from the game so ordinary idle handling resumes after the hold.

Existing physical/card awards retain their fixed points. Registered digital games cannot use the legacy report-win route to bypass result submission. Games still produce their scores in browser code: shape/window/identity validation is implemented, authoritative replay-based outcome validation is not.

## Verification

`npm run test:digital-claims` runs the actual API route against a PostgreSQL test engine (PGlite), applying the actual migration and claim RPC. Covers variable scores/metadata, two seats, Average, duplicate/conflicting requests, permanent expiry, unauthorized claims, date windows, and unchanged physical points. `npx tsc --noEmit` and `npm run build` validate application integration. Game repo adds `npm run test:leaderboard` for message routing and source checks; original scoring tests remain.

Database migration and deployment are separate operational steps; local code changes alone do not change the live website or database.
