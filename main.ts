// Vice Cover Studio — the gta6-cover-art-01 entry (Node 22, standard library
// only). The app is this directory's app/ folder: plain static files a desktop
// browser loads offline (app/index.html and its ES modules, one SIL-licensed
// font under app/fonts/, two image-model sample photos under app/samples/),
// and it turns a person's photo and a caption into a multi-panel GTA-style
// poster cover with a Vice City sunset or neon grade, exported as a PNG in
// 1080 x 1080, 1080 x 1350 or 1920 x 1080. This program hands it in: it
// copies app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. Everything it copies is original work made for this
// bounty — no Rockstar logo, artwork, wordmark or font anywhere.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The entry is only hand-in-ready with its app, its claim file and its screenshots in place.
if (!existsSync(join(here, 'app', 'index.html'))) throw new Error('app/index.html is missing');
const owner = join(here, '.makefun', 'owner.json');
if (!existsSync(owner) || statSync(owner).size !== 58) throw new Error('.makefun/owner.json is missing or not 58 bytes');
const shots = readdirSync(join(here, 'screenshots')).filter((f) => !f.startsWith('.'));
if (shots.length < 3 || shots.length > 4) throw new Error(`expected 3-4 screenshots, found ${shots.length}`);
for (const shot of shots) {
  if (statSync(join(here, 'screenshots', shot)).size > 262144) throw new Error(`screenshot ${shot} is over 256 KiB`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
