# Shared Icon Optimization

## User request

Optimize item images and check whether gear images differ by rarity. If rarity variants use different images, make them share images by level instead.

## What changed

- Confirmed gear images are already keyed by gear type and level, not by rarity.
- Updated `scripts/extract_tbh_game_data.py` so game sprites are exported once per unique `sourceIconPath`.
- Shared icons now live under `public/assets/items/icons/{sourceIconPath}.png`.
- Added `--prune-images` to remove old duplicated item-id PNGs before re-extraction.
- Updated README and `public/assets/items/README.md` to describe the shared-icon workflow.
- Regenerated item data and images with shared icon paths.

## Verification performed

- Confirmed `gear_type + level` groups with multiple icons: `0`.
- Re-ran `npm run extract:game-data -- --extract-images --overwrite-images --prune-images`.
- Confirmed 5117 items link to images.
- Confirmed unique image paths: 458.
- Confirmed `public/assets/items/icons` contains 458 PNG files.
- Confirmed root `public/assets/items` no longer contains old item-id PNG files.
- Ran `npm run build` successfully.
- Confirmed `dist/assets/items/icons` contains 458 PNG files.

## Follow-up notes

- This reduces image files from 5117 duplicated PNGs to 458 shared PNGs.
- Multiple rarities and market variants now point to the same icon when the game uses the same Unity sprite.
