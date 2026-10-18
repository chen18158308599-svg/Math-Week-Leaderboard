# Math Week website — implementation handoff

## Objective

Implement the Explore the Week / What's on Today page changes and refresh the main page preview in the user's existing local project:

`C:\Users\LENOVO\Desktop\Math-Week-Leaderboard`

Some real images have been placed in:

`assets\whats_on_today`
(four awards and 1 poster)

This document is an implementation brief, not a description of verified repository contents. No local code, routes, components, asset filenames, or prize mechanics have been inspected. **Inspect the project first; do not assume any particular framework, file structure, or image path.** Carry the work through implementation, appropriate tests/build, and desktop/mobile visual review.

## 1. Initial audit — before editing

1. Read applicable `AGENTS.md` files and project instructions. Inspect the repository status and preserve existing user changes.
2. Identify the framework, package manager, development/build commands, and relevant existing checks from project files.
3. Locate the actual main page and the Explore the Week / What's on Today page. Confirm whether the latter names refer to the same page, separate routes, or a page and section. Trace navigation and links before changing anything.
4. Inspect the current components, styles, content/data sources, and responsive behavior for both affected areas. Record the current day/date navigation, schedule, What Will You Try section, and other interactions as a preservation baseline.
5. Inventory `assets\whats_on_today` and any relevant existing project assets. Inspect image contents as well as filenames; record actual paths, dimensions, aspect ratios, file formats, and approximate file sizes. Identify which images are suitable for each role below.
6. Verify prize names and any existing reward rules in the project content/data. In particular, confirm whether the magnetic badge is actually associated with **25 points**. Do not infer this from the requested visual arrangement alone.

Do not invent filenames, import paths, routes, prize eligibility rules, or assets. Proceed with confirmed assets and existing project conventions. If a required image or fact is unavailable, report the gap explicitly and avoid presenting a substitute as the requested item.

## 2. Explore the Week / What's on Today page

### First row: retain the hero's content roles

The first row must contain:

- **Left:** the existing headline, **“Maths you can see, touch and play.”**, together with its existing introduction and date information. Preserve the wording and information unless a minor layout adjustment is necessary.
- **Right:** the official Math Week poster, selected by visually inspecting the available assets. Preserve its full composition and legible text; do not replace it with a generic event image.

Use the existing site's blue, white, and lavender visual language. Refine spacing, alignment, and proportions so this row reads as a coherent hero. Keep the poster at its natural aspect ratio, with sufficient width to remain useful on desktop and mobile.

### Second row: four equal photo cards immediately after the hero

Place a four-card row directly below the hero row, in this order:

| Order | Image subject | Card information |
| --- | --- | --- |
| 1 | Camping chair | Grand prize |
| 2 | Thermos | Mid prize |
| 3 | Nap blanket | Small prize |
| 4 | Magnetic badge | Badge; show “25 badges available”|

Each card should show the correctly matched real photograph, a clear item name, and a restrained tier label where confirmed. Keep all four cards equally sized within each responsive layout. Align media areas, padding, and text consistently.

These cards introduce the rewards visually. **Do not imply that prizes are guaranteed, automatically redeemed, awarded to particular leaderboard ranks, or earned at invented thresholds.** Use only rules confirmed by existing project content or the user. If the badge's 25-point association cannot be verified, omit the numerical claim from the interface and flag it in the implementation report.

### Image presentation

- Use actual inspected assets from `assets\whats_on_today`; reuse suitable existing assets elsewhere only when their identity is verified and needed.
- Preserve natural image proportions. Use an equal-sized media frame with contained images and a suitable neutral background where necessary. Do not stretch images or crop away products, poster text, or other essential content merely to fill a frame.
- If an asset contains multiple products or is unsuitable for a dedicated card, report that limitation rather than implying it is a standalone photo of the requested item.
- Provide concise, meaningful alt text based on what is actually visible. Do not add unsupported prize claims to alt text.

### Preserve the rest of the page

Keep the existing day/date navigation, daily schedule, **What Will You Try**, and all other content and functionality intact. Do not remove, rewrite, reorder, or replace unrelated sections. Preserve selected-day behavior, links, controls, and any existing dynamic state. Keep existing navigation in its established position while placing the reward row immediately after the hero; inspect the current structure to avoid displacing controls accidentally.

## 3. Main page preview

Retain the existing **one large image card plus two smaller image cards** composition. Replace placeholder imagery with the most visually engaging, relevant real images available after inspection.

Preferred editorial selection:

| Card role | Preferred subject | Caption direction |
| --- | --- | --- |
| Large card | A visually compelling exhibit/activity photograph | “See the unexpected.” |
| Small card | A game interface or game-related image | “Make your next move.” |
| Small card | Rewards/prizes | “Play & win.” where accurate |

This is a preference, not a requirement to force unsuitable assets into those roles. Choose based on actual image quality, relevance, and composition. An alternative arrangement is acceptable when it produces a stronger, accurate preview; document the selection and rationale.

- Do not automatically reuse the official poster in this preview. Prefer imagery that makes the exhibit, game, and rewards tangible.
- Existing captions **“See the unexpected.”**, **“Make your next move.”**, and **“Solve it together.”** may remain where relevant. Adapt the rewards caption to **“Play & win.”** only if that accurately reflects the confirmed activity; otherwise use neutral wording such as “Explore the rewards.”
- Keep captions truthful to both the image and linked destination. Do not describe a product photo as an exhibit or a static illustration as a working game interface.
- Preserve the cards' navigational interactions and existing intended destinations. Do not introduce dead links, nested interactive controls, or decorative cards that silently lose their previous click behavior.
- Preserve the established desktop composition and its existing sensible mobile adaptation. Do not rebuild unrelated main-page sections.

## 4. Implementation guidance

### Fit the existing codebase

- Prefer focused edits to the existing components and styles. Reuse established tokens, breakpoints, typography, card treatments, and spacing conventions.
- Keep the aesthetic consistent: blue and white foundations, subtle lavender accents, readable contrast, restrained borders/shadows, and clear visual hierarchy.
- Share asset metadata or reward data between the main page and Explore page where it avoids duplication. Keep page-specific captions and presentation configurable. Do not introduce a broad abstraction or new dependency solely for these changes.
- Preserve all unrelated features, application state, routes, and existing user work.

### Responsive behavior and accessibility

- Desktop: retain the two-column hero and four equal reward cards in a row when space permits.
- Smaller screens: allow the hero to stack and the reward grid to become two columns, then one column if needed for readability. Preserve the reward order. Avoid horizontal overflow, cramped captions, and unreadably small poster text.
- Keep the main preview's large/small hierarchy on wide screens and a readable stacked or existing responsive layout on mobile.
- Use semantic headings and appropriate link/button elements. Preserve keyboard navigation and visible focus states. Keep accessible names descriptive, and do not rely on hover alone to reveal essential information.

### Image performance

- Use the project's existing image pipeline where available. Optimize oversized source assets into appropriately sized derivatives using established project tooling; retain originals and avoid unnecessary destructive edits.
- Use efficient supported formats and responsive sources where useful. Preserve enough quality for product details and poster text.
- Supply image dimensions or stable aspect-ratio containers to avoid layout shifts. Lazy-load below-the-fold images where appropriate; avoid indiscriminate lazy-loading of the visible hero.
- Verify that all final asset references resolve in both development and the production build. Do not reference local absolute filesystem paths in the website.

## 5. Verification and acceptance criteria

### Functional and build checks

- Run the relevant existing tests, lint/type checks, and production build supported by the project. Add focused coverage only where changed behavior warrants it.
- Verify day/date selection and daily schedule content still work as before.
- Verify What Will You Try and other existing sections remain present and functional.
- Follow the main preview cards and affected navigation links; confirm destinations and keyboard behavior.
- Check for missing images, console errors, and failed asset requests.
- If a check cannot run, report the exact reason and what remains unverified. Do not claim a pass based only on reading code.

### Visual QA

Review the running pages at a representative desktop width (about 1440px), a tablet/intermediate width (about 768px), and a narrow mobile width (about 390px). Also check a narrower mobile viewport if the layout looks tight.

Confirm:

- The Explore hero shows the existing headline/introduction/date at left and the official poster at right on desktop.
- The four reward cards follow the hero immediately, in the specified order, and have equal outer dimensions within each row.
- Every image matches its label, keeps its proportions, and avoids damaging crops.
- The main preview still reads as one large card and two smaller cards on desktop, using verified real imagery.
- Typography, spacing, color, focus states, and contrast remain consistent with the site.
- Both pages have no horizontal overflow, clipped text, overlapping controls, or unexpected layout shifts.
- Existing sections and interactions remain intact at desktop and mobile sizes.

Capture before/after screenshots where practical, or at minimum final desktop and mobile screenshots of both affected areas. Inspect the screenshots rather than merely generating them.

### Final change review

Review `git diff` and repository status before finishing. Check for accidental unrelated edits, removed content, broken paths, generated clutter, unnecessarily large assets, and changes to user work. Resolve issues within this task's scope.

## 6. Completion report to the user

Provide a concise implementation report containing:

1. What changed on the Explore page and the main preview.
2. Files changed, with their purpose.
3. Actual image paths selected and their assigned roles; note any optimized derivatives.
4. Whether the badge's 25-point association was confirmed, and the evidence used or the numerical claim omitted.
5. Tests/build commands run and results, plus desktop/mobile visual QA results and screenshot locations where available.
6. Missing or unsuitable assets, unresolved content questions, and any remaining limitations.
7. Confirmation that the final diff was reviewed and unrelated features/user changes were preserved, supported by the checks actually performed.

Do not report the work as fully complete if required imagery is missing or essential behavior remains unverified. Implement the confirmed portions, clearly identify any remaining gap, and state exactly what asset or information is needed.
