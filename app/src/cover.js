// Vice Cover Studio — the poster render engine. drawPoster paints the whole
// multi-panel cover onto any 2D canvas: photo panels with per-panel crop and
// zoom, a Vice City sunset / neon colour grade, a retro sun disc, and bold
// poster lettering. Everything it draws is original; no game artwork, logo
// or wordmark is used anywhere.

/** Poster layouts: panel rectangles as fractions of the poster, in order. */
export const LAYOUTS = {
  'hero-duo': [
    { x: 0, y: 0, w: 1, h: 0.6 },
    { x: 0, y: 0.6, w: 0.5, h: 0.4 },
    { x: 0.5, y: 0.6, w: 0.5, h: 0.4 },
  ],
  'hero-trio': [
    { x: 0, y: 0, w: 1, h: 0.58 },
    { x: 0, y: 0.58, w: 1 / 3, h: 0.42 },
    { x: 1 / 3, y: 0.58, w: 1 / 3, h: 0.42 },
    { x: 2 / 3, y: 0.58, w: 1 / 3, h: 0.42 },
  ],
  split: [
    { x: 0, y: 0, w: 0.5, h: 1 },
    { x: 0.5, y: 0, w: 0.5, h: 1 },
  ],
  quad: [
    { x: 0, y: 0, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
  ],
};

/** Colour grades: a canvas filter per photo plus a tint painted over the poster. */
export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.3) contrast(1.08) sepia(0.22)',
    tint: ['rgba(255, 122, 26, 0.16)', 'rgba(255, 45, 120, 0.22)'],
  },
  neon: {
    label: 'Neon',
    filter: 'saturate(1.6) contrast(1.15) hue-rotate(-12deg)',
    tint: ['rgba(0, 229, 255, 0.14)', 'rgba(255, 0, 170, 0.20)'],
  },
  vice: {
    label: 'Vice Pink',
    filter: 'saturate(1.5) contrast(1.1) sepia(0.14)',
    tint: ['rgba(255, 120, 220, 0.20)', 'rgba(150, 40, 255, 0.22)'],
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(1) contrast(1.25) brightness(0.92)',
    tint: ['rgba(20, 20, 40, 0.10)', 'rgba(0, 0, 0, 0.28)'],
  },
};

/** Export sizes, in pixels. */
export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
};

/** Panel rectangles in pixels for a poster of size w x h and a layout name.
 *  Panels sit inside a white poster border, with white gutters between them. */
export function panelRects(layout, w, h) {
  const g = Math.max(2, Math.round(Math.min(w, h) * 0.012));
  const ix = g;
  const iy = g;
  const iw = w - 2 * g;
  const ih = h - 2 * g;
  return LAYOUTS[layout].map((p) => ({
    x: Math.round(ix + p.x * iw) + (p.x > 0 ? g : 0),
    y: Math.round(iy + p.y * ih) + (p.y > 0 ? g : 0),
    w: Math.round(p.w * iw) - (p.x > 0 ? g : 0) - (p.x + p.w < 1 ? g : 0),
    h: Math.round(p.h * ih) - (p.y > 0 ? g : 0) - (p.y + p.h < 1 ? g : 0),
  }));
}

/** Draws one photo into a panel rect, cover-fit, with zoom and pan offsets. */
function drawPanelPhoto(ctx, photo, rect, panel) {
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const zoom = Math.max(1, panel.zoom || 1);
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const pw = iw * scale;
  const ph = ih * scale;
  const maxOx = Math.max(0, (pw - rect.w) / 2);
  const maxOy = Math.max(0, (ph - rect.h) / 2);
  const ox = Math.max(-maxOx, Math.min(maxOx, (panel.ox || 0) * rect.w));
  const oy = Math.max(-maxOy, Math.min(maxOy, (panel.oy || 0) * rect.h));
  ctx.drawImage(photo, rect.x + (rect.w - pw) / 2 + ox, rect.y + (rect.h - ph) / 2 + oy, pw, ph);
}

/** Draws the empty-panel placeholder: a dusk gradient and an invitation. */
function drawEmptyPanel(ctx, rect, w) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, '#3d1a54');
  grad.addColorStop(0.55, '#7a2450');
  grad.addColorStop(1, '#c2432f');
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `bold ${Math.max(14, rect.w * 0.045)}px "Poster Bold", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+ ADD PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.textBaseline = 'alphabetic';
}

/** Draws the retro striped sun disc over the top of the poster. The disc is
 *  painted on a small offscreen canvas first so the stripes cut only the sun. */
function drawSun(ctx, w, h, grade) {
  if (grade === 'noir') return;
  const cx = w * 0.86;
  const cy = h * 0.13;
  const r = Math.min(w, h) * 0.065;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.1);
  glow.addColorStop(0, 'rgba(255, 190, 80, 0.55)');
  glow.addColorStop(1, 'rgba(255, 190, 80, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);
  const sun = document.createElement('canvas');
  sun.width = Math.ceil(r * 2);
  sun.height = Math.ceil(r * 2);
  const sctx = sun.getContext('2d');
  const disc = sctx.createLinearGradient(0, 0, 0, r * 2);
  disc.addColorStop(0, '#ffe259');
  disc.addColorStop(0.55, '#ff7e2e');
  disc.addColorStop(1, '#ff2e88');
  sctx.beginPath();
  sctx.arc(r, r, r, 0, Math.PI * 2);
  sctx.fillStyle = disc;
  sctx.fill();
  // Synthwave stripes cut across the lower half of the disc.
  sctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 3; i++) {
    const y = r * (1.08 + i * 0.24);
    sctx.fillRect(0, y, r * 2, r * 0.07);
  }
  ctx.drawImage(sun, cx - r, cy - r);
  ctx.restore();
}

/** Draws the title and subtitle over the bottom scrim. */
function drawLettering(ctx, w, h, title, subtitle) {
  const scrim = ctx.createLinearGradient(0, h * 0.62, 0, h);
  scrim.addColorStop(0, 'rgba(10, 4, 18, 0)');
  scrim.addColorStop(0.55, 'rgba(10, 4, 18, 0.55)');
  scrim.addColorStop(1, 'rgba(10, 4, 18, 0.88)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, w, h);

  const text = (title || '').trim().toUpperCase();
  if (text) {
    let size = h * 0.115;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const setFont = (s) => { ctx.font = `bold ${s}px "Poster Bold", "Liberation Sans", sans-serif`; };
    setFont(size);
    try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older canvas */ }
    while (ctx.measureText(text).width > w * 0.92 && size > 16) {
      size -= 2;
      setFont(size);
    }
    const ty = h - h * 0.085;
    const fill = ctx.createLinearGradient(0, ty - size, 0, ty + size * 0.12);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(0.5, '#ffe259');
    fill.addColorStop(1, '#ff5e62');
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#160a24';
    ctx.lineWidth = Math.max(4, size * 0.09);
    ctx.strokeText(text, w / 2, ty);
    ctx.fillStyle = fill;
    ctx.fillText(text, w / 2, ty);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }

  const sub = (subtitle || '').trim().toUpperCase();
  if (sub) {
    let size = h * 0.028;
    ctx.font = `bold ${size}px "Poster Bold", "Liberation Sans", sans-serif`;
    try { ctx.letterSpacing = `${Math.round(size * 0.32)}px`; } catch { /* older canvas */ }
    while (ctx.measureText(sub).width > w * 0.88 && size > 10) {
      size -= 1;
      ctx.font = `bold ${size}px "Poster Bold", "Liberation Sans", sans-serif`;
    }
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = size * 0.5;
    ctx.textAlign = 'center';
    ctx.fillText(sub, w / 2, h - h * 0.028);
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}

/**
 * Draws the full poster. state: { layout, grade, title, subtitle, panels }
 * panels[i] is { photo: an image or null, zoom, ox, oy }. photos resolve
 * through the panel's own `photo` image reference.
 */
export function drawPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;

  ctx.fillStyle = '#f7f2f4'; // poster paper: shows as the white border and gutters
  ctx.fillRect(0, 0, w, h);

  const rects = panelRects(state.layout, w, h);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || {};
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (panel.photo) {
      ctx.filter = grade.filter;
      drawPanelPhoto(ctx, panel.photo, rect, panel);
      ctx.filter = 'none';
    } else {
      drawEmptyPanel(ctx, rect, w);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(20, 6, 30, 0.35)';
    ctx.lineWidth = Math.max(1, Math.round(Math.min(w, h) * 0.002));
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  const tint = ctx.createLinearGradient(0, 0, w, h);
  tint.addColorStop(0, grade.tint[0]);
  tint.addColorStop(1, grade.tint[1]);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  drawSun(ctx, w, h, state.grade);
  drawLettering(ctx, w, h, state.title, state.subtitle);
}
