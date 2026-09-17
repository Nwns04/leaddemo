# MUGI asset handoff

PNG masters live under `public/demos/mugi/` and remain intact. The reproducible optimizer writes production WebP derivatives under `public/demos/mugi/optimized/`; the build copies only the optimized tree into `dist/`.

## Mascot and motion assets

| File | Exact use | Suggested delivery |
| --- | --- | --- |
| `public/demos/mugi/mugi-main.png` → `optimized/mugi-main.webp` | Hero mascot/world artwork | Primary master reference; preserve character framing |
| `public/demos/mugi/mugi-running-cutout.png` → `optimized/mugi-running-cutout.webp` | Transparent scroll transition | Primary running transition artwork |
| `public/demos/mugi/mugi-space.png` → `optimized/mugi-space.webp` | Space transition / product story | Lazy-loaded below-fold artwork |
| `public/demos/mugi/mugi-trader.png` → `optimized/mugi-trader.webp` | Token/product feature frame | Lazy-loaded below-fold artwork |
| `public/demos/mugi/motion/launch-loop.png` → `optimized/motion/launch-loop.webp` | Motion still | Current supplied file is a still, not a video |

Run `node scripts/optimize-mugi-assets.mjs` after replacing or adding PNG masters. The script uses the installed ffmpeg/libwebp toolchain and never changes the source files.

## Final graphic artwork still needed

The launch-kit cards and case-study wall currently use authored layout mockups, not fabricated client deliverables. Replace them with final exports when ready:

- X header, 1500 × 500
- Telegram header, 1280 × 720
- DEX Screener header, 1200 × 300
- Token profile card, 1200 × 1200
- Launch announcement, 1080 × 1350
- Now live post, 1080 × 1080
- Meme template, 1080 × 1080 with editable safe area
- Partnership template, 1080 × 1350

Keep the concept-study disclaimer visible anywhere the final work is shown publicly.
