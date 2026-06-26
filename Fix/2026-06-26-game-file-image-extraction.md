# Game File Image Extraction

## User request

Check whether item images can be obtained from the local Task Bar Hero game files.

## What changed

- Added `--extract-images` to `scripts/extract_tbh_game_data.py`.
- Added `--overwrite-images` for replacing generated PNGs when re-extracting.
- The extractor now maps item `sourceIconPath` values to Unity `Sprite` names and can save PNGs to `public/assets/items/{item_id}.png`.
- Updated README and `public/assets/items/README.md` with the image extraction command.

## Verification performed

- Confirmed local game sprites exist for item icon names such as `Item_110001`, `Item_120001`, `SWORD_300001`, and `HELMET_500003`.
- Confirmed single-sprite PNG export works for `Item_110001` and `SWORD_300001`.
- Ran `npm run extract:game-data -- --extract-images --overwrite-images`.
- Confirmed 5117 PNG files were generated under `public/assets/items`.
- Confirmed `src/data/items.json` and `public/data/items.json` now contain 5117 item records with `imagePath`.
- Confirmed generated game data still has 59 chests and 120 stages.

## Follow-up notes

- Full extraction command: `npm run extract:game-data -- --extract-images --overwrite-images`.
- Game icons are exported as small pixel-art PNGs from Unity sprites and are intended to be scaled by the UI.
