# Mobile Dev Server Access

## User request

Make the local development site open correctly from a phone and explain the remaining SEO/public-copy items.

## What changed

- Updated `npm run dev` to start Vite with `--host 0.0.0.0`.
- Added README instructions for opening the dev server from a phone on the same Wi-Fi.
- Restarted the local Vite dev server so it listens on LAN interfaces.

## Verification performed

- Confirmed port `5173` is listening on `0.0.0.0`.
- Confirmed local HTTP request to `http://127.0.0.1:5173/` returned `200`.
- Ran `npm run build` successfully.

## Follow-up notes

- Current PC Wi-Fi IP was `192.168.3.3` during verification.
- Phone URL: `http://192.168.3.3:5173/`.
- If the phone cannot connect, check same Wi-Fi and Windows Firewall private network access for Node/Vite.
