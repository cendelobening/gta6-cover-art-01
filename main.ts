// main.ts — hands in the Vice Cover Studio entry for gta6-cover-art-01.
// Node 22, standard library only. Copies app/ and screenshots/ into the output
// directory (MAKEFUN_OUTPUT_DIR, or /output inside the grader) and writes
// dossier.json there with buildDossier from vendor/makefun-app.ts, using the
// scorer's own caps so a local run refuses whatever the gate would refuse.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The entry this program hands in.
const ENTRY = {
  name: 'Vice Cover Studio',
  tagline: 'Photos in, GTA-style multi-panel cover art out — a PNG in one click.',
  howToPlay:
    'Open the app, click a panel slot and assign any of the four sample photos (or upload your own photo for that panel), ' +
    'edit the title and tagline, switch between the Hero + Duo, Hero + Trio, Split and Quad layouts, ' +
    'pick a poster size (1280x720, 1024x1280 or 1024x1024) and one of the Sunset, Neon, Vice Pink or Noir grades, ' +
    'fine-tune each photo with the zoom and shift sliders, then press Export PNG to download the finished cover at full resolution.',
};

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

// A one-line receipt so a local trial run shows what was handed in. The grader
// ignores stdout; the dossier bytes above are the whole hand-in.
console.log(`${ENTRY.name} — ${ENTRY.tagline}`);
console.log(`dossier.json: ${dossier.length} bytes -> ${join(outputDir, 'dossier.json')}`);
