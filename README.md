# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/cendelobening/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/cendelobening/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Cover Studio is an offline browser app that turns photos and a caption into GTA 6-style multi-panel cover-art posters and exports a PNG. The poster is a stack of full-bleed photo panels edge to edge inside a thin grade-tinted frame, with a huge gradient title and a letterspaced tagline overlaid on the lower photo field — no footer band, no title bar. Four layouts (Hero + Duo, Hero + Trio, Split, Quad), three poster sizes (1280 × 720, 1024 × 1280, 1024 × 1024) and four colour grades (Sunset, Neon, Vice Pink, Noir). Click a panel to assign any of the four bundled sample photos or upload your own, fine-tune each photo with zoom and shift sliders, edit the lettering, randomize for a fresh combination, and export the finished cover at full resolution. The four sample photos are procedural scenes painted by `generate-samples.ts`, a Node standard-library software rasterizer with its own JPEG encoder. No build step, no network, no external assets.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. To hand the entry in: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=jme44qjv&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
