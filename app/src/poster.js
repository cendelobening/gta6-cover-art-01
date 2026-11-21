// poster.js — builds and updates the poster DOM: a stack of full-bleed photo
// panels edge to edge inside a thin grade-tinted frame, with the huge gradient
// title and the tagline overlaid on the lower part of the photo field. There
// is deliberately no footer band and no solid title bar anywhere: the lettering
// floats over the photos, held up only by a soft radial scrim behind it.

import { GRADES, LAYOUTS } from './grades.js';

export const FRAME_PX = 10;

export function createPoster(root) {
  root.classList.add('poster');
  const field = document.createElement('div');
  field.className = 'poster-field';
  const scrim = document.createElement('div');
  scrim.className = 'poster-scrim';
  const vignette = document.createElement('div');
  vignette.className = 'poster-vignette';
  const titleZone = document.createElement('div');
  titleZone.className = 'poster-title-zone';
  const title = document.createElement('div');
  title.className = 'poster-title';
  const tagline = document.createElement('div');
  tagline.className = 'poster-tagline';
  titleZone.append(title, tagline);
  root.append(field, vignette, scrim, titleZone);

  const state = {
    layout: 'hero-trio',
    grade: 'sunset',
    size: { w: 1280, h: 720 },
    title: 'VICE CITY HEAT',
    tagline: 'ONE LAST SCORE AT SUNSET',
    assignment: [], // per slot: index into photos
    photos: [], // per photo: { src, label, zoom, ox, oy }
    onSelectSlot: null,
    selectedSlot: 0,
  };

  function panelRects() {
    return LAYOUTS[state.layout].panels;
  }

  function renderPanels() {
    field.textContent = '';
    panelRects().forEach((rect, slot) => {
      const panel = document.createElement('button');
      panel.type = 'button';
      panel.className = 'panel' + (slot === state.selectedSlot ? ' is-selected' : '');
      panel.style.left = rect.x * 100 + '%';
      panel.style.top = rect.y * 100 + '%';
      panel.style.width = rect.w * 100 + '%';
      panel.style.height = rect.h * 100 + '%';
      panel.dataset.slot = String(slot);
      const photo = state.photos[state.assignment[slot] ?? 0];
      if (photo) {
        const img = document.createElement('img');
        img.src = photo.src;
        img.alt = photo.label || '';
        img.draggable = false;
        const zoom = photo.zoom ?? 1;
        const ox = photo.ox ?? 0;
        const oy = photo.oy ?? 0;
        img.style.transform = `scale(${zoom}) translate(${ox}%, ${oy}%)`;
        panel.append(img);
      }
      const badge = document.createElement('span');
      badge.className = 'panel-badge';
      badge.textContent = String(slot + 1);
      panel.append(badge);
      panel.addEventListener('click', () => {
        state.selectedSlot = slot;
        renderPanels();
        if (state.onSelectSlot) state.onSelectSlot(slot);
      });
      field.append(panel);
    });
  }

  function render() {
    const grade = GRADES[state.grade];
    root.style.width = state.size.w + 'px';
    root.style.height = state.size.h + 'px';
    root.style.background = grade.frame;
    root.style.setProperty('--grade-filter', grade.filter);
    root.style.setProperty('--stop-a', grade.titleStops[0]);
    root.style.setProperty('--stop-b', grade.titleStops[1]);
    root.style.setProperty('--stop-c', grade.titleStops[2]);
    root.style.setProperty('--tagline-color', grade.tagline);
    root.style.setProperty('--title-size', state.size.h * 0.124 + 'px');
    root.style.setProperty('--tagline-size', Math.max(15, state.size.h * 0.026) + 'px');
    vignette.style.opacity = String(grade.vignette);
    title.textContent = state.title;
    tagline.textContent = state.tagline;
    // Shrink the title only when a long caption would overflow the field:
    // the base size stays 0.124 x poster height whenever the words fit.
    title.style.fontSize = '';
    const baseSize = state.size.h * 0.124;
    const available = state.size.w - FRAME_PX * 2 - 14;
    if (title.scrollWidth > available) {
      title.style.fontSize = Math.floor(baseSize * (available / title.scrollWidth)) + 'px';
    }
    renderPanels();
  }

  return { state, render, renderPanels, panelRects };
}
