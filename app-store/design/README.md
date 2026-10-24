# Store feature images

Three connected portrait panels combine original fal.ai background artwork with real native screenshots. Headlines are rendered as exact text, and the app content is cropped without retouching. The visual direction follows the BrickBuilder Warm Studio campaign, adapted to OpenCrossword's cream and forest-green palette.

Recreate with:

```sh
uv run --with pillow python app-store/design/render.py
uv run --with pillow python -m unittest discover -s app-store/design/tests -v
```

Install npm dependencies first; the renderer uses the app's licensed DM Sans fonts. Raw screenshots remain in `app-store/screenshots`. The renderer records source hashes and crops in `capture-manifest.json`. Provider details and cost are recorded in `generation-ledger.json`.

Only the three numbered PNGs in each `app-store/feature-images` device folder belong in App Store screenshot slots. The JPEG contact sheets are for review.
