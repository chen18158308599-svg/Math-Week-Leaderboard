# Competition result interface

Each playable attempt owns one `createCompetitionAttempt(gameId)` controller.
Starting or replaying a game replaces that controller with a new one, which also
creates a new `attemptId`.

When an attempt reaches an existing, valid terminal state, the game calls
`attempt.finalize(...)` once per player slot:

```js
attempt.finalize({
  playerSlot: "single", // or "p1" / "p2"
  finalScore: 8750,
  outcome: "win",
});
```

The first call for a slot returns and emits a frozen result:

```js
{
  gameId: "knn",
  attemptId: "knn-...",
  playerSlot: "single",
  finalScore: 8750,
  outcome: "win",
  finalizedAt: "2026-10-13T...Z"
}
```

The browser event name is `mathweek:competition-result`. Duplicate calls for
the same attempt and player slot return the original object without emitting a
second event. The helper itself performs no network request and no persistent
storage. `useScoreRecording` consumes the event, routes it through the server-only
proxy, and keeps failed final-result deliveries pending for retry. The client
result is intentionally not treated as authoritative. Average Game does not emit
this event because its numerical result is calculated only after the event closes.
