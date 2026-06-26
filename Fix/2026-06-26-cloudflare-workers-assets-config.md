# Cloudflare Workers Assets Config

## User request

Cloudflare deployment succeeded at build time but failed during deploy because the generated `wrangler.jsonc` was missing the required `assets.directory` property.

## What changed

- Added `wrangler.jsonc`.
- Configured Workers static assets to deploy `./dist`.
- Enabled SPA fallback with `not_found_handling: "single-page-application"`.

## Verification performed

- Pending GitHub push and Cloudflare redeploy.

## Follow-up notes

- Cloudflare settings can keep `Build command: npm run build` and `Deploy command: npx wrangler deploy`.
