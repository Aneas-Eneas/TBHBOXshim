# Item Images

Add manually supplied item image files here using the item id as the filename.

Examples:

```text
300001.png
120001.png
```

Game-file generated item records use `imagePath: null` by default, so the UI shows a stable no-image placeholder.

To export optimized shared item sprites from local game files, run:

```bash
npm run extract:game-data -- --extract-images --overwrite-images --prune-images
```

Game-file icons are stored under `public/assets/items/icons/` and shared by every item that uses the same Unity sprite. If you manually add local images, regenerate with `npm run extract:game-data -- --use-existing-images` to point matching items at `/assets/items/{item_id}.png`.

Recommended image format:

- PNG
- Square canvas
- Transparent background when possible
- 128x128 px or larger
