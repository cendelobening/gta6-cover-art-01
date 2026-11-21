[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/cendelobening/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/cendelobening/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Cover Studio — GTA-style poster cover maker

Turn your photo and a caption into a multi-panel poster cover in the style of
GTA 6's posters, and export it as a PNG to share. Built for the
[Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) bounty on
[make.fun](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **Multi-panel posters** — four layouts (Hero + Duo, Hero + Trio, Split Duo,
  Quad) of full-bleed photos, edge to edge. Fill several panels with one
  photo or a different photo per panel — a poster never repeats a photo.
- **Any photo** — load your own from your machine (never uploaded) or start
  in one click with the four built-in sample photos. Click a panel to select
  it, drag the photo to position it, scroll or use the slider to zoom.
- **Colour grades** — Sunset, Neon, Vice Pink and Noir, each with its own
  filter, tint, frame and title gradient, painted over the whole poster
  with a retro striped sun disc. Noir skips the sun and gets a deep
  vignette instead, so its blacks stay rich and its highlights pop.
- **Bold poster lettering** — one huge gradient title overlaid on the
  artwork itself over a soft bottom scrim, with a clean letterspaced
  tagline beneath it. No footer band: nothing shrinks the photos and
  nothing clips the words.
- **Export** — 1080 × 1080, 1080 × 1350 and 1920 × 1080 PNG, rendered at
  full size on canvas. Live preview the whole way; three steps from photo
  to PNG.

## Screenshots

- `1-cover.jpg` — a wide 1920 × 1080 cover, Hero + Duo, Sunset grade
  ("Neon Heist")
- `2-editor.jpg` — the editor in the browser with photos loaded,
  Hero + Trio, Neon grade
- `3-cover.jpg` — a portrait 1080 × 1350 cover, Hero + Trio, Vice Pink
  grade ("Vice Heat")
- `4-cover.jpg` — a square 1080 × 1080 cover, Split Duo, Noir grade
  ("Midnight Run")

All four were taken with headless Chromium from the app itself (see
`shots.json` for the exact scenes); the photos are the kit's image-model
samples, free to use.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

The app is plain static files under `app/` — no build step, no network
request, no upload. Everything is original: no Rockstar Games logo,
wordmark, official artwork, character or font is used anywhere.

## Layout

- `app/index.html` — the editor page
- `app/style.css` — the editor theme
- `app/src/cover.js` — the poster render engine (layouts, grades, lettering)
- `app/src/main.js` — the editor wiring (panels, drag/zoom, export)
- `app/src/shots.js` — fixed scenes for screenshots
- `app/fonts/` — Liberation Sans Bold (SIL OFL 1.1) + licence text
- `app/samples/` — four image-model sample photos, free to use
- `main.ts` — hands the app in (copies `app/` + `screenshots/`, writes the dossier)
- `screenshots/` — the cover and editor screenshots

## License

MIT — see [LICENSE](LICENSE). SPDX-License-Identifier: MIT
