# UI usability update

## User request

Improve the hard-to-use simulator UI.

## What changed

- Reworked the simulator controls into larger segmented buttons for category, difficulty, ACT, and stage selection.
- Added a visible selected-route badge and clearer chest/open/result sections.
- Improved result cards with compact run stats before the result list.
- Fixed mobile horizontal overflow on the home hero and simulator panels.
- Updated the dev script to use Vite's native config loader so `npm run dev` starts in this workspace.

## Verification performed

- Ran `npm run build`.
- Opened `http://127.0.0.1:5173/` in the in-app browser.
- Verified Tailwind utilities are applied after restarting the dev server.
- Checked desktop layout.
- Checked mobile viewport at 390x844.
- Confirmed page-level horizontal scroll is removed on mobile.
- Clicked `10 Opens` and confirmed 10 result cards plus item and rarity summaries render.

## Follow-up notes

- The probability table still scrolls horizontally inside its own container on mobile. This is intentional for readable table columns.
