# Contact Data Update AdSense Readiness

## User request

Use the provided X account for contact, skip additional UI effects, and determine whether data update automation and AdSense setup can be handled here.

## What changed

- Updated Contact page text to direct correction requests, bug reports, data issues, and rights inquiries to `https://x.com/Eneas_Tarkover`.
- Made URLs in static pages clickable.
- Added `npm run update:data` as the fixed game data and shared image update command.
- Updated README to use `npm run update:data` for data refreshes.
- Added an AdSense replacement comment in `AdPlaceholder`.
- Documented that AdSense cannot be fully enabled until the publisher id and ad unit code are provided.

## Verification performed

- Ran `npm run build` successfully.
- Confirmed README, package scripts, contact text, and AdSense notes were updated.

## Follow-up notes

- Data update can now be handled with:
  `npm run update:data`
  `npm run build`
- AdSense still needs the real publisher id, ad unit snippet, and final `ads.txt` publisher record.
