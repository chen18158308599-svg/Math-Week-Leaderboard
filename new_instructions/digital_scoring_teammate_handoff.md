# Digital scoring handoff — integration contract v1.0

**Updated:** 12 October 2026. **Audience:** the digital-game website/backend owner. This document is self-contained; you do not need the leaderboard repository or any other documents.

The words **must**, **must not** and **default** define the v1 contract. Game-specific rules come from the agreed registry, not sample values. This is a build specification, not a claim that all services are live.

## 1. Architecture, responsibility and readiness

Reuse the leaderboard owner's existing Microsoft/Supabase school authentication. You own the digital games, backend, local screen sessions, QR image rendering, validation of qualifying wins, durable digital-result storage and delivery. The owner supplies authoritative phone pairing approval, session APIs, result ingestion and combined rankings.

The existing authentication service was restored on 12 October 2026. Its settings responded successfully and the live login reached Microsoft's school-tenant sign-in page. Full school-account login/callback still needs acceptance testing. **The new pairing page, integration APIs, session storage, integration credentials and host phase support below are not implemented/deployed yet.** You can build against mocks; production requires the owner's readiness confirmation.

| Your side | Leaderboard owner's side |
| --- | --- |
| Separately deployed game frontend and backend | Existing Microsoft login and school eligibility |
| Local screen authorization, QR rendering, status polling | Authoritative pairing creation/status/start/end APIs and phone confirmation |
| Game rules and backend outcome validation | Registered game/points rules and shared participant identity |
| Result persistence, retry outbox and reconciliation feed | Atomic ingestion, duplicate prevention and combined rankings |
| Actual-input and phase messages to host | Bounded login/saving holds and ordinary idle return |
| Deployment/recovery/support for digital website | Existing card/staff/admin workflows and integration support |

You do not need to create another Microsoft application, share student passwords, obtain OAuth tokens from the phone, or write directly to the owner's database.

## 2. Existing URLs and identity

| Item | Address/capability |
| --- | --- |
| Host origin | `https://math-week-leaderboard.vercel.app` |
| Embedded-game page | `https://math-week-leaderboard.vercel.app/games` |
| Public ranking | `https://math-week-leaderboard.vercel.app/leaderboard` |
| Existing school login | `https://math-week-leaderboard.vercel.app/login` |
| Website OAuth return | `https://math-week-leaderboard.vercel.app/auth/callback` |
| Existing Supabase OAuth callback | `https://xjmnvwcpiipvngetkzjv.supabase.co/auth/v1/callback` |
| Current game deployment | `https://mathweekdigitalbased.onrender.com` — provide a replacement if it changes |
| Original game source | `https://github.com/kowchunxiang/mathweekdigitalbased.git` — React + Vite |
| Shared participant identity | Existing Supabase authentication user UUID and profile/nickname |
| School-email restriction | Last checked local configuration: `xmu.edu.my`; owner verifies production tenant/domain rules |

Supabase's database API URL ending in `/rest/v1/` is not a QR destination or the integration API. Neither OAuth callback above belongs in a game QR.

The same Supabase user UUID identifies digital and card points. Your approval response supplies that UUID. Never substitute a nickname, typed email, Microsoft object ID or your own user UUID. Phone login stays on the owner's website; the shared screen receives no Microsoft/Supabase access token, refresh token or password.

## 3. End-to-end flow

1. Student selects a game. Your backend creates a local screen session and requests an authoritative pairing session.
2. Owner returns `session_id`, `qr_url` and expiry. Render that exact URL as QR, labeled with game/screen/seat and countdown.
3. Phone scans and opens the owner's pairing page. Existing Microsoft login and nickname setup run if needed, preserving the pairing destination.
4. Phone shows game/screen/seat/account details and asks for explicit confirmation. Owner atomically binds the logged-in eligible student to that session.
5. Your backend polls approval, then calls the authoritative start API. Enable gameplay only after success.
6. Your backend validates a qualifying outcome, durably stores a permanent result, and delivers it with the approved session ID.
7. Owner derives the recipient from the session, commits a receipt/award and updates combined scores. Display the acknowledged awarded amount, then clear the screen identity.

The phone can remain signed into the owner website for later participation. A QR pairs a specific run; it does not transfer login cookies or credentials between browsers.

## 4. QR and reuse of current authentication

**Proposed pairing page, not deployed yet:**

```text
https://math-week-leaderboard.vercel.app/digital/pair/<opaque-pairing-token>
```

Use the returned `qr_url`; do not invent tokens or link directly to generic login without a pairing path. Token randomness must be at least 256 bits, scoped to one source/event/game/screen/seat, expiring and single-use for confirmation. Session ID alone is not a pairing credential.

The owner redirects an unauthenticated phone to its login with a validated same-site `next`, for example:

```text
/login?next=%2Fdigital%2Fpair%2F<opaque-pairing-token>
```

Return flow:

```text
Microsoft -> Supabase /auth/v1/callback
          -> website /auth/callback?next=<encoded-local-pairing-path>
          -> nickname setup if needed, preserving next
          -> pairing page -> authenticated confirmation POST
```

Owner must check school eligibility, session state, deadlines and logged-in user again at confirmation, validate local return paths and protect confirmation against CSRF. GETs/link previews must not approve or consume a token. Already logged-in phones see confirmation plus a switch-account option. Expiry during login requires a new screen QR; login does not revive the old session. A second phone cannot replace a bound player.

Do not put pairing tokens in Sheets, analytics or ordinary logs. The phone page uses no-referrer policy and avoids third-party tracking that receives the token URL.

**QR creation replay:** owner stores a token hash for confirmation plus an encrypted copy of the creation response/token while pending and valid. Hash-only storage cannot reconstruct a QR on a creation retry. Owner controls the encryption key. After consumption/expiry, delete that encrypted token copy; retain session/idempotency records. Retrying creation returns the same session with `qr_url: null`, never a renewed token. A fresh attempt requires a new request ID.

## 5. Server configuration and common API format

All owner API endpoints below are new and **not currently available**. They require a dedicated server-only credential:

```dotenv
LEADERBOARD_API_BASE=https://math-week-leaderboard.vercel.app
DIGITAL_INTEGRATION_TOKEN=<owner-issued-private-server-token>
```

Every request sends:

```http
Authorization: Bearer <DIGITAL_INTEGRATION_TOKEN>
Accept: application/json
```

JSON requests also send `Content-Type: application/json`. No credential in URL queries. Owner scopes the token to your source/event/games/screens; test and production use different tokens. Owner bypasses browser-login middleware for these routes but authenticates inside the API. Never expose this token to browser JS, `VITE_*`, a QR, source control or Sheets.

### Field and transport rules

- Contract `schema_version` is integer `1`; reject unsupported versions.
- `request_id`, `session_id`, `result_id`, `match_id` and participant `user_id` are UUIDs. Example strings are placeholders, not allocated records.
- Production defaults: `source: digital-team`, `event_id: math-week-2026`, `screen_id: library-touchscreen-1`. Bootstrap metadata is authoritative.
- Timestamps are RFC 3339 UTC with `Z`; display timezone is Asia/Shanghai.
- Fixed-award v1 uses integer `points` equal to the approved registry snapshot, not an accumulated score.
- Reject unknown fields/invalid types. Maximum JSON body: 16 KiB. Outside local development, require HTTPS.
- Response envelope contains `schema_version`, server-generated `request_trace_id`, `server_time`, and either `data` or `error`.
- All integration/pairing responses use `Cache-Control: no-store`. Error/response JSON must never include bearer/QR/OAuth secrets.
- Your HTTP timeout defaults to 10 seconds. Sequential approval polling: every 2 seconds per seat, no overlapping polls for that seat. Default source API limit: 300 requests/minute, allowing up to eight seats plus control calls; changes are published in bootstrap metadata. `429` responses include an integer-seconds `Retry-After` header.

Common error shape:

```json
{
  "schema_version": 1,
  "request_trace_id": "<server-generated-trace-UUID>",
  "server_time": "2026-10-19T02:15:00Z",
  "error": {
    "code": "SESSION_EXPIRED",
    "message": "This session has expired.",
    "retryable": false,
    "details": {}
  }
}
```

Branch on `error.code`, not human-readable text. Trace IDs are diagnostic and distinct from idempotency IDs. Errors must not reveal another source's session/player.

## 6. Bootstrap registry and fixed defaults

```http
GET /api/integrations/digital-contract
```

Owner supplies this authenticated endpoint or an identical standalone mock JSON fixture for initial development:

```json
{
  "schema_version": 1,
  "request_trace_id": "<trace-UUID>",
  "server_time": "2026-10-19T02:15:00Z",
  "data": {
    "contract_version": "1.0",
    "ready": true,
    "environment": "production",
    "source": "digital-team",
    "host_origin": "https://math-week-leaderboard.vercel.app",
    "screen_ids": ["library-touchscreen-1"],
    "event": {
      "event_id": "math-week-2026",
      "timezone": "Asia/Shanghai",
      "starts_at": "2026-10-18T16:00:00Z",
      "ends_at": "2026-10-25T16:00:00Z"
    },
    "limits": {
      "pairing_ttl_seconds": 180,
      "approval_ttl_seconds": 120,
      "result_delivery_grace_seconds": 300,
      "clock_skew_seconds": 30,
      "poll_interval_seconds": 2,
      "source_requests_per_minute": 300,
      "host_saving_hold_seconds": 30
    },
    "games": [
      {
        "game_id": "<allocated-game-UUID>",
        "game_key": "<stable-game-key>",
        "display_name": "<actual-game-name>",
        "registry_version": 1,
        "enabled": true,
        "active_from": "2026-10-18T16:00:00Z",
        "active_until": "2026-10-25T16:00:00Z",
        "points_per_win": 20,
        "award_policy": "once_per_user_game_event",
        "play_ttl_seconds": 600,
        "min_players": 1,
        "max_players": 1,
        "win_rule": "<specific-qualifying-outcome>"
      }
    ]
  }
}
```

The global numbers define proposed v1 defaults; the example game is NOT an actual allocation/approved 20-point rule. Both parties must fill the real game list and `win_rule`. Owner allocates game UUIDs; you provide names, stable keys, qualifying outcomes, validation methods, player counts, intended points and duration. Do not ship placeholders. Variable scoring requires a later agreed contract; v1 awards a fixed amount for a qualifying win.

Event window is 19–25 October 2026 inclusive in Asia/Shanghai; `ends_at` is exclusive. If organizer dates change, owner updates registry before testing. Owner must provide a separate test environment/event window and credential for pre-event tests rather than disabling production checks.

Fetch bootstrap at backend startup and every 60 seconds. Stop new score-eligible sessions if readiness/registry cannot be established; retain pending delivery retries. Owner sets `ready: true` only after pairing/login returns, all APIs and host phase handling are deployed/tested. Existing sessions retain their accepted registry snapshot when new registry versions appear. Owner explicitly handles emergency revocation rather than silently changing active scoring rules.

## 7. Canonical session snapshot and deadlines

ONE session represents ONE participant in ONE game seat. Create/status/start/end return the following snapshot shape:

```json
{
  "session_id": "<session-UUID>",
  "event_id": "math-week-2026",
  "source": "digital-team",
  "screen_id": "library-touchscreen-1",
  "game_id": "<game-UUID>",
  "registry_version": 1,
  "match_id": null,
  "player_slot": 1,
  "player_count": 1,
  "state": "pending",
  "created_at": "2026-10-19T02:15:00Z",
  "pairing_expires_at": "2026-10-19T02:18:00Z",
  "authenticated_at": null,
  "approval_expires_at": null,
  "started_at": null,
  "play_expires_at": null,
  "result_delivery_deadline": null,
  "ended_at": null,
  "end_reason": null,
  "participant": null,
  "completion": null
}
```

After approval, `participant` becomes:

```json
{ "user_id": "<existing-Supabase-auth-user-UUID>", "nickname": "PuzzlePlayer" }
```

After accepted win, `completion` becomes:

```json
{ "result_id": "<result-UUID>", "award_outcome": "awarded", "points_awarded": 20 }
```

Nullable fields remain present as null until applicable. States: `pending`, `authenticated`, `playing`, `completed`, `cancelled`, `expired`. Reasons: `cancelled`, `lost`, `timeout`, `pairing_expired`, `approval_expired`, `play_expired`, `source_revoked`, or null.

On confirmation set `authenticated_at` and `approval_expires_at`; on start set `started_at`, `play_expires_at` and `result_delivery_deadline`. Preserve those timestamps in terminal snapshots. On automatic expiry set `ended_at` to the actual deadline and the corresponding expiry reason; on cancellation use the accepted cancellation time/reason. On accepted win set `ended_at` to receipt acceptance time, `end_reason` to null and `completion` to its award outcome. A zero-award already-scored win is still completed. Late accepted wins replace automatic play-expiry end fields with these completion fields; keep the previous expiry transition in the audit trail.

JSON examples show field shapes rather than one connected run. Test fixtures must use coherent times: for example create at 02:15:00Z, authenticate at 02:15:10Z, start at 02:15:20Z, earn at 02:16:00Z, receive at 02:16:01Z. Pending and authenticated snapshots must not fabricate a start time.

| Deadline | Exact v1 rule |
| --- | --- |
| QR | Created time + 180 seconds; confirmation at/after expiry is refused. Polling/retries do not renew it. |
| Approval to start | Authentication time + 120 seconds; consumed QR's earlier expiry no longer determines start validity. |
| Play | Earlier of accepted start + game `play_ttl_seconds` (default 600 seconds), game `active_until`, and event `ends_at`. Retry never changes start time. |
| First result delivery | Play expiry + 300 seconds; this is delivery grace, NOT extra gameplay time. |
| Future clock skew | Earned time may be at most 30 seconds ahead of receiver time; no extension of pairing/play deadlines. |
| Retention | Session binding, request fingerprints and receipts retained through at least event end + 90 days. |

Calculate expiry on the server even if cleanup jobs lag. Use envelope `server_time` to estimate countdown offset. Completed/cancelled sessions cannot restart or rebind. Automatic `expired/play_expired` may complete only for a valid late result inside grace; manually cancelled/lost/timed-out/revoked sessions may not.

Transitions: pending → authenticated → playing → completed; pending/approval/play deadline → expired; an active session explicitly ended → cancelled. Atomic transactions/constraints protect confirmation/start/end/score races.

## 8. Session APIs and exact responses

### 8.1 Create a pairing

```http
POST /api/integrations/digital-sessions
```

```json
{
  "schema_version": 1,
  "event_id": "math-week-2026",
  "source": "digital-team",
  "request_id": "<persisted-create-request-UUID>",
  "game_id": "<registered-game-UUID>",
  "registry_version": 1,
  "screen_id": "library-touchscreen-1",
  "match_id": null,
  "player_slot": 1,
  "player_count": 1
}
```

HTTP `201`, complete creation-response example:

```json
{
  "schema_version": 1,
  "request_trace_id": "<server-generated-trace-UUID>",
  "server_time": "2026-10-19T02:15:00Z",
  "data": {
    "session": {
      "session_id": "<session-UUID>",
      "event_id": "math-week-2026",
      "source": "digital-team",
      "screen_id": "library-touchscreen-1",
      "game_id": "<game-UUID>",
      "registry_version": 1,
      "match_id": null,
      "player_slot": 1,
      "player_count": 1,
      "state": "pending",
      "created_at": "2026-10-19T02:15:00Z",
      "pairing_expires_at": "2026-10-19T02:18:00Z",
      "authenticated_at": null,
      "approval_expires_at": null,
      "started_at": null,
      "play_expires_at": null,
      "result_delivery_deadline": null,
      "ended_at": null,
      "end_reason": null,
      "participant": null,
      "completion": null
    },
    "qr_url": "https://math-week-leaderboard.vercel.app/digital/pair/<opaque-token>",
    "replayed": false
  }
}
```

Reject unknown/disabled/out-of-window games, unapproved screens, stale registry version, invalid seats or an already-active run in that slot. Cancel abandoned runs before replacing them.

Identical retry: HTTP `200`, same session's current snapshot, `replayed: true`, original QR only if pending/unexpired; otherwise `qr_url: null`. Never renew expiry. Changed input under same request ID → `409 IDEMPOTENCY_CONFLICT`. New attempt after expiry/cancellation needs a new request ID.

Owner retains fingerprints indexed by source + operation + request ID. Compare validated field values, not JSON spacing/order. Your backend persists request IDs before calls, not inside retry loops.

Creation fingerprints include all input fields. Start/end fingerprints include the target session ID as well as body fields, so reusing a request ID on another session conflicts. Concurrent duplicate requests resolve to one committed operation. Keep credential rotation bound to the same integration source; rotating the bearer token must not reset idempotency history.

### 8.2 Read state

```http
GET /api/integrations/digital-sessions/<session_id>
```

HTTP `200`: standard envelope with `data: { "session": <complete snapshot> }`. No QR token. Participant is null until approved; no school email/OAuth data. Requests for another source's session return `404 SESSION_NOT_FOUND`.

Poll from your backend every 2 seconds while awaiting approval, then stop QR polling on approval/terminal state. Browser polls your own sanitized local endpoint with its limited screen credential, not the owner's API using the shared secret.

### 8.3 Start

```http
POST /api/integrations/digital-sessions/<session_id>/start
```

```json
{ "schema_version": 1, "request_id": "<persisted-start-request-UUID>" }
```

HTTP `200`: envelope with `data: { "session": <snapshot>, "replayed": false }`. Initial success is `playing` with fixed `started_at`, play expiry and delivery deadline. Same request replay returns current snapshot and `replayed: true`; a later terminal snapshot does NOT restart play. Always check returned state before enabling controls.

Different start ID while playing → `409 SESSION_ALREADY_STARTED`; pending → `409 SESSION_NOT_AUTHENTICATED`; expired → `410 SESSION_EXPIRED`; completed/cancelled → `409 SESSION_TERMINAL`. Fingerprint conflict → `409 IDEMPOTENCY_CONFLICT`.

Owner completes profile/nickname setup before reporting approval. Your site must not create an independent nickname identity.

### 8.4 End without a scoring win

```http
POST /api/integrations/digital-sessions/<session_id>/end
```

```json
{ "schema_version": 1, "request_id": "<persisted-end-request-UUID>", "reason": "cancelled" }
```

Only `cancelled`, `lost`, `timeout` are request reasons. Initial success atomically ends an active run as cancelled with reason/time and returns HTTP `200`, envelope with `data: { "session": <snapshot>, "replayed": false }`.

Same accepted request replays with true. Another request for already-cancelled/expired state returns the unchanged snapshot with false, without replacing the original reason/time. New end on completed → `409 SESSION_ALREADY_COMPLETED`. Reused ID with changed input → idempotency conflict.

End awards no points. Do not end a validated winner whose result is queued: accepted ingestion completes that session. Screen cleanup/navigation may occur while backend retries continue; it must not cancel that winner.

## 9. Your frontend/backend connection and code

A static Vite frontend alone cannot protect the integration secret or validate authoritative results. Backend/serverless framework is your choice; durable session/outbox storage is required.

Suggested local endpoints YOU implement: `POST /api/screen-sessions` for creation, `GET /api/screen-sessions/<local-id>` for sanitized status, start/end endpoints, and game-specific play/outcome endpoints. These are your local interfaces, not additional owner APIs.

Issue limited screen credentials scoped to a run/game/seat with expiry. Arbitrary client-supplied authoritative session/user IDs do not authorize control of another run. Protect your local endpoints with appropriate origin/CSRF handling. Neither shared cross-domain cookies nor iframe Microsoft OAuth is required.

Backend creation example:

```js
const response = await fetch(
  `${process.env.LEADERBOARD_API_BASE}/api/integrations/digital-sessions`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DIGITAL_INTEGRATION_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(storedCreateRequest),
    signal: AbortSignal.timeout(10000)
  }
);
const reply = await response.json();
if (!response.ok) {
  // Classify error.code; keep persisted IDs for retryable failures.
  throw new Error(reply.error?.code ?? "INTEGRATION_REQUEST_FAILED");
}
const { session, qr_url } = reply.data;
// Persist session/deadlines; send only authorized display data to the screen.
```

Frontend QR rendering example (`qrcode` or equivalent library):

```js
import QRCode from "qrcode";
const imageUrl = await QRCode.toDataURL(pairing.qr_url, { width: 360, margin: 2 });
// pairing comes from YOUR backend; render image and server-based expiry countdown.
```

Render only non-null QR for a pending/unexpired run. Refresh cancels the previous pending session before creating another; modifying a displayed URL does not renew it.

## 10. Submit validated results and interpret receipts

```http
POST /api/integrations/digital-results
```

```json
{
  "schema_version": 1,
  "event_id": "math-week-2026",
  "source": "digital-team",
  "result_id": "<persisted-result-UUID>",
  "session_id": "<approved-session-UUID>",
  "game_id": "<registered-game-UUID>",
  "registry_version": 1,
  "points": 20,
  "earned_at": "2026-10-19T02:15:00Z"
}
```

Do not add student/email/nickname/user-ID override fields. Owner derives the bound user and rules from the session. Keep approval's user UUID in private records for auditing, not as recipient selection. `20` is illustrative; submitted points must match that session's fixed registry value.

Your backend validates the registered win rule, not a raw browser win flag/score. Authentication identifies the player and API credential identifies your backend; neither proves unchecked game outcomes. Provide game-specific validation, such as checking a solution or recorded round result.

Owner atomically:

1. Authenticates source and validates schema/fingerprint.
2. Checks existing `(source, result_id)` receipt BEFORE current-state/expiry rejection. Identical accepted retry succeeds; changed payload conflicts.
3. Locks session; verifies ownership, event/game/version and approved recipient.
4. Requires accepted start, `started_at <= earned_at <= play_expires_at`, and earned time no more than 30 seconds ahead of receiver time.
5. Requires first delivery at/before delivery deadline. Automatic `expired/play_expired` can score in grace; never-started/manual cancellation/loss/timeout/revocation cannot.
6. Checks points against snapshotted rules and enforces one award per event/user/game across all scoring paths, including old digital claims.
7. Stores receipt/award and completes the session in one transaction.

Initial valid result → HTTP `201`:

```json
{
  "schema_version": 1,
  "request_trace_id": "<trace-UUID>",
  "server_time": "2026-10-19T02:15:01Z",
  "data": {
    "status": "accepted",
    "receipt": {
      "result_id": "<result-UUID>",
      "session_id": "<session-UUID>",
      "user_id": "<bound-Supabase-user-UUID>",
      "game_id": "<game-UUID>",
      "award_outcome": "awarded",
      "points_awarded": 20,
      "accepted_at": "2026-10-19T02:15:01Z"
    }
  }
}
```

Identical retry → HTTP `200`, `data.status: duplicate`, same original receipt/accepted time; only envelope trace/time can differ. A different result ID on an already-completed session → `409 SESSION_ALREADY_COMPLETED`.

**Already-scored player:** a valid NEW session/result still returns `201 accepted` and completes, but receipt has `award_outcome: already_scored`, `points_awarded: 0`. Submitted points remain configured win value. This is successful synchronization, not a retryable error. Display “You already earned points for this game,” not the submitted amount. Identical replay returns `200 duplicate` and that same zero-award receipt. Distinct result IDs do not bypass the scoring limit.

Result records are immutable. Display actual `receipt.points_awarded`; do not claim success based only on a Sheet write or posted request.

Receipt JSON in section 10 is the exact success shape; no live aggregate total or ranking position is promised in that response. Those are calculated by the owner's leaderboard. Participants with zero-award receipts are not newly credited. A receiver transaction must not mark a session completed without durably storing its receipt, even if no new award is created.

## 11. Error codes, retries and durable outbox

| HTTP | Stable codes | Required action |
| --- | --- | --- |
| 400 | `INVALID_JSON`, `UNSUPPORTED_SCHEMA_VERSION`, `INVALID_REQUEST` | Repair; no unchanged automatic retries. |
| 401 | `INVALID_INTEGRATION_TOKEN` | Retain pending work; contact owner/reload rotated secret. |
| 403 | `SOURCE_NOT_ALLOWED`, `SCREEN_NOT_ALLOWED`, `SOURCE_REVOKED` | Stop new play; retain records for review. |
| 404 | `SESSION_NOT_FOUND`, `GAME_NOT_FOUND` | Investigate mappings; never substitute another identity. |
| 409 | `IDEMPOTENCY_CONFLICT`, `RESULT_ID_CONFLICT` | Same ID changed data; retain/investigate, never bypass with new ID. |
| 409 | `CONTRACT_NOT_READY`, `REGISTRY_VERSION_MISMATCH`, `GAME_NOT_ACTIVE`, `EVENT_NOT_ACTIVE` | Refresh metadata; only new attempts can use new rules. |
| 409 | `SCREEN_SLOT_BUSY`, `PLAYER_ALREADY_IN_MATCH`, `MATCH_CONFIGURATION_CONFLICT` | Resolve old attempt/match; never overwrite participants. |
| 409 | `SESSION_NOT_AUTHENTICATED`, `SESSION_ALREADY_STARTED`, `SESSION_TERMINAL`, `SESSION_ALREADY_COMPLETED` | Fetch state and reconcile; do not force transition. |
| 410 | `SESSION_EXPIRED`, `RESULT_DELIVERY_WINDOW_CLOSED` | Show expiry or quarantine result; do not reassign to a new player/session. |
| 422 | `SESSION_MISMATCH`, `INVALID_POINTS`, `INVALID_EARNED_AT`, `RESULT_NOT_ELIGIBLE` | Retain for review; no unchanged automatic retries. |
| 429 | `RATE_LIMITED` | Retry; honor `Retry-After`. |
| 503 / 500 | `SERVICE_UNAVAILABLE` / `INTERNAL_ERROR` | Backoff/retry with original IDs. |

Only 429/500/503 errors set `retryable: true`. Network failures/timeouts and gateway 502/504 are also retryable; gateways need not return the JSON envelope. Malformed success is not proof of commit: retain/retry with the same ID. Registry refresh must not silently rewrite a persisted result's game/version/identity.

Use exponential backoff with jitter, starting around 2 seconds, capped at 60 seconds; a longer `Retry-After` takes precedence. Persist failures across restart. After first-delivery grace closes, quarantine unacknowledged results for operator review instead of retrying forever. Already-accepted identical retries remain safe after session expiry.

Store before delivery: canonical result payload, bound user UUID, IDs, game/version, earned time, delivery state, attempts, last error and receipt. Never regenerate earned time/result ID on retry. Screen closure must not erase this outbox.

Pending-win message: “Result saved; leaderboard synchronization pending.” Acknowledgment means owner committed it, not merely queued it in memory. Do not cancel that winning session during pending delivery.

## 12. Multiplayer and shared-screen policy

Registry defines min/max players and which outcomes/seats qualify. Never credit all participants to the first scanner.

1. Your backend generates ONE `match_id` UUID and creates one session per seat with common source/event/screen/game/version/match and the same required `player_count`, with slots `1..player_count`. Counts must be within registry min/max, and v1 supports at most eight seats. Single-player requires count 1, slot 1 and a null match ID; a group of two or more requires a non-null match ID. Owner rejects inconsistent counts or slots.
2. Show separate labeled QRs, preferably simultaneously; each student confirms their seat. Owner rejects duplicate seat, inconsistent match configuration and the same student in two seats.
3. Wait until all chosen seats are authenticated within approval deadlines. Call start for each. Enable the actual match only after ALL starts succeed.
4. If one start fails, do not run the match; end successfully-started seats and create a new round. V1 has no batch-start endpoint.
5. Track actual match start locally; each seat retains its authoritative start/deadline. Each result's earned time must fit that seat's window.
6. Emit one immutable result per qualifying seat/session. End non-qualifying seats with `lost`. Preserve queued wins independently after screen cleanup.

Single-player uses `match_id: null`, slot 1. Only one active single-player run OR multiplayer match may occupy the physical screen. Seats from the same match may coexist; a different active match/run is `SCREEN_SLOT_BUSY`. New rounds require old seats terminal; completed/automatically-expired winner receipts may still reconcile.

For host group holds, use the match ID and one of its session IDs; expiry is the earliest relevant outstanding-seat deadline. Do not extend login by swapping seats or sending repeated future deadlines.

## 13. Recovery feed and correction policy

Sheets may be private storage/reporting, with backend-only authorized writes and coordinated concurrency. It is not authentication and does not automatically push scores. Deliver individual results immediately; never also add a running Sheet total for the same wins.

Provide:

```http
GET <your-backend>/api/integrations/results?cursor=<opaque-cursor>&limit=100
Authorization: Bearer <DIGITAL_RECONCILIATION_READ_TOKEN>
```

YOU issue that separate read-only credential to the owner privately. Scope to the agreed source/event; no Sheet write credential handover is required.

```json
{
  "schema_version": 1,
  "server_time": "2026-10-19T02:15:02Z",
  "data": {
    "source": "digital-team",
    "event_id": "math-week-2026",
    "records": [
      {
        "sequence": 1,
        "result": {
          "schema_version": 1,
          "event_id": "math-week-2026",
          "source": "digital-team",
          "result_id": "<stored-result-UUID>",
          "session_id": "<session-UUID>",
          "game_id": "<game-UUID>",
          "registry_version": 1,
          "points": 20,
          "earned_at": "2026-10-19T02:15:00Z"
        }
      }
    ],
    "next_cursor": "<cursor-after-last-record>",
    "has_more": false
  }
}
```

- First request omits cursor. Default/max limit 100. Invalid limit/cursor → `400 INVALID_REQUEST`/`INVALID_CURSOR`; invalid read token → `401 INVALID_READ_TOKEN`. Use section 5's error envelope, with no write authorization implied.
- Assign monotonic sequence at durable result creation. Return ascending records strictly after cursor, BOTH pending and acknowledged results. Do not reorder old records as acknowledgment changes.
- Cursor is authenticated/source-scoped opaque last-sequence encoding. Newly appended results never precede it. It is not an OAuth/QR secret or timestamp.
- Advance cursor to last returned sequence. Empty page preserves supplied cursor, or null if initially empty. `has_more` describes records available beyond this page at read time, not future arrivals.
- Payload is identical to original submission; do not replace points with awarded points or earned time with synchronization time.
- Owner polls about every 60 seconds, processing through the SAME ingestion rules. Advance persisted cursor only after page records are durably handled; retryable failures retain it, permanent invalid rows are quarantined before advancement.
- Retain feed/results through event end + 90 days. Late first results beyond grace are operator-review items, not automatically awarded.

V1 has NO teammate score-correction endpoint. Send private correction requests with original source/result ID, reason and intended correction; owner approves an audited adjustment/flag. Never mutate an accepted result/reuse its ID. Original receipts remain historical; they are not a live total after corrections.

## 14. Iframe input and bounded host phases

Your deployment allows framing by the host origin. Login opens on the PHONE, not inside iframe. Current sandbox allows scripts, same-origin behavior and forms but not popup/top-level navigation. Do not require cross-domain cookies to be shared.

Existing supported activity message (actual input, throttled to 500 ms):

```js
const hostOrigin = "https://math-week-leaderboard.vercel.app";
let lastSent = -Infinity;
["pointerdown", "pointermove", "keydown", "wheel", "touchstart"].forEach(name => {
  window.addEventListener(name, event => {
    if (!event.isTrusted || window.parent === window) return;
    if (performance.now() - lastSent < 500) return;
    lastSent = performance.now();
    window.parent.postMessage({ type: "mathweek:activity" }, hostOrigin);
  }, { passive: true });
});
```

Host checks origin and iframe source. Current idle return: 30 seconds, warning in last 10; homepage rotation: 20 seconds. Focused-frame fallback currently exists but cannot identify real inactivity; completed integration relies on real input plus bounded phases. Send one explicit activity reset after successful start, then actual input only, not timer-generated fake activity.

New phase message the owner MUST implement before launch:

```js
window.parent.postMessage({
  type: "mathweek:session-state",
  schemaVersion: 1,
  state: "awaiting-login",
  sessionId: pairing.session.session_id,
  matchId: pairing.session.match_id,
  expiresAt: pairing.session.pairing_expires_at
}, hostOrigin);
```

| Phase | Expiry field | Host action |
| --- | --- | --- |
| `awaiting-login` | Earliest pending QR or approved-but-not-started approval expiry | Hold idle only to that deadline, max 180 seconds from FIRST hold for run/match. |
| `playing` | Earliest play expiry among seats | Release wait; reset ordinary idle once. Do NOT hold idle to play expiry. |
| `saving-result` | Local durable win-storage time + 30 seconds | Hold idle max 30 seconds from FIRST saving phase. Retries survive after hold. |
| `ended` | null | Clear holds and screen identity; reset ordinary idle once. |

`sessionId` is known to the current run; `matchId` is matching group UUID or null. Owner validates schema/origin/source/association and imposes its own caps. Repeated phases do not renew holds or reset activity. Progression awaiting → playing → saving → ended; direct ended handles loss/cancellation/expiry. QR refresh/seat switching must not reset the original hold cap.

On hold expiry, ordinary warning/exit resumes; unfinished attempts are abandoned/cancelled. Fresh real user input can start a new cleaned-up run. Pending wins are NOT cancelled because the screen exits. Navigation/unmount clears host holds even if game never sent ended; backend deadlines/outbox still work.

Phone activity does not become screen input. These phase messages are NOT yet supported by the deployed host; owner confirms them before `ready: true`.

## 15. Keys and deliverables

| Item | Provider | Required location |
| --- | --- | --- |
| Production/test API bases | Owner | Your backend; actual test URL, not guessed. |
| `DIGITAL_INTEGRATION_TOKEN` | Owner generates privately | Both backends only. NOT supplied by this document. |
| Registry IDs/rules/fixtures | Both agree; owner publishes | Your backend mapping and owner validation. |
| Limited local screen token | Your backend | Authorized screen/run only, never substitute shared API credential. |
| Pairing token | Owner create response | Expiring QR/confirmation only, not exports/logs. |
| `DIGITAL_RECONCILIATION_READ_TOKEN` + feed URL | You issue privately | Owner's backend, read-only. |
| Google Sheet/service-account credentials if used | You | Your backend only. |
| Microsoft secret, Supabase service-role key/database password | Owner retains | You do NOT need these. |
| Supabase anonymous/public key | Existing owner login | You do NOT need it for this API approach. |

The owner's original configuration includes privileged credentials and is not a distributable integration key list. None are copied here. Public Microsoft client/tenant IDs do not authorize API calls and are unnecessary for your delegated-login integration. Owner verifies production redirects, school tenant/domain restriction, secret validity and login returns; no Microsoft registration on your game domain is required.

**You deliver back:** final frontend/backend origins and framing requirements; complete game/rules/player-count proposal; mappings to allocated registry IDs; implemented QR/local-session flow; durable result/outbox design; test payloads/receipts without secrets; recovery feed URL and private read token; retry/monitoring/restart procedure; operational contact; end-to-end test evidence. Owner does not need Sheet write access or student passwords.

## 16. Build sequence and acceptance

1. Agree v1/rules; owner supplies registry/mock fixtures, then implemented test API and private token.
2. Owner builds pairing/login/nickname returns, atomic session APIs and result receiver, QR replay and host phase support.
3. You build local backend authorization, durable request IDs, QR rendering/polling/start/end and outcome validation.
4. Add durable results, receipt-based display, outbox/recovery feed.
5. Jointly test PHONE + actual iframe + combined ranking, not merely a standalone game or edited Sheet.
6. Owner disables legacy digital claim scoring for migrated games and enforces cross-path award uniqueness, preserving card/staff workflows.
7. Deploy both; confirm ready metadata/registry/live secrets, approved production smoke test and monitoring.

| Acceptance test | Required behavior |
| --- | --- |
| First login/nickname | Returns to original QR; same Supabase identity as card scoring. |
| Already signed in / wrong account | Confirmation/switch-account available; non-school refused. |
| Link preview/GET | No pairing consumption. |
| QR expiry during login | Cannot approve stale run. |
| Second phone/cancellation race | Bound player cannot be overwritten; atomic resolution. |
| Create/start timeout retry | Same session/start time; no duplicate valid QR/run. |
| Pre-approval or forged recipient/points | No play/recipient override; validated outcomes and fixed rules. |
| Valid win | Correct user's receipt/points and combined ranking. |
| Identical replay, even after expiry | Same original receipt, no extra award. |
| New already-scored run | Accepted zero-award receipt, no retry loop. |
| Multiplayer | One distinct eligible user per seat; only qualifying seats score. |
| Network/restart/host exit | Durable retry survives; recovery inside grace. |
| First delivery beyond grace | Quarantined for operator review, not reassigned. |
| Recovery pages | No missed/double results; safe cursor advancement. |
| Login wait / actual input / abandonment | Bounded hold, real-input reset, eventual unattended return. |
| Slow score save | Pending message; screen can exit without losing result. |
| Previous player cleanup | No identity/credentials reused by next player. |
| Corrections | Audited owner action, immutable original result IDs. |

Ranking target is a few seconds after receiver commit, with network/realtime variability and polling recovery. A Sheet write alone is not an accepted leaderboard score.

## 17. Legacy flow and change control

The old browser `mathweek:report-win` and post-win claim QR must NOT score the same migrated digital result. Existing `/api/games/report-win` only creates a short-lived claim token and implements none of the new interfaces above. Owner handles deliberate cutover and cross-path deduplication.

Any incompatible field/rule change requires a coordinated contract/version/fixture update before rollout. Never silently substitute identities, rewrite accepted results, change active-session rules, or issue new IDs to bypass rejection.

Before launch you require real game registry entries, test/live credentials delivered privately, deployed/verified pairing and receiver, `ready: true`, implemented host phases and passing tests. The document now defines the build contract; it does not create endpoints, secrets, or game rules the parties have not supplied.
