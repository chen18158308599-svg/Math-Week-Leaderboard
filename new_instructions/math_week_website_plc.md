Here's a full written breakdown of the wireframe, organized top to bottom, left to right — so it can be handed off as a build spec.

## Overall Layout
A dark navy background (near-black, #0a0e1a-ish) with all sections outlined in bright blue borders. The page is divided into four horizontal zones: **Header**, **Main Body** (split into a left content panel and a right sidebar of 3 stacked cards), and **Footer**. Yellow curved arrows connect the cards to indicate a looping/cycling animation.

## 1. Header (top bar)
- **Left side:** Bold white text "MATH WEEK" (large, all-caps, heavy weight), with a smaller subtitle beneath it reading "LEADERBOARD" in light gray, letter-spaced/tracked out.
- **Right side:** A white instruction box (blue border) containing placeholder text: "Add MAT, XMUM Logo and other professional banner stuff. (Follow color theme of the MAT Logo)" — this is a note to the designer, not final content. Implies the final header should include the MAT logo and XMUM logo, styled to match the MAT logo's color palette.

## 2. Main Body — Left Panel (large content area)
A large white rectangular panel bordered in blue, containing centered placeholder text (three lines):
- "Poster for MME or Committee Based happening today or tomorrow"
- "/PGVG Video (Intro to Math Week)"

This indicates the panel will display either a daily event poster (MME or committee-run event) or a looping intro video (PGVG format), rotating based on what's scheduled.

Below this panel, still inside the same outer blue-bordered container:
- Left-aligned text: "Learn More: {link to subpage}" — a placeholder link/button to a subpage with more details.

## 3. Main Body — Right Sidebar (3 stacked cards)
Three white cards, each with a blue border, stacked vertically, top to bottom:

1. **"Digital Based"** — subtext "{link to subpage}"
2. **"MAT Stock Market"** — subtext "{link to subpage}"
3. **"Leaderboard"** — subtext "{link to subpage}"

Each card is a placeholder linking to its own subpage.

## 4. Animation / Looping Arrows (yellow)
Thick yellow curved arrows indicate the cycling behavior of the display:
- A label near the top reads **"Loop every ~15–30s"** — indicating this entire right-hand sequence auto-rotates on a timer.
- An arrow curves from the top of the sidebar area down into the left content panel (top-right corner), suggesting content flows from the sidebar loop into the main display.
- A vertical arrow points upward from "MAT Stock Market" card into "Digital Based" card.
- A vertical arrow points upward from "Leaderboard" card into "MAT Stock Market" card.
- A long arrow curves from the bottom of the left content panel, sweeping right and up into the "Leaderboard" card.

Together these form a continuous loop: **Left Panel → Digital Based → MAT Stock Market → Leaderboard → back to Left Panel**, cycling automatically every 15–30 seconds.

## 5. Footer (bottom bar)
- **Left side:** A white instruction box (blue border): "Add Sponsorship Logo Slot and other professional banner stuff." — placeholder noting that sponsor logos and additional footer branding need to be added.
- **Right side:** Small gray text: "Math Week · Oct 19–25, 2026 · XMUM Library" — the event name, date range, and location.

## Summary of Build Instructions
1. Header: Math Week logo/title block (left) + MAT/XMUM logos and branding matching MAT's color theme (right).
2. Main display panel: rotates between a daily event poster and an intro video, with a "Learn More" link to a subpage.
3. Sidebar: three linked cards (Digital Based, MAT Stock Market, Leaderboard), each pointing to its own subpage.
4. The whole right-hand column + main panel cycles automatically every 15–30 seconds, looping continuously.
5. Footer: sponsor logo placement (left) + event date/location tagline (right: Oct 19–25, 2026, XMUM Library).