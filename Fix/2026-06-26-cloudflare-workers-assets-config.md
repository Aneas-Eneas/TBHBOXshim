# Cloudflare Workers Assets Config

## User request

Cloudflare deployment succeeded at build time but failed during deploy because the generated `wrangler.jsonc` was missing the required `assets.directory` property.

## What changed

- Added `wrangler.jsonc`.
- Configured Workers static assets to deploy `./dist`.
- Enabled SPA fallback with `not_found_handling: "single-page-application"`.
- Added `wrangler` as a dev dependency so Cloudflare runs a pinned deploy tool.
- Removed `public/_redirects` because Workers assets rejected the Pages-style SPA redirect as an infinite loop.

## Verification performed

- Ran `npm run build`.
- Ran `npx wrangler deploy --dry-run --outdir tmp\wrangler-dry-run`.

## Follow-up notes

- Cloudflare settings can keep `Build command: npm run build` and `Deploy command: npx wrangler deploy`.
