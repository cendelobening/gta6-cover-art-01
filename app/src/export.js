// export.js — composites the poster onto a canvas at its full native size and
// downloads it as a PNG. The canvas drawing mirrors the on-screen poster:
// cover-cropped photos with the grade's filter chain, the grade-tinted frame,
// the radial scrim, the tilted gradient title and the letterspaced tagline.

import { GRADES } from './grades.js';
import { FRAME_PX } from './poster.js';

const TITLE_FONT = '"Arial Black", Impact, "Segoe UI", sans-serif';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCoverPhoto(ctx, img, x, y, w, h, photo) {
  const zoom = photo.zoom ?? 1;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = x + (w - dw) / 2 + ((photo.ox ?? 0) / 100) * w;
  const dy = y + (h - dh) / 2 + ((photo.oy ?? 0) / 100) * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

export async function exportPosterPng(state, rects) {
  const { w, h } = state.size;
  const grade = GRADES[state.grade];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = grade.frame;
  ctx.fillRect(0, 0, w, h);
  const fx = FRAME_PX, fy = FRAME_PX, fw = w - FRAME_PX * 2, fh = h - FRAME_PX * 2;

  const images = [];
  for (const photo of state.photos) images.push(await loadImage(photo.src));

  ctx.save();
  ctx.filter = grade.filter;
  rects.forEach((rect, slot) => {
    const photoIndex = state.assignment[slot] ?? 0;
    drawCoverPhoto(ctx, images[photoIndex], fx + rect.x * fw, fy + rect.y * fh, rect.w * fw, rect.h * fh, state.photos[photoIndex]);
  });
  ctx.restore();

  if (grade.vignette > 0) {
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.36, w / 2, h / 2, Math.max(w, h) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(0,0,0,${grade.vignette})`);
    ctx.fillStyle = vg;
    ctx.fillRect(fx, fy, fw, fh);
  }

  // Soft radial scrim behind the title zone only — no band, no strip.
  const scrim = ctx.createRadialGradient(w / 2, h * 0.86, 10, w / 2, h * 0.86, w * 0.62);
  scrim.addColorStop(0, 'rgba(10,4,18,0.52)');
  scrim.addColorStop(0.55, 'rgba(10,4,18,0.28)');
  scrim.addColorStop(1, 'rgba(10,4,18,0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, w, h);

  const titleSize = h * 0.124;
  ctx.save();
  ctx.translate(w / 2, h * 0.845);
  ctx.rotate((-1.2 * Math.PI) / 180);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `italic 900 ${titleSize}px ${TITLE_FONT}`;
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = titleSize * 0.16;
  ctx.shadowOffsetY = titleSize * 0.07;
  const grad = ctx.createLinearGradient(0, -titleSize * 0.55, 0, titleSize * 0.55);
  grad.addColorStop(0, grade.titleStops[0]);
  grad.addColorStop(0.52, grade.titleStops[1]);
  grad.addColorStop(1, grade.titleStops[2]);
  ctx.fillStyle = grad;
  ctx.fillText(state.title, 0, 0, fw * 0.96);
  ctx.restore();

  const tagSize = Math.max(15, h * 0.026);
  ctx.save();
  ctx.translate(w / 2, h * 0.845 + titleSize * 0.72);
  ctx.rotate((-1.2 * Math.PI) / 180);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${tagSize}px "Segoe UI", Arial, sans-serif`;
  try { ctx.letterSpacing = Math.round(tagSize * 0.42) + 'px'; } catch { /* older engines */ }
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = tagSize * 0.5;
  ctx.fillStyle = grade.tagline;
  ctx.fillText(state.tagline.toUpperCase(), 0, 0, fw * 0.92);
  ctx.restore();

  const link = document.createElement('a');
  link.download = 'vice-cover.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
