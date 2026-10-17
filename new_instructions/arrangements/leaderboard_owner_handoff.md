# Leaderboard owner: digital-result ingestion and combined rankings

Prepared 12 October 2026. Companion document: [Digital game owner's duties](digital_scoring_teammate_handoff.md).

This is an implementation/handoff specification, not a report that integration is already deployed. Creating these documents changes no authentication, QR, scoring, database or production behavior.

## 1. Your responsibility and the division of ownership

The teammate owns digital gameplay, student school authentication, QR generation, phone-to-screen session pairing, win validation and digital-result storage/delivery. You own the event website, embedding, receipt of trusted digital results, cross-activity identity mapping, combined scores, public rankings and existing card/staff/admin workflows.

Recommended architecture:

```text
Student phone -> teammate's Microsoft login/session backend
                            |
Shared-screen game -> teammate's validated digital result store/outbox
                            |
                  authenticated result API
                            v
                 your ingestion backend -> Supabase combined ledger
                                              |
Existing card/staff points --------------------+
                                              v
                                 public live leaderboard
```

Sheets may remain the teammate's storage/reporting tool. Timely score updates use immediate backend delivery; the public website does not poll Sheets directly or need access to its write credentials.

## 2. What you already have

| Item | Current implementation |
| --- | --- |
| Website | `https://math-week-leaderboard.vercel.app`; confirm it remains the production origin. |
| Source and hosting | `https://github.com/chen18158308599-svg/Math-Week-Leaderboard`; Git push to connected `main` triggers Vercel deployment. |
| Game embed | `/games` mounts `EmbeddedGames`; URL is configured in `src/lib/digital-games.ts`. Current URL: `https://mathweekdigitalbased.onrender.com`. |
| School authentication | `/login` uses Supabase Auth `azure`; `/auth/callback` creates the session; `src/lib/auth.ts` checks `ALLOWED_EMAIL_DOMAIN`. Last checked local domain: `xmu.edu.my`. Production provider/tenant settings still need verification. |
| Card QR flow | 19 files in `card_based/qr-codes`, pointing to `/puzzle/<slug>` on the production origin. Login, nickname and answer RPC lead to existing `submissions`. |
| Other scoring | `/claim/<token>` and staff flows use Supabase login and submissions. |
| Rankings | `leaderboard_individual` sums non-flagged submissions per profile; `useLeaderboard` subscribes to new `submissions` and falls back to an 8-second poll. Home currently shows top five in the large window and top three in the small window. |
| Idle behavior | 30 seconds of kiosk inactivity, last-10-second notice; 20-second home rotation. Current iframe activity messages and a focused-frame compatibility hold are implemented. |

Keep the existing student login for card/claim flows and keep admin/staff login. Digital login moving to the teammate does not replace these. Do not delete Azure configuration, profiles, old submissions or printed QR assets as part of connecting digital scoring.

## 3. Identity integration is required before scores can be combined

Current `profiles.id` references `auth.users.id`; `submissions.user_id` references a profile. The teammate's Microsoft subject ID is NOT automatically your Supabase UUID. Do not insert it directly into `submissions.user_id`, create a fabricated auth UUID, or match by nickname.

Proposed integration model to implement and review:

- Canonical participant records independent of either system's login session.
- Links from each participant to existing `profiles.id` and to the teammate's `(source, identity_issuer, identity_subject)`.
- A separate imported-digital-results ledger with source/result uniqueness and scoring-policy constraints.
- A combined ranking view that sums existing unflagged submissions and accepted digital results for the same participant exactly once.

These new tables/view do NOT exist yet. This model avoids forcing external students to sign into your site before their first digital score can display, while preserving current auth/profile references.

Bootstrap mappings from existing verified school-account profiles. Use the teammate's server-attested normalized school email only for controlled matching against existing profiles, with a confirmed issuer/tenant and duplicate/conflict handling. Store the stable provider identity for future matches. Do not merge from client-entered emails or fuzzy names. Define an operator review path for conflicting identifiers or changed school emails.

Choose the public nickname policy once: prefer an existing local nickname; otherwise use an approved supplied nickname or neutral fallback. Handle duplicate nicknames without merging students. Public ranking responses expose nickname and points, not email, issuer/subject or credentials.

## 4. Build the authenticated digital-results receiver

Implement `POST /api/integrations/digital-results`, matching the exact v1 payload in the teammate document. It is a proposed route, not an existing endpoint. Accept only authenticated server-to-server submissions; the teammate's backend is responsible for validated student login and game outcomes.

Issue a dedicated, high-entropy `DIGITAL_RESULTS_API_TOKEN` for this source. Keep it in server environment variables on both sides and deliver it privately. Separate test/production tokens and support rotation. Never hand over Supabase's service-role key. If greater isolation is later required, add signature verification or narrower source credentials without changing client trust assumptions.

The receiver must:

1. Authenticate the integration before doing database work; bound request size and validate all fields.
2. Permit only the configured source/event/issuer and supported school identity/domain.
3. Resolve the participant and agreed game mapping. Check score limits against the agreed scoring registry; never accept arbitrary browser points.
4. In ONE database transaction, enforce uniqueness for `(source, result_id)`, check any one-award-per-participant/game/event rule, and save the result and necessary mappings.
5. Return success only after durable commit. Identical retry returns `200 duplicate`; changed payload with the same ID returns `409` and never overwrites the original.
6. Record integration errors for operator review without logging credentials or full OAuth tokens.

Default rule to confirm is one scoring win per participant/game/event, consistent with existing submissions' unique user/game rule. Transport duplicates and multiple distinct attempts are different cases. Agree whether a new result for an already-scored game is rejected or acknowledged as non-scoring; both sides must handle that decision explicitly.

Use the response table in the teammate document: `201 accepted`, `200 duplicate`, validation `400/422`, auth `401/403`, conflict `409`, retryable `429/5xx`. Replayed requests must not add points twice. Score corrections require an explicit audited correction/reversal workflow, not mutation of an existing result ID.

Update the proxy/middleware so this machine endpoint is not redirected to Microsoft `/login`. Keep protection inside the API with integration credentials; allowing it past the browser-login gate does not make score writes anonymous. Do not add all integration endpoints to a blanket unauthenticated write policy.

## 5. Database and ranking work

- Add the reviewed identity mapping/import ledger and combined view through migrations; maintain RLS and server-only write access. Keep existing card RPCs and auth relations working.
- Switch ranking reads to the combined view. Preserve individual/group semantics as needed; resolve whether digital points count toward groups before changing group rankings.
- Extend realtime refresh to committed digital-result changes as well as existing submissions. Identity/nickname changes and score flagging/corrections must also cause refreshed rankings, or be caught by the polling fallback.
- Apply the same rules to homepage previews, full leaderboard, profile totals and admin exports; avoid displaying different totals in different places.
- Exclude flagged/voided results and double counting across sources. In particular, never score one digital win both through a legacy claim token and through the new imported result.
- Treat realtime as a prompt notification mechanism, not a guaranteed delivery channel. Retain polling and reload recovery.

Operational target to confirm: a healthy-network score should normally display within a few seconds of the receiver commit. This is a target, not a latency guarantee. Keep an 8-second fallback or tune it after testing; recover missed deliveries through reconciliation, not client polling alone.

## 6. Synchronization, reconciliation and corrections

The teammate keeps a durable outbox and retries identical result IDs. You provide stable acknowledgments and ingestion logs. Obtain the teammate's private, cursor-paginated results feed/export as described in their document and schedule periodic reconciliation, for example every minute if deployment scheduling supports it, plus an operator-triggered recovery job.

Reconciliation replays the same results through the same validation/deduplication path. Do not add a running Sheet total to totals already built from individual results. Monitor last received/reconciled time, pending delivery failures and identity conflicts.

Confirm how long records/feed cursors are retained. Define who approves incorrect-score corrections, how they are authenticated, and how existing results are voided with an audit trail. Until this is implemented, keep corrections as an explicit operator process rather than allowing arbitrary result updates.

## 7. Embed integration work

Obtain the final game HTTPS URL, configure it in `src/lib/digital-games.ts`, and continue checking both message origin and iframe `event.source`. Microsoft phone login is hosted by the teammate, not inside our sandboxed iframe.

The current activity contract is `mathweek:activity` on real input. Implement the proposed `mathweek:session-state` waiting/playing/ended notifications only after agreeing their structure with the teammate. They are currently unsupported.

Phone login must have a bounded waiting period: temporarily hold the host's 30-second idle timer up to a server-issued session expiry and a host-enforced maximum. Restore idle counting on approval, expiry, cancellation, iframe closure and route change. Do not accept endless heartbeat holds. Coordinate any phone-session progress signal as part of this new bridge.

Once reliable real-input notifications and waiting-state behavior are tested, remove reliance on the focused-frame compatibility hold for this game. Preserve 20-second home rotation and 30-second post-game/no-activity behavior.

The old `mathweek:report-win`/`/api/games/report-win` claim flow must not be used for the same newly imported digital score. Keep staffed claim-token behavior intact; retire or disable legacy digital claims for migrated games deliberately during cutover. Do not unexpectedly change unmigrated games.

## 8. Configuration and private handover

| Configuration | Owner/action |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Existing website configuration. Public client values are not integration write credentials. |
| `SUPABASE_SERVICE_ROLE_KEY` | Keep in your server environment only. Never send to the teammate or include in either document. |
| `ALLOWED_EMAIL_DOMAIN` | Keep for local card/claim auth; verify production value. |
| `DIGITAL_RESULTS_API_TOKEN` | NEW server-only value to generate and share privately after receiver implementation. Not created in this handoff. |
| `LEADERBOARD_RESULTS_URL` | Give teammate the implemented production receiver URL, and a separate test URL if available. |
| Source/event/allowed issuer/game mapping and score policy | Agree and configure server-side before accepting results. |
| Teammate game/backend/feed URLs | Obtain from teammate; do not infer from an old deployment. |
| Reconciliation read-only credential | Obtain privately; store server-side. Exact env name depends on the chosen feed. |

No existing secret has been copied into these documents. Microsoft registration reuse, if requested, is a separate administrator-approved credential/configuration handover. The proposed architecture requires no shared Supabase service-role key and no shared browser login session.

## 9. Delivery sequence and responsibility checks

1. Agree identity convention, payload, point values, retry/correction rules and test credentials with teammate.
2. Build migrations, identity mapping, receiver, proxy exception and combined ranking view; preserve old data.
3. Teammate implements its school login/session pairing, result validation, outbox and feed.
4. Test independently deployed game inside the current iframe, then test the end-to-end points flow.
5. Audit old digital claims and switch over each migrated game without double counting. Keep card/staff/admin auth.
6. Deploy both sides, share the final URLs/token privately, confirm a test result in the production combined view and monitor ingestion.

Acceptance requires: one student's card + digital points under one identity; a digital-only student visible without local login; retries and repeat wins handled correctly; invalid/missing credentials refused; unknown game/issuer refused; timeout/network outage recovery; no previous player's identity on the screen; no premature phone-login timeout; and consistent homepage/full-ranking/export totals.

Separate known card issue: the nickname-onboarding redirect currently loses the original puzzle `next` parameter. Track and repair it in the card-flow work; it is not resolved by digital-result ingestion. Existing printed QR URLs and production Azure callbacks should be verified separately.

## 10. Code and management references

- Game wrapper: [embedded-games.tsx](../src/components/embedded-games.tsx)
- Game URL and current preview order: [digital-games.ts](../src/lib/digital-games.ts)
- Idle timer: [idle-redirect.tsx](../src/components/idle-redirect.tsx)
- Login: [login/page.tsx](../src/app/login/page.tsx), [auth/callback/route.ts](../src/app/auth/callback/route.ts), [auth.ts](../src/lib/auth.ts)
- Current ranking reads: [use-leaderboard.ts](../src/lib/leaderboard/use-leaderboard.ts)
- Current schema/RPCs: [Supabase migrations](../supabase/migrations)
- Legacy claim receiver: [report-win/route.ts](../src/app/api/games/report-win/route.ts)
- Legacy embed instructions (superseded for digital scoring ownership): [digital_game_embed_spec.md](digital_game_embed_spec.md)
- Management: [Supabase](https://supabase.com/dashboard), [Vercel](https://vercel.com/dashboard), [Microsoft Entra](https://entra.microsoft.com/)

These references document current capabilities. They do not imply new endpoints, migrations, secrets or access permissions have already been provisioned.
