# Display browsing and personal participation

Updated 14 October 2026.

## Two independent kinds of access

- The library display unlocks `/`, `/directory`, `/games`, `/stock-market`, `/leaderboard` and `/kiosk` with the organizer's four-digit PIN. Microsoft student login does not grant display access.
- Student phones use Microsoft login for QR answer pages, point claims, nickname/profile and `/my-score`. These flows do not need the display PIN and have no main-site navigation.
- Successful card submission stays on its answer page. Its results link opens `/my-score`, which shows only the student's points and rank. Ties share the same rank.
- Direct main-site URLs and game-catalog APIs are protected server-side, including for students already signed in. Digital claim-token generation requires display access; staffed physical claims retain their staff/admin authentication.

## Organizer use

Open the main website on the library display and enter the PIN. Its value is in `output/site_access_credentials.local.txt`, which is excluded from Git. Give it only to organizers operating the display.

Unlock lasts 12 hours on that browser using a signed HttpOnly cookie. The footer's **Lock display** button clears it. Unlocking neither signs a student in nor transfers a Microsoft session. Five incorrect guesses from one client address lock PIN checking for 15 minutes.

The database stores only a keyed PIN digest; only the server service role can read/configure it or call its verifier. Cookie/PIN keys are purpose-derived on the server from the existing server credential. Rotating that credential invalidates display cookies and requires reconfiguring the saved PIN digest before unlocking again. Never expose the service credential to participants or another game's frontend.

## Nicknames

Nickname creation and editing use the same database function. A unique normalized index enforces uniqueness atomically, including case, full-width compatibility variants and surrounding spaces. Existing names were checked for conflicts before installing the index; no existing names were renamed. The UI gives a clear duplicate-name error.

## External game boundary

This PIN protects the Math Week host website and its local digital-claim entry point. It cannot protect a separately hosted game's direct URL. The digital/stock-game owner must validate authorized screen/play sessions on their own backend to prevent independent play or forged score submissions there.

QR phone login/pairing URLs must not contain the display PIN, and future authenticated server-to-server integration APIs must use their own credentials rather than this browser cookie. The teammate's iframe is used from an already-unlocked display; student phones still confirm identity on their own pages.
