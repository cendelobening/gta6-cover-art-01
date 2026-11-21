// main.js — the Vice Cover Studio editor. Wires the poster to the controls:
// click a panel slot, then click a sample photo (or upload your own) to assign
// it; edit the title and tagline; switch layout, poster size and grade;
// randomize for a fresh combination; export a full-resolution PNG.
// The ?shot=cover / ?shot=editor URL modes frame the app for screenshots.

import { GRADES, LAYOUTS, SIZES, SAMPLES, defaultAssignment } from './grades.js';
import { createPoster } from './poster.js';
import { exportPosterPng } from './export.js';

const posterEl = document.getElementById('poster');
const poster = createPoster(posterEl);
const state = poster.state;

state.photos = SAMPLES.map((s) => ({ src: s.src, label: s.label, zoom: 1, ox: 0, oy: 0 }));
state.assignment = defaultAssignment(poster.panelRects().length, state.photos.length);

const titleInput = document.getElementById('title-input');
const taglineInput = document.getElementById('tagline-input');
const layoutSelect = document.getElementById('layout-select');
const sizeSelect = document.getElementById('size-select');
const gradeSelect = document.getElementById('grade-select');
const thumbsEl = document.getElementById('thumbs');
const slotLabel = document.getElementById('slot-label');
const zoomInput = document.getElementById('zoom-input');
const oxInput = document.getElementById('ox-input');
const oyInput = document.getElementById('oy-input');
const uploadInput = document.getElementById('upload-input');
const stageEl = document.getElementById('stage');

function fillSelect(select, table) {
  for (const [key, entry] of Object.entries(table)) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = entry.label;
    select.append(option);
  }
}
fillSelect(layoutSelect, LAYOUTS);
fillSelect(sizeSelect, SIZES);
fillSelect(gradeSelect, GRADES);
layoutSelect.value = state.layout;
sizeSelect.value = 'landscape';
gradeSelect.value = state.grade;

function syncCropControls() {
  const photo = state.photos[state.assignment[state.selectedSlot] ?? 0];
  if (!photo) return;
  zoomInput.value = String(photo.zoom ?? 1);
  oxInput.value = String(photo.ox ?? 0);
  oyInput.value = String(photo.oy ?? 0);
  slotLabel.textContent = `Panel ${state.selectedSlot + 1} — ${photo.label || 'photo'}`;
}

function renderThumbs() {
  thumbsEl.textContent = '';
  state.photos.forEach((photo, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb';
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.label || '';
    const caption = document.createElement('span');
    caption.textContent = photo.label || `Photo ${index + 1}`;
    button.append(img, caption);
    button.addEventListener('click', () => {
      state.assignment[state.selectedSlot] = index;
      poster.render();
      syncCropControls();
    });
    thumbsEl.append(button);
  });
}

function fitStage() {
  if (document.body.classList.contains('shot-cover')) return;
  const available = Math.min(stageEl.clientWidth - 8, 1060);
  const scale = Math.min(1, available / state.size.w, (window.innerHeight * 0.86) / state.size.h);
  posterEl.style.transform = `scale(${scale})`;
  stageEl.style.height = state.size.h * scale + 16 + 'px';
}

function applyAndFit() {
  poster.render();
  fitStage();
}

state.onSelectSlot = () => syncCropControls();

titleInput.addEventListener('input', () => { state.title = titleInput.value; poster.render(); });
taglineInput.addEventListener('input', () => { state.tagline = taglineInput.value; poster.render(); });
layoutSelect.addEventListener('change', () => {
  state.layout = layoutSelect.value;
  state.assignment = defaultAssignment(poster.panelRects().length, state.photos.length);
  state.selectedSlot = 0;
  applyAndFit();
  syncCropControls();
});
sizeSelect.addEventListener('change', () => {
  state.size = SIZES[sizeSelect.value];
  applyAndFit();
});
gradeSelect.addEventListener('change', () => {
  state.grade = gradeSelect.value;
  poster.render();
});

function bindCrop(input, key, parse) {
  input.addEventListener('input', () => {
    const photo = state.photos[state.assignment[state.selectedSlot] ?? 0];
    if (!photo) return;
    photo[key] = parse(input.value);
    poster.renderPanels();
  });
}
bindCrop(zoomInput, 'zoom', (v) => Number(v));
bindCrop(oxInput, 'ox', (v) => Number(v));
bindCrop(oyInput, 'oy', (v) => Number(v));

uploadInput.addEventListener('change', () => {
  const file = uploadInput.files && uploadInput.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const slotPhoto = state.assignment[state.selectedSlot] ?? 0;
  state.photos[slotPhoto] = { src: url, label: file.name, zoom: 1, ox: 0, oy: 0 };
  poster.render();
  renderThumbs();
  syncCropControls();
});

const TITLE_IDEAS = ['VICE CITY HEAT', 'NEON CONFESSIONS', 'PALM TREE BANDITS', 'MIDNIGHT MARINA', 'SUNSET SYNDICATE', 'LOW RIDER LEGENDS'];
const TAGLINE_IDEAS = ['ONE LAST SCORE AT SUNSET', 'EVERY SAINT HAS A PAST', 'THE CITY NEVER SLEEPS IN', 'TRUST NOBODY AT GOLDEN HOUR', 'FORTUNE FAVOURS THE FAST', 'BACK WHERE THE NEON GLOWS'];
let pick = 0;
document.getElementById('randomize-btn').addEventListener('click', () => {
  pick = (pick + 1 + Math.floor(Math.random() * 3)) % TITLE_IDEAS.length;
  const gradeKeys = Object.keys(GRADES);
  const layoutKeys = Object.keys(LAYOUTS);
  state.grade = gradeKeys[Math.floor(Math.random() * gradeKeys.length)];
  state.layout = layoutKeys[Math.floor(Math.random() * layoutKeys.length)];
  state.title = TITLE_IDEAS[pick];
  state.tagline = TAGLINE_IDEAS[pick];
  const shuffled = state.photos.map((_, i) => i).sort(() => Math.random() - 0.5);
  state.assignment = defaultAssignment(poster.panelRects().length, state.photos.length).map((_, slot) => shuffled[slot % shuffled.length]);
  titleInput.value = state.title;
  taglineInput.value = state.tagline;
  gradeSelect.value = state.grade;
  layoutSelect.value = state.layout;
  applyAndFit();
  syncCropControls();
});

document.getElementById('export-btn').addEventListener('click', () => {
  exportPosterPng(state, poster.panelRects());
});

window.addEventListener('resize', fitStage);

// Screenshot / deep-link modes: ?shot=cover&title=..&layout=..&grade=..&size=..
const params = new URLSearchParams(location.search);
if (params.get('title')) { state.title = params.get('title'); titleInput.value = state.title; }
if (params.get('tagline')) { state.tagline = params.get('tagline'); taglineInput.value = state.tagline; }
if (params.get('layout') && LAYOUTS[params.get('layout')]) {
  state.layout = params.get('layout');
  layoutSelect.value = state.layout;
  state.assignment = defaultAssignment(poster.panelRects().length, state.photos.length);
}
if (params.get('grade') && GRADES[params.get('grade')]) { state.grade = params.get('grade'); gradeSelect.value = state.grade; }
if (params.get('size') && SIZES[params.get('size')]) { state.size = SIZES[params.get('size')]; sizeSelect.value = params.get('size'); }
const order = params.get('order');
if (order) {
  const wanted = order.split(',').map((id) => SAMPLES.findIndex((s) => s.id === id)).filter((i) => i >= 0);
  if (wanted.length) {
    state.photos = wanted.map((i) => ({ src: SAMPLES[i].src, label: SAMPLES[i].label, zoom: 1, ox: 0, oy: 0 }));
    while (state.photos.length < SAMPLES.length) {
      const missing = SAMPLES.find((s) => !state.photos.some((p) => p.label === s.label));
      if (!missing) break;
      state.photos.push({ src: missing.src, label: missing.label, zoom: 1, ox: 0, oy: 0 });
    }
    state.assignment = defaultAssignment(poster.panelRects().length, state.photos.length);
  }
}

renderThumbs();
applyAndFit();
syncCropControls();

if (params.get('shot') === 'cover') {
  document.body.classList.add('shot-cover');
  posterEl.style.transform = 'none';
} else if (params.get('shot') === 'editor') {
  document.body.classList.add('shot-editor');
}
window.__viceReady = true;
