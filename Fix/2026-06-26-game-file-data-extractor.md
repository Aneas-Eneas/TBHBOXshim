# Game File Data Extractor

## User request

Use the permitted local Task Bar Hero game files as the simulator data source, and handle the game-file extraction work here.

## What changed

- Added `scripts/extract_tbh_game_data.py` to read Unity TextAssets from the local TaskbarHero install.
- Added `scripts/run_game_data_extract.mjs` so `npm run extract:game-data` can find a usable Python executable.
- Generated game-derived JSON:
  - `src/data/items.json`
  - `src/data/items.gear.lv80.json`
  - `src/data/items.materials.json`
  - `src/data/chests.json`
  - `src/data/stages.json`
  - `src/data/meta.json`
  - `src/data/game_extract_manifest.json`
  - matching runtime files under `public/data`
- Updated static meta text to game-file source and version `v1.00.21`.
- Updated image handling so explicit `imagePath: null` stays as no image instead of falling back to existing files.
- Updated README with the game-file extraction workflow.

## Verification performed

- Ran `npm run extract:game-data`.
- Confirmed generated counts:
  - 5117 items
  - 59 chests
  - 120 stages
  - 0 missing reward item references
  - 4 difficulties: Normal, Nightmare, Hell, Torment
- Confirmed generated image paths are disabled by default, while `sourceIconPath` is preserved.
- Ran `npm run build` successfully.

## Follow-up notes

- Unity sprite/texture objects are present, but their names are not directly mapped to item ids in the inspected files. Automatic game-file icon extraction is not reliable yet.
- Existing item images can still be opted into with `npm run extract:game-data -- --use-existing-images`, but the default now avoids mixing non-game-file image sources.
