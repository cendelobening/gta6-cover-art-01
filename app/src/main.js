// Vice Cover Studio — wires the editor: layout, grade and caption controls,
// per-panel photo picking, drag-to-pan and scroll-to-zoom on the live preview,
// and PNG export in the three post sizes. A `?shot=` query sets up a fixed
// scene for a screenshot instead (./shots.js).
import { drawPoster, panelRects, SIZES, SAMPLES, LAYOUTS } from './cover.js';
import { runShot, distinctPanels } from './shots.js';

const canvas = document.getElementById('poster');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const zoomInput = document.getElementById('zoom');
const zoomVal = document.getElementById('zoomVal');
const panelLabel = document.getElementById('panelLabel');

/** The poster state: layout, grade, size, caption and one entry per panel. */
const state = {
  layout: 'hero-duo',
  grade: 'sunset',
  size: '1080x1080',
  title: 'Neon Heist',
  subtitle: 'One last score under the Vice sun',
  panels: [
    { photo: null, zoom: 1, ox: 0, oy: 0 },
    { photo: null, zoom: 1, ox: 0, oy: 0 },
    { photo: null, zoom: 1, ox: 0, oy: 0 },
    { photo: null, zoom: 1, ox: 0, oy: 0 },
  ],
  selected: 0,
};

/** Loaded photos by key: the four built-in samples plus anything uploaded. */
const photos = {};
let uploadCount = 0;

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** The state drawPoster wants: panels with their photo images resolved. */
function renderState() {
  return {
    ...state,
    panels: state.panels.map((p) => ({ ...p, photo: p.photo ? photos[p.photo] || null : null })),
  };
}

function redraw() {
  drawPoster(canvas, renderState());
}

/** Resizes the preview canvas to the export aspect at a handy preview scale. */
function resizePreview() {
  const { w, h } = SIZES[state.size];
  const scale = w >= h ? 880 / w : 880 / h;
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  redraw();
}

/** Marks the selected panel in the editor and syncs its controls. */
function syncPanelEditor() {
  const panel = state.panels[state.selected];
  panelLabel.textContent = `Panel ${state.selected + 1} of ${panelRects(state.layout, canvas.width, canvas.height).length}`;
  zoomInput.value = String(panel.zoom);
  zoomVal.textContent = `${Math.round(panel.zoom * 100)}%`;
  document.querySelectorAll('#photoPick .photo-btn[data-photo]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.photo === panel.photo);
  });
}

/** Assigns a photo key to the selected panel (or every panel). */
function assignPhoto(key, all = false) {
  const targets = all ? state.panels : [state.panels[state.selected]];
  targets.forEach((p) => { p.photo = key; p.zoom = 1; p.ox = 0; p.oy = 0; });
  syncPanelEditor();
  redraw();
}

// --- Top controls: layout, grade, size, caption ---
document.getElementById('layouts').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-layout]');
  if (!btn) return;
  state.layout = btn.dataset.layout;
  state.selected = 0;
  document.querySelectorAll('.layout-btn').forEach((b) => b.classList.toggle('active', b === btn));
  syncPanelEditor();
  redraw();
});

document.getElementById('grades').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-grade]');
  if (!btn) return;
  state.grade = btn.dataset.grade;
  document.querySelectorAll('.grade-btn').forEach((b) => b.classList.toggle('active', b === btn));
  redraw();
});

document.querySelector('.sizes').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-size]');
  if (!btn) return;
  state.size = btn.dataset.size;
  document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('active', b === btn));
  resizePreview();
});

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

// --- Panel editor: photos, zoom, fill-all ---
document.getElementById('photoPick').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-photo]');
  if (btn) assignPhoto(btn.dataset.photo);
});

document.getElementById('clearPhoto').addEventListener('click', () => assignPhoto(null));
document.getElementById('fillAll').addEventListener('click', () => {
  assignPhoto(state.panels[state.selected].photo, true);
});

document.getElementById('upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const key = `user${++uploadCount}`;
  photos[key] = await loadImage(URL.createObjectURL(file));
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'photo-btn';
  btn.dataset.photo = key;
  const thumb = document.createElement('img');
  thumb.src = URL.createObjectURL(file);
  thumb.alt = `Uploaded photo ${uploadCount}`;
  btn.append(thumb, document.createTextNode(`Photo ${uploadCount}`));
  document.getElementById('photoPick').insertBefore(btn, document.getElementById('clearPhoto'));
  assignPhoto(key);
  status.textContent = `Loaded ${file.name} — it never leaves this machine.`;
});

zoomInput.addEventListener('input', () => {
  const panel = state.panels[state.selected];
  panel.zoom = Number(zoomInput.value);
  zoomVal.textContent = `${Math.round(panel.zoom * 100)}%`;
  redraw();
});

// --- Drag to pan, scroll to zoom, click to select a panel ---
function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = ((clientX - r.left) / r.width) * canvas.width;
  const y = ((clientY - r.top) / r.height) * canvas.height;
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  return { index: rects.findIndex((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h), x, y };
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  if (hit.index < 0) return;
  state.selected = hit.index;
  syncPanelEditor();
  drag = { x: hit.x, y: hit.y, moved: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const hit = panelAt(e.clientX, e.clientY);
  const panel = state.panels[state.selected];
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const rect = rects[state.selected];
  if (Math.abs(hit.x - drag.x) + Math.abs(hit.y - drag.y) > 2) drag.moved = true;
  panel.ox += (hit.x - drag.x) / rect.w;
  panel.oy += (hit.y - drag.y) / rect.h;
  drag = { ...drag, x: hit.x, y: hit.y };
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const hit = panelAt(e.clientX, e.clientY);
  if (hit.index >= 0) state.selected = hit.index;
  const panel = state.panels[state.selected];
  panel.zoom = Math.max(1, Math.min(2.5, panel.zoom - Math.sign(e.deltaY) * 0.08));
  syncPanelEditor();
  redraw();
}, { passive: false });

// --- Export: render at full size on an offscreen canvas and download a PNG ---
document.getElementById('export').addEventListener('click', () => {
  const { w, h } = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawPoster(off, renderState());
  off.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${state.size}.png`;
    a.click();
    status.textContent = `Saved vice-cover-${state.size}.png (${w} × ${h}).`;
    setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
  }, 'image/png');
});

/** Applies a shot scene's state, for screenshots. Panels are de-duplicated
 *  first: a poster never shows the same photo twice, so a repeated request
 *  is swapped for the next unused sample before anything is assigned. */
export function applyScene(scene) {
  if (scene.layout) state.layout = scene.layout;
  if (scene.grade) state.grade = scene.grade;
  if (scene.size) state.size = scene.size;
  if (scene.title !== undefined) { state.title = scene.title; titleInput.value = scene.title; }
  if (scene.subtitle !== undefined) { state.subtitle = scene.subtitle; subtitleInput.value = scene.subtitle; }
  if (scene.panels) {
    const requested = scene.panels.map((entry) => (typeof entry === 'string' ? entry : entry?.photo)).filter(Boolean);
    const filled = distinctPanels(requested, state.layout);
    state.panels = filled.map((entry, i) => {
      if (typeof entry === 'string') {
        const spec = scene.panels[i] && typeof scene.panels[i] === 'object' ? scene.panels[i] : {};
        return {
          photo: photos[entry] ? entry : null,
          zoom: spec.zoom ?? 1,
          ox: spec.ox ?? 0,
          oy: spec.oy ?? 0,
        };
      }
      return { photo: null, zoom: 1, ox: 0, oy: 0 };
    });
    while (state.panels.length < LAYOUTS[state.layout].length) {
      state.panels.push({ photo: null, zoom: 1, ox: 0, oy: 0 });
    }
  }
  document.querySelectorAll('.layout-btn').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('.grade-btn').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
  resizePreview();
  syncPanelEditor();
}

// --- Boot: load the samples, then draw (or run the screenshot scene) ---
const shot = new URLSearchParams(location.search).get('shot');
async function boot() {
  photos.neon = await loadImage('samples/neon.jpg');
  photos.street = await loadImage('samples/street.jpg');
  photos.pier = await loadImage('samples/pier.jpg');
  photos.boulevard = await loadImage('samples/boulevard.jpg');
  await document.fonts.load('700 40px "Poster Bold"');
  await document.fonts.ready;
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), applyScene);
  } else {
    // A one-click start: distinct samples across the panels, never repeated.
    const count = LAYOUTS[state.layout].length;
    state.panels = SAMPLES.slice(0, count).map((photo) => ({ photo, zoom: 1, ox: 0, oy: 0 }));
    while (state.panels.length < 4) state.panels.push({ photo: null, zoom: 1, ox: 0, oy: 0 });
    state.selected = 0;
  }
  resizePreview();
  syncPanelEditor();
}
boot();
