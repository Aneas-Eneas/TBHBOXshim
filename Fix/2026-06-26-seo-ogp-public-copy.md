# SEO OGP Public Copy

## User request

Use the attached screenshot as the social sharing preview and improve the public-facing About, Privacy, Disclaimer, and Contact copy with Japanese as the source language.

## What changed

- Added `public/og.png` as a 1200x630 social sharing image based on the attached screenshot.
- Replaced `index.html` metadata with Japanese-first SEO text, OGP, and Twitter card metadata.
- Added `public/_redirects` for Cloudflare Pages SPA routing.
- Added `public/robots.txt`.
- Updated static public pages to support multiple paragraphs.
- Rewrote About, Privacy Policy, Disclaimer, and Contact copy in Japanese and added corresponding English translations.

## Verification performed

- Visually checked `public/og.png`.
- Ran `npm run build` successfully.
- Confirmed `dist/og.png`, `dist/_redirects`, and `dist/robots.txt` were generated.
- Confirmed built `dist/index.html` contains OGP and Twitter image metadata.

## Follow-up notes

- Add `sitemap.xml` after the final public domain is decided, because sitemap URLs should be absolute.
- If the final domain is known, update OGP image URLs to absolute URLs for maximum SNS crawler compatibility.
