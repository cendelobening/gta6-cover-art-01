// Fixed scenes for screenshots: ?shot=editor shows the editor with photos
// loaded; ?shot=cover shows the finished cover alone, at an export size.
// Query params: photo (sample for the hero), photo2 (sample for the small
// panels), panels (comma-separated sample names, one per panel), caption,
// sub, layout, grade, size, oy (hero pan, -0.5..0.5, positive shows the top
// of the photo). A poster never repeats a photo: defaults rotate distinct
// samples, and duplicates in `panels` are swapped for the next unused
// sample. window.__shotReady is set once the scene is painted, so a
// headless screenshot can wait for it.
import { LAYOUTS, SAMPLES } from './cover.js';

/** Distinct panels for a layout: the requested names in order, duplicates
 *  swapped for the next unused sample, then the rotation continues. */
export function distinctPanels(requested, layout) {
  const count = (LAYOUTS[layout] || LAYOUTS['key-art']).length;
  const used = new Set();
  const out = [];
  const pool = [...requested, ...SAMPLES];
  for (let i = 0; i < count; i++) {
    let pick = pool[i];
    if (used.has(pick)) {
      pick = SAMPLES.find((s) => !used.has(s));
    }
    if (pick === undefined) {
      out.push({ photo: null, skyline: true });
    } else {
      used.add(pick);
      out.push(pick);
    }
  }
  return out;
}

export async function runShot(shot, query, applyScene) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const layout = query.get('layout') ?? 'key-art';
  const hero = query.get('photo') ?? 'neon';
  const small = query.get('photo2') ?? 'street';
  const listed = query.get('panels');
  const requested = listed
    ? listed.split(',').map((name) => name.trim()).filter(Boolean)
    : [hero, small, ...SAMPLES.filter((s) => s !== hero && s !== small)];
  const panels = distinctPanels(requested, layout);
  const oy = Number(query.get('oy') ?? '0');
  applyScene({
    layout,
    grade: query.get('grade') ?? 'sunset',
    size: query.get('size') ?? '1920x1080',
    title: query.get('caption') ?? 'Neon Heist',
    subtitle: query.get('sub') ?? 'One last score under the Vice sun',
    panels: panels.map((entry, i) => {
      if (typeof entry === 'string') return i === 0 && oy ? { photo: entry, oy } : entry;
      return entry;
    }),
  });
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
