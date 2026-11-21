// Vice Cover Studio — the poster render engine. drawPoster paints the whole
// multi-panel cover onto any 2D canvas: full-bleed photo panels with
// per-panel crop and zoom, a Vice City colour grade, a retro striped sun
// over the artwork, and the caption as one huge gradient title overlaid on
// the photos themselves, with a clean letterspaced tagline under it. There
// is no footer band: the photos run edge to edge and the lettering floats
// over a soft bottom scrim, so nothing shrinks the pictures or clips the
// words. Everything drawn here is original; no game artwork, logo or
// wordmark is used anywhere.

/** Poster layouts: panel rectangles as fractions of the poster, in order.
 *  The hero always keeps at least 58% of the height and the lower panels
 *  keep the full remaining height, so no panel is squeezed into a strip. */
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

/** Built-in sample photos, in rotation order. A poster never repeats a
 *  photo: panels are filled from this list in order, never twice. */
export const SAMPLES = ['neon', 'street', 'pier', 'boulevard'];

/** Colour grades. Each grade is a distinct world, not a strength setting:
 *  its own canvas filter per photo, its own tint over the poster, its own
 *  frame and gutter colour, its own three-stop title gradient and its own
 *  sun. Noir has no sun; instead it gets a deep vignette and a harder
 *  filter, so its blacks stay black and its highlights stay bright. */
export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.3) contrast(1.08) sepia(0.22)',
    tint: ['rgba(255, 122, 26, 0.16)', 'rgba(255, 45, 120, 0.22)'],
    frame: '#ff7e2e',
    gutter: '#2b0d1e',
    title: ['#fff8d6', '#ffb347', '#ff5e62'],
    sun: ['#ffe259', '#ff7e2e', '#ff2e88'],
    sunGlow: 'rgba(255, 190, 80, 0.55)',
    vignette: 0,
  },
  neon: {
    label: 'Neon',
    filter: 'saturate(1.6) contrast(1.15) hue-rotate(-12deg)',
    tint: ['rgba(0, 229, 255, 0.14)', 'rgba(255, 0, 170, 0.20)'],
    frame: '#00e5ff',
    gutter: '#04101c',
    title: ['#eafcff', '#00e5ff', '#ff00aa'],
    sun: ['#a5f3ff', '#00e5ff', '#ff00aa'],
    sunGlow: 'rgba(0, 229, 255, 0.45)',
    vignette: 0,
  },
  vice: {
    label: 'Vice Pink',
    filter: 'saturate(1.5) contrast(1.1) sepia(0.14)',
    tint: ['rgba(255, 120, 220, 0.20)', 'rgba(150, 40, 255, 0.22)'],
    frame: '#ff2e88',
    gutter: '#26081c',
    title: ['#fff0fa', '#ff5ec4', '#8c28ff'],
    sun: ['#ffd6f2', '#ff5ec4', '#8c28ff'],
    sunGlow: 'rgba(255, 94, 196, 0.5)',
    vignette: 0,
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(1) contrast(1.5) brightness(1.04)',
    tint: ['rgba(30, 34, 52, 0.08)', 'rgba(0, 0, 0, 0.16)'],
    frame: '#e8e8e8',
    gutter: '#0a0a0a',
    title: ['#ffffff', '#dcdcdc', '#8a8a8a'],
    sun: null,
    sunGlow: 'rgba(255, 255, 255, 0)',
    vignette: 0.5,
  },
};

/** Export sizes, in pixels. */
export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
};

/** Panel rectangles in pixels for a poster of size w x h and a layout name.
 *  Panels sit inside a thin grade-tinted frame, with grade-tinted gutters
 *  between them; the photos themselves fill every panel edge to edge. */
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

/** Draws the retro striped sun disc over the top corner of the artwork.
 *  The disc is painted on a small offscreen canvas first so the stripes
 *  cut only the sun. Grades with no sun (noir) skip it entirely. */
function drawSunDisc(ctx, w, h, grade) {
  if (!grade.sun) return;
  const cx = w * 0.865;
  const cy = h * 0.125;
  const r = Math.min(w, h) * 0.068;
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

/** Darkens the poster's edges with a radial vignette. Only grades that ask
 *  for one (noir) get it: it is what keeps a black-and-white cover punchy
 *  instead of flat, crushing the corners while the centre stays bright. */
function drawVignette(ctx, w, h, strength) {
  if (!strength) return;
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/** Draws the caption over the artwork: a soft scrim rising from the bottom
 *  edge, then the title — huge, centred, in the grade's own gradient with
 *  a heavy dark outline — and the tagline beneath it, letterspaced, with
 *  clear space on every side so nothing ever clips it. */
function drawOverlayLettering(ctx, w, h, grade, title, subtitle) {
  const scrim = ctx.createLinearGradient(0, h * 0.58, 0, h);
  scrim.addColorStop(0, 'rgba(10, 4, 18, 0)');
  scrim.addColorStop(0.55, 'rgba(10, 4, 18, 0.52)');
  scrim.addColorStop(1, 'rgba(10, 4, 18, 0.86)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h * 0.58, w, h * 0.42);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const setFont = (s) => { ctx.font = `bold ${s}px "Poster Bold", "Liberation Sans", sans-serif`; };

  const text = (title || '').trim().toUpperCase();
  if (text) {
    let size = h * 0.124;
    setFont(size);
    try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older canvas */ }
    while (ctx.measureText(text).width > w * 0.92 && size > 16) {
      size -= 2;
      setFont(size);
    }
    const ty = h * 0.9;
    const fill = ctx.createLinearGradient(0, ty - size, 0, ty + size * 0.12);
    fill.addColorStop(0, grade.title[0]);
    fill.addColorStop(0.5, grade.title[1]);
    fill.addColorStop(1, grade.title[2]);
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
    let size = h * 0.03;
    setFont(size);
    try { ctx.letterSpacing = `${Math.round(size * 0.3)}px`; } catch { /* older canvas */ }
    while (ctx.measureText(sub).width > w * 0.88 && size > 10) {
      size -= 1;
      setFont(size);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = size * 0.5;
    ctx.fillText(sub, w / 2, h * 0.958);
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}

/**
 * Draws the full poster. state: { layout, grade, title, subtitle, panels }
 * panels[i] is { photo: an image or null, zoom, ox, oy }.
 */
export function drawPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const g = Math.max(2, Math.round(Math.min(w, h) * 0.012));

  // A thin grade-tinted frame, with darker grade-tinted gutters inside it.
  ctx.fillStyle = grade.frame;
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

  drawVignette(ctx, w, h, grade.vignette);
  drawSunDisc(ctx, w, h, grade);
  drawOverlayLettering(ctx, w, h, grade, state.title, state.subtitle);
}
