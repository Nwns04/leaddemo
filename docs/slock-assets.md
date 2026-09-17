# SLOCK asset plan

SLOCK now uses the supplied transparent PNG artwork through `/demos/slock/assets.json`. The coded fallbacks remain available if an optional file is removed or fails to load.

All artwork should be a single isolated object on a transparent background, with no embedded type, UI, or large environment. The coded fallback remains the source of truth for layout and accessibility.

| Filename | Purpose | Composition | Preferred ratio | Recommended size | Used in | Required |
| --- | --- | --- | --- | --- | --- | --- |
| `slock-mark.png` | Brand mark | Isolated SLOCK symbol | Square | 1024 x 1024 | Navigation, campaign boards | Optional |
| `agent-core.png` | Hero focal object | Abstract autonomous core, transparent | Square | 2048 x 2048 | Hero command core | Optional |
| `agent-research.png` | Research emblem | Isolated evidence / lens form | Square | 1024 x 1024 | Research card, directory | Optional |
| `agent-code.png` | Code emblem | Isolated interface / syntax form | Square | 1024 x 1024 | Code card, directory | Optional |
| `agent-market.png` | Market emblem | Isolated signal / chart form | Square | 1024 x 1024 | Market card, directory | Optional |
| `agent-community.png` | Community emblem | Isolated connected nodes form | Square | 1024 x 1024 | Community card, directory | Optional |
| `neural-orb.png` | Network depth object | Transparent orbital object, no background | Square | 2048 x 2048 | Hero and case study boards | Optional |
| `data-ring.png` | Shared memory focal object | Single circular data ring | Square | 1600 x 1600 | Memory section | Optional |
| `command-core.png` | Dashboard focal object | Isolated command center core | Square | 2048 x 2048 | Product and case study | Optional |
| `grid-fragment-01.png` | Ambient geometry | Small transparent technical grid fragment | Wide | 1600 x 900 | Hero and graphics | Optional |
| `grid-fragment-02.png` | Ambient geometry | Alternate isolated grid fragment | Wide | 1600 x 900 | Hero and graphics | Optional |
| `hologram-wave.png` | Motion accent | Transparent single wave / signal form | Wide | 2048 x 1024 | Coordination and campaign graphics | Optional |

## Placeholder behavior

- `AGENT CORE`, `DATA RING`, and other labels are fallback-only development placeholders.
- Placeholders preserve the intended aspect ratio, depth, position, and contrast of the future object.
- No artwork slot is required for the page to function.
- The current manifest points to all supplied PNGs; remove any value to exercise the coded fallback.
- Keep replacing artwork through the manifest and isolated slots; do not flatten copy into the artwork.

## Final artwork checklist

- Transparent PNG or WebP with clean edges.
- No typography, UI screenshots, fake partner names, token prices, or financial claims.
- One object per file, with generous transparent padding where motion needs room.
- Keep the visual language technical, minimal, dark, and editorial rather than neon or cyberpunk.