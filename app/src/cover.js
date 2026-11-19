// Vice Cover Studio — the poster render engine. drawPoster paints the whole
// multi-panel cover onto any 2D canvas: photo panels with per-panel crop and
// zoom, a Vice City colour grade, and a procedural skyline band across the
// bottom that carries the retro sun, a "VI / VICE CITY" lockup in the app's
// own Poster Bold lettering, and the user's title and subtitle in a clear
// zone. Everything it draws is original; no game artwork, logo or wordmark
// is used anywhere.

/** Poster layouts: panel rectangles as fractions of the poster, in order.
 *  key-art is the default: one full-bleed hero photo, the rest of the poster
 *  is the skyline band with the VI lockup and the title. */
export const LAYOUTS = {
  'key-art': [
    { x: 0, y: 0, w: 1, h: 0.6 },
  ],
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

/** Built-in sample photos, in rotation order. A poster never repeats a
 *  photo: panels are filled from this list in order, never twice. */
export const SAMPLES = ['neon', 'street', 'pier', 'boulevard'];

/** Colour grades: a canvas filter per photo, a tint over the poster, a
 *  grade-tinted frame and gutters, a title gradient, a band sky, a sun
 *  (null for noir) and the lit-window colour of the skyline. */
export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.3) contrast(1.08) sepia(0.22)',
    tint: ['rgba(255, 122, 26, 0.16)', 'rgba(255, 45, 120, 0.22)'],
    border: '#ff7e2e',
    gutter: '#33101f',
    building: '#160a24',
    windows: '#ffd76a',
    title: ['#fff8d6', '#ffb347', '#ff7e2e'],
    sky: ['#2a1040', '#ff7e2e'],
    sun: ['#ffe259', '#ff7e2e', '#ff2e88'],
    sunGlow: 'rgba(255, 190, 80, 0.55)',
  },
  neon: {
    label: 'Neon',
    filter: 'saturate(1.6) contrast(1.15) hue-rotate(-12deg)',
    tint: ['rgba(0, 229, 255, 0.14)', 'rgba(255, 0, 170, 0.20)'],
    border: '#00e5ff',
    gutter: '#051018',
    building: '#020a18',
    windows: '#7df9ff',
    title: ['#d8fbff', '#00e5ff', '#ff00aa'],
    sky: ['#04122e', '#7a1fa2'],
    sun: ['#a5f3ff', '#00e5ff', '#ff00aa'],
    sunGlow: 'rgba(0, 229, 255, 0.45)',
  },
  vice: {
    label: 'Vice Pink',
    filter: 'saturate(1.5) contrast(1.1) sepia(0.14)',
    tint: ['rgba(255, 120, 220, 0.20)', 'rgba(150, 40, 255, 0.22)'],
    border: '#ff2e88',
    gutter: '#2b0a22',
    building: '#1d0716',
    windows: '#ff9ed9',
    title: ['#ffe3f6', '#ff5ec4', '#ff2e88'],
    sky: ['#2a0b33', '#ff2e88'],
    sun: ['#ffd6f2', '#ff5ec4', '#8c28ff'],
    sunGlow: 'rgba(255, 94, 196, 0.5)',
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(1) contrast(1.25) brightness(0.92)',
    tint: ['rgba(20, 20, 40, 0.10)', 'rgba(0, 0, 0, 0.28)'],
    border: '#9a9a9a',
    gutter: '#161616',
    building: '#000000',
    windows: '#d8d8d8',
    title: ['#ffffff', '#e8e8e8', '#b5b5b5'],
    sky: ['#1c1c1c', '#4d4d4d'],
    sun: null,
    sunGlow: 'rgba(255, 255, 255, 0)',
  },
};

/** Export sizes, in pixels. */
export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
};

/** Panel rectangles in pixels for a poster of size w x h and a layout name.
 *  Panels sit inside a grade-tinted poster frame, with grade-tinted
 *  gutters between them. */
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

/** The skyline band rectangle: below the hero for key-art (the rest of the
 *  poster), the bottom strip over the panels for every other layout. */
export function bandRect(layout, w, h, rects) {
  const g = Math.max(2, Math.round(Math.min(w, h) * 0.012));
  if (layout === 'key-art') {
    const hero = rects[0];
    const y = hero.y + hero.h + g;
    return { x: 0, y, w, h: h - y - g };
  }
  const y = Math.round(h * 0.74);
  return { x: 0, y, w, h: h - y - g };
}

/** Sun geometry inside a band: big (r ~0.10 of the poster's min dimension),
 *  at the right of the sky strip, never over a photo. */
export function sunGeometry(band, minDim) {
  const r = Math.min(band.h * 0.38, minDim * 0.105);
  const margin = Math.round(band.w * 0.03);
  return { cx: band.x + band.w - margin - r, cy: band.y + band.h * 0.36, r };
}

/** Deterministic pseudo-random 0..1 from an integer, for skyline windows. */
function hash(n) {
  let x = (n * 2654435761) >>> 0;
  x ^= x >>> 15;
  x = (x * 2246822519) >>> 0;
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
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

/** Draws the retro striped sun disc, on a small offscreen canvas first so
 *  the stripes cut only the sun. The sun lives only inside the sky band. */
function drawSun(ctx, sun, grade) {
  if (!grade.sun || sun.r < 8) return;
  const { cx, cy, r } = sun;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.1);
  glow.addColorStop(0, grade.sunGlow);
  glow.addColorStop(1, 'rgba(255, 190, 80, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);
  ctx.restore();
  const disc = document.createElement('canvas');
  disc.width = Math.ceil(r * 2);
  disc.height = Math.ceil(r * 2);
  const sctx = disc.getContext('2d');
  const grad = sctx.createLinearGradient(0, 0, 0, r * 2);
  grad.addColorStop(0, grade.sun[0]);
  grad.addColorStop(0.55, grade.sun[1]);
  grad.addColorStop(1, grade.sun[2]);
  sctx.beginPath();
  sctx.arc(r, r, r, 0, Math.PI * 2);
  sctx.fillStyle = grad;
  sctx.fill();
  // Synthwave stripes cut across the lower half of the disc.
  sctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 3; i++) {
    const y = r * (1.08 + i * 0.24);
    sctx.fillRect(0, y, r * 2, r * 0.07);
  }
  ctx.drawImage(disc, cx - r, cy - r);
}

/** Draws building silhouettes with lit windows along the bottom of a rect. */
function drawBuildings(ctx, x, y, w, h, grade, seed) {
  const baseY = y + h;
  const n = Math.max(5, Math.round(w / 110));
  let bx = x;
  for (let i = 0; i < n && bx < x + w; i++) {
    const bw = w * (0.05 + hash(seed + i * 7) * 0.075);
    const bh = h * (0.45 + hash(seed + i * 13) * 0.55);
    const by = baseY - bh;
    ctx.fillStyle = grade.building;
    ctx.fillRect(bx, by, bw, bh);
    if (hash(seed + i * 29) < 0.3) {
      ctx.fillRect(bx + bw * 0.45, by - h * 0.16, Math.max(2, bw * 0.05), h * 0.16);
    }
    const cols = Math.max(1, Math.floor(bw / 16));
    const rows = Math.max(1, Math.floor(bh / 22));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (hash(seed + i * 101 + c * 17 + r * 31) < 0.38) {
          ctx.globalAlpha = 0.55 + hash(seed + c * 3 + r * 7) * 0.45;
          ctx.fillStyle = grade.windows;
          ctx.fillRect(
            bx + 4 + c * ((bw - 8) / cols),
            by + 5 + r * ((bh - 10) / rows),
            Math.max(2, bw * 0.045),
            Math.max(3, bh * 0.05),
          );
          ctx.globalAlpha = 1;
        }
      }
    }
    bx += bw + w * 0.004;
  }
}

/** Draws one palm-tree silhouette: a leaning trunk and drooping fronds. */
function drawPalm(ctx, x, baseY, height, lean, color) {
  const topX = x + lean;
  const topY = baseY - height;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, height * 0.045);
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + lean * 0.25, baseY - height * 0.55, topX, topY);
  ctx.stroke();
  const spread = height * 0.42;
  ctx.lineWidth = Math.max(1.5, height * 0.022);
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const a = -Math.PI * (0.92 - t * 0.84);
    const ex = topX + Math.cos(a) * spread;
    const ey = topY + Math.sin(a) * spread + spread * 0.45;
    const kx = topX + Math.cos(a) * spread * 0.55;
    const ky = topY + Math.sin(a) * spread * 0.55 - spread * 0.18;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(kx, ky, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX, topY + height * 0.02, Math.max(2, height * 0.025), 0, Math.PI * 2);
  ctx.fill();
}

/** Draws the procedural Vice skyline band: gradient sky, retro sun, building
 *  silhouettes with lit windows and palm silhouettes framing the edges. */
export function drawSkylineBand(ctx, band, grade, sun) {
  const sky = ctx.createLinearGradient(band.x, band.y, band.x, band.y + band.h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(1, grade.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  ctx.fillStyle = grade.border;
  ctx.fillRect(band.x, band.y, band.w, Math.max(2, Math.round(band.h * 0.012)));
  drawSun(ctx, sun, grade);
  const stripH = band.h * 0.3;
  drawBuildings(ctx, band.x, band.y + band.h - stripH, band.w, stripH, grade, Math.round(band.y) + 1);
  const palmH = band.h * 0.55;
  drawPalm(ctx, band.x + band.w * 0.012, band.y + band.h, palmH, -band.w * 0.012, grade.building);
  drawPalm(ctx, band.x + band.w * 0.988, band.y + band.h, palmH, band.w * 0.012, grade.building);
}

/** Draws the "VI / VICE CITY" lockup plus the user's title and subtitle
 *  inside the skyline band, in the clear zone left of the sun. The lockup
 *  is original lettering in the app's own Poster Bold font. */
function drawBandLettering(ctx, band, grade, sun, w, h, title, subtitle) {
  const margin = Math.round(w * 0.03);
  const titleSize = h * 0.13;
  const subSize = h * 0.032;
  const viceSize = Math.max(12, titleSize * 0.18);
  const blockH = titleSize + subSize * 2.2;
  const blockTop = band.y + (band.h - blockH) / 2 - band.h * 0.03;
  const viBaseline = blockTop + titleSize;
  // No sun in this grade (noir): the title may run to the band's right edge.
  const sunLeft = grade.sun ? sun.cx - sun.r : band.x + band.w - margin;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const setFont = (s) => { ctx.font = `bold ${s}px "Poster Bold", "Liberation Sans", sans-serif`; };

  // Measure the VI lockup block: "VI" over letterspaced "VICE CITY".
  setFont(titleSize);
  const viW = ctx.measureText('VI').width;
  setFont(viceSize);
  let viceSpacing = Math.round(viceSize * 0.25);
  try { ctx.letterSpacing = `${viceSpacing}px`; } catch { /* older canvas */ }
  const viceW = ctx.measureText('VICE CITY').width + viceSpacing * 8;
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  const lockW = Math.max(viW, viceW);

  const titleX = band.x + margin + lockW + w * 0.025;
  const capW = sunLeft - titleX - w * 0.02;

  // The VI lockup, in the grade's title gradient.
  const viFill = ctx.createLinearGradient(0, viBaseline - titleSize, 0, viBaseline + titleSize * 0.12);
  viFill.addColorStop(0, grade.title[0]);
  viFill.addColorStop(0.5, grade.title[1]);
  viFill.addColorStop(1, grade.title[2]);
  setFont(titleSize);
  try { ctx.letterSpacing = `${Math.round(titleSize * 0.02)}px`; } catch { /* older canvas */ }
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#160a24';
  ctx.lineWidth = Math.max(4, titleSize * 0.09);
  ctx.strokeText('VI', band.x + margin, viBaseline);
  ctx.fillStyle = viFill;
  ctx.fillText('VI', band.x + margin, viBaseline);
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  setFont(viceSize);
  try { ctx.letterSpacing = `${viceSpacing}px`; } catch { /* older canvas */ }
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = viceSize * 0.5;
  ctx.fillText('VICE CITY', band.x + margin, viBaseline + viceSize * 1.5);
  ctx.shadowBlur = 0;
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }

  // The user's title, big, in the grade's title gradient.
  const text = (title || '').trim().toUpperCase();
  if (text) {
    let size = titleSize;
    setFont(size);
    try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older canvas */ }
    while (ctx.measureText(text).width > capW && size > 16) {
      size -= 2;
      setFont(size);
    }
    const fill = ctx.createLinearGradient(0, viBaseline - size, 0, viBaseline + size * 0.12);
    fill.addColorStop(0, grade.title[0]);
    fill.addColorStop(0.5, grade.title[1]);
    fill.addColorStop(1, grade.title[2]);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#160a24';
    ctx.lineWidth = Math.max(4, size * 0.09);
    ctx.strokeText(text, titleX, viBaseline);
    ctx.fillStyle = fill;
    ctx.fillText(text, titleX, viBaseline);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }

  // The subtitle, under the title.
  const sub = (subtitle || '').trim().toUpperCase();
  if (sub) {
    let size = subSize;
    setFont(size);
    try { ctx.letterSpacing = `${Math.round(size * 0.32)}px`; } catch { /* older canvas */ }
    while (ctx.measureText(sub).width > capW && size > 10) {
      size -= 1;
      setFont(size);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = size * 0.5;
    ctx.fillText(sub, titleX, viBaseline + size * 1.9);
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}

/**
 * Draws the full poster. state: { layout, grade, title, subtitle, panels }
 * panels[i] is { photo: an image or null, skyline: fill with the skyline
 * band instead of a photo, zoom, ox, oy }.
 */
export function drawPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const g = Math.max(2, Math.round(Math.min(w, h) * 0.012));

  // Grade-tinted frame, with darker grade-tinted gutters inside it.
  ctx.fillStyle = grade.border;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = grade.gutter;
  ctx.fillRect(g, g, w - 2 * g, h - 2 * g);

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
    } else if (panel.skyline) {
      drawSkylineBand(ctx, rect, grade, sunGeometry(rect, Math.min(w, h)));
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

  const band = bandRect(state.layout, w, h, rects);
  const sun = sunGeometry(band, Math.min(w, h));
  drawSkylineBand(ctx, band, grade, sun);
  drawBandLettering(ctx, band, grade, sun, w, h, state.title, state.subtitle);
}
