// generate-samples.ts — paints the four bundled sample photos for Vice Cover Studio.
//
// Route: a tiny software rasterizer (Node standard library only, no canvas package,
// no headless browser). Each scene is drawn with layered vector shapes — vertical
// sky gradients, discs, polygons, thick strokes — into an RGB pixel buffer at 2x
// supersampling, then box-downsampled for soft edges and written out as a baseline
// JPEG by the small encoder at the bottom of this file.
//
// Run:  node generate-samples.ts     (writes app/samples/*.jpg)

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(fileURLToPath(new URL('.', import.meta.url)), 'app', 'samples');
const W = 880;
const H = 660;
const SS = 2; // supersample factor

type RGB = [number, number, number];

function hex(value: string): RGB {
  const n = parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

class Canvas {
  w: number;
  h: number;
  px: Float32Array;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.px = new Float32Array(w * h * 3);
  }
  set(x: number, y: number, c: RGB, alpha = 1) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    if (alpha >= 1) {
      this.px[i] = c[0]; this.px[i + 1] = c[1]; this.px[i + 2] = c[2];
    } else {
      this.px[i] += (c[0] - this.px[i]) * alpha;
      this.px[i + 1] += (c[1] - this.px[i + 1]) * alpha;
      this.px[i + 2] += (c[2] - this.px[i + 2]) * alpha;
    }
  }
  vGrad(y0: number, y1: number, top: RGB, bottom: RGB) {
    for (let y = Math.max(0, y0); y < Math.min(this.h, y1); y++) {
      const t = y1 === y0 ? 0 : (y - y0) / (y1 - y0);
      const c = mix(top, bottom, t);
      for (let x = 0; x < this.w; x++) this.set(x, y, c);
    }
  }
  rect(x0: number, y0: number, x1: number, y1: number, c: RGB, alpha = 1) {
    for (let y = Math.floor(y0); y < y1; y++)
      for (let x = Math.floor(x0); x < x1; x++) this.set(x, y, c, alpha);
  }
  disc(cx: number, cy: number, r: number, c: RGB, alpha = 1) {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= r) this.set(x, y, c, alpha * Math.min(1, r - d + 0.5));
      }
  }
  poly(points: Array<[number, number]>, c: RGB, alpha = 1) {
    let minY = Infinity, maxY = -Infinity;
    for (const [, y] of points) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    for (let y = Math.floor(minY); y <= maxY; y++) {
      const xs: number[] = [];
      for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[(i + 1) % points.length];
        if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.floor(xs[k]); x <= xs[k + 1]; x++) this.set(x, y, c, alpha);
    }
  }
  stroke(x1: number, y1: number, x2: number, y2: number, width: number, c: RGB, alpha = 1) {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      this.disc(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, width / 2, c, alpha);
    }
  }
  downsample(factor: number): Canvas {
    const out = new Canvas(this.w / factor, this.h / factor);
    for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) {
      let r = 0, g = 0, b = 0;
      for (let dy = 0; dy < factor; dy++) for (let dx = 0; dx < factor; dx++) {
        const i = ((y * factor + dy) * this.w + x * factor + dx) * 3;
        r += this.px[i]; g += this.px[i + 1]; b += this.px[i + 2];
      }
      const n = factor * factor;
      out.set(x, y, [r / n, g / n, b / n]);
    }
    return out;
  }
}

// A small deterministic PRNG so the scenes are identical on every run.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function palm(cv: Canvas, x: number, baseY: number, h: number, lean: number, dark: RGB) {
  const topX = x + lean, topY = baseY - h;
  cv.stroke(x, baseY, topX, topY, h * 0.055, dark);
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.08 + (i / 7) * 0.84);
    const len = h * (0.34 + (i % 3) * 0.05);
    cv.stroke(topX, topY, topX + Math.cos(a) * len * (i < 3.5 ? -1 : 1), topY - Math.sin(a) * len * 0.55 + len * 0.22, h * 0.028, dark);
  }
}

function car(cv: Canvas, cx: number, cy: number, scale: number, body: RGB, glow: RGB) {
  const s = scale;
  cv.poly([[cx - 150 * s, cy], [cx - 138 * s, cy - 34 * s], [cx - 70 * s, cy - 44 * s], [cx - 38 * s, cy - 78 * s], [cx + 52 * s, cy - 78 * s], [cx + 84 * s, cy - 44 * s], [cx + 142 * s, cy - 36 * s], [cx + 152 * s, cy]], body);
  cv.poly([[cx - 30 * s, cy - 72 * s], [cx - 8 * s, cy - 46 * s], [cx + 30 * s, cy - 46 * s], [cx + 22 * s, cy - 72 * s]], hex('#bfe9ff'));
  cv.poly([[cx + 34 * s, cy - 72 * s], [cx + 48 * s, cy - 46 * s], [cx + 74 * s, cy - 46 * s], [cx + 58 * s, cy - 72 * s]], hex('#9fd4f2'));
  cv.rect(cx - 148 * s, cy - 12 * s, cx + 150 * s, cy - 5 * s, glow);
  for (const wx of [cx - 92 * s, cx + 92 * s]) {
    cv.disc(wx, cy, 30 * s, hex('#0b0b10'));
    cv.disc(wx, cy, 17 * s, hex('#cfd6de'));
    cv.disc(wx, cy, 6 * s, hex('#5a636e'));
  }
  cv.disc(cx + 148 * s, cy - 22 * s, 6 * s, hex('#fff3b0'));
  cv.disc(cx - 148 * s, cy - 22 * s, 5 * s, hex('#ff5d5d'));
}

// Scene 1 — neon-lit deco street at dusk, sports car in front of a hotel tower.
function sceneStreet(): Canvas {
  const cv = new Canvas(W * SS, H * SS);
  const S = (v: number) => v * SS;
  cv.vGrad(0, S(470), hex('#1b1040'), hex('#7a2a6d'));
  cv.vGrad(S(300), S(470), hex('#7a2a6d'), hex('#ff7a4d'));
  cv.disc(S(700), S(390), S(52), hex('#ffd9a0'));
  cv.disc(S(700), S(390), S(86), hex('#ff9d5c'), 0.35);
  const rand = rng(11);
  for (let i = 0; i < 90; i++) cv.disc(rand() * cv.w, rand() * S(240), S(1.4), hex('#ffffff'), 0.7);
  // deco towers
  const towers: Array<[number, number, number, string]> = [
    [30, 150, 120, '#241243'], [170, 90, 105, '#2c1757'], [300, 190, 92, '#1e0f3d'],
    [560, 120, 110, '#2c1757'], [700, 200, 130, '#241243'],
  ];
  for (const [x, top, w, col] of towers) {
    cv.rect(S(x), S(top), S(x + w), S(478), hex(col));
    cv.rect(S(x + w * 0.32), S(top - 26), S(x + w * 0.68), S(top), hex(col));
    for (let wy = top + 18; wy < 460; wy += 26)
      for (let wx = x + 12; wx < x + w - 10; wx += 22)
        if (rand() > 0.45) cv.rect(S(wx), S(wy), S(wx + 10), S(wy + 13), rand() > 0.5 ? hex('#ffd76e') : hex('#6bf2ff'), 0.9);
  }
  // neon signs
  cv.rect(S(322), S(240), S(330), S(360), hex('#ff3df0'));
  cv.rect(S(596), S(190), S(604), S(330), hex('#37f2d4'));
  cv.rect(S(60), S(300), S(150), S(308), hex('#ff3df0'), 0.95);
  // street + wet reflection sheen
  cv.vGrad(S(470), cv.h, hex('#2a1440'), hex('#0d0718'));
  for (let i = 0; i < 46; i++) {
    const y = S(486) + rand() * S(150);
    cv.rect(rand() * cv.w, y, rand() * cv.w + S(30 + rand() * 90), y + S(2), rand() > 0.5 ? hex('#ff3df0') : hex('#37f2d4'), 0.28);
  }
  palm(cv, S(120), S(500), S(190), S(36), hex('#12081f'));
  palm(cv, S(790), S(505), S(215), S(-30), hex('#12081f'));
  car(cv, S(440), S(560), SS * 1.15, hex('#e8335f'), hex('#37f2d4'));
  return cv.downsample(SS);
}

// Scene 2 — beach pier at sunset, fisherman silhouette at the rail.
function scenePier(): Canvas {
  const cv = new Canvas(W * SS, H * SS);
  const S = (v: number) => v * SS;
  cv.vGrad(0, S(330), hex('#3a2a6e'), hex('#c94f6d'));
  cv.vGrad(S(240), S(336), hex('#c94f6d'), hex('#ffb347'));
  cv.disc(S(430), S(330), S(58), hex('#ffe9b0'));
  cv.disc(S(430), S(330), S(110), hex('#ff9d5c'), 0.4);
  cv.vGrad(S(336), cv.h, hex('#1d6f8e'), hex('#0a2e4d'));
  // sun path glitter
  const rand = rng(23);
  for (let i = 0; i < 130; i++) {
    const y = S(346) + rand() * S(180);
    const spread = 26 + (y - S(346)) / SS * 0.55;
    cv.rect(S(430) + (rand() - 0.5) * S(spread * 2), y, S(430) + (rand() - 0.5) * S(spread * 2) + S(14 + rand() * 30), y + S(2.4), hex('#ffd76e'), 0.5);
  }
  // distant headland
  cv.poly([[0, S(336)], [0, S(292)], [S(150), S(272)], [S(300), S(306)], [S(360), S(336)]], hex('#4a2358'));
  // pier deck + posts
  cv.poly([[S(90), cv.h], [S(520), S(392)], [S(880), S(392)], [S(880), cv.h]], hex('#5a3a22'));
  for (let i = 0; i < 9; i++) {
    const t = i / 8, x = 120 + t * 700, y = 640 - t * 225;
    cv.rect(S(x), S(y), S(x + 15), cv.h, hex('#3c2716'));
    cv.rect(S(x - 26), S(y - 92), S(x - 19), S(y), hex('#3c2716'));
  }
  cv.stroke(S(70), S(556), S(880), S(392), S(7), hex('#2e1c0e'));
  cv.stroke(S(70), S(600), S(880), S(438), S(6), hex('#2e1c0e'));
  // fisherman silhouette: legs, torso, head, rod out over the water
  const fx = S(610), fy = S(408);
  cv.stroke(fx, fy - S(86), fx - S(16), fy, S(11), hex('#140a18'));
  cv.stroke(fx, fy - S(86), fx + S(20), fy, S(11), hex('#140a18'));
  cv.stroke(fx, fy - S(88), fx + S(4), fy - S(150), S(15), hex('#140a18'));
  cv.disc(fx + S(6), fy - S(168), S(15), hex('#140a18'));
  cv.rect(fx - S(12), fy - S(182), fx + S(24), fy - S(174), hex('#140a18')); // bucket hat brim
  cv.stroke(fx + S(8), fy - S(140), fx + S(66), fy - S(122), S(8), hex('#140a18'));
  cv.stroke(fx + S(66), fy - S(122), fx + S(215), fy - S(196), S(3.4), hex('#140a18'));
  cv.stroke(fx + S(215), fy - S(196), fx + S(232), fy - S(96), S(1.4), hex('#d9f2ff'), 0.7);
  // gulls
  for (const [gx, gy] of [[180, 120], [250, 92], [640, 140]] as Array<[number, number]>) {
    cv.stroke(S(gx - 16), S(gy), S(gx), S(gy - 8), S(2.6), hex('#2a1240'));
    cv.stroke(S(gx), S(gy - 8), S(gx + 16), S(gy), S(2.6), hex('#2a1240'));
  }
  return cv.downsample(SS);
}

// Scene 3 — sunset boulevard, palms both sides, low-rider cruising.
function sceneBoulevard(): Canvas {
  const cv = new Canvas(W * SS, H * SS);
  const S = (v: number) => v * SS;
  cv.vGrad(0, S(360), hex('#2e1a5e'), hex('#e85d75'));
  cv.vGrad(S(250), S(366), hex('#e85d75'), hex('#ffc46b'));
  cv.disc(S(440), S(352), S(66), hex('#fff0bc'));
  cv.disc(S(440), S(352), S(130), hex('#ff8f5c'), 0.38);
  // mountain ridge + skyline
  cv.poly([[0, S(366)], [0, S(300)], [S(190), S(262)], [S(360), S(312)], [S(560), S(272)], [S(760), S(316)], [S(880), S(292)], [S(880), S(366)]], hex('#59306b'));
  const rand = rng(37);
  for (const [x, w, top] of [[96, 54, 268], [640, 62, 252], [724, 44, 282]] as Array<[number, number, number]>) {
    cv.rect(S(x), S(top), S(x + w), S(366), hex('#3c1d54'));
    for (let wy = top + 12; wy < 352; wy += 20)
      for (let wx = x + 8; wx < x + w - 6; wx += 15)
        if (rand() > 0.5) cv.rect(S(wx), S(wy), S(wx + 6), S(wy + 8), hex('#ffd76e'), 0.85);
  }
  // road in perspective + lawns
  cv.poly([[0, cv.h], [S(330), S(366)], [S(550), S(366)], [S(880), cv.h]], hex('#33203f'));
  cv.poly([[0, cv.h], [0, S(430)], [S(330), S(366)], [S(300), cv.h]], hex('#7a3b2e'));
  cv.poly([[S(880), cv.h], [S(880), S(430)], [S(550), S(366)], [S(580), cv.h]], hex('#7a3b2e'));
  cv.stroke(S(440), S(372), S(440), cv.h, S(5), hex('#ffd76e'), 0.8);
  // palm rows shrinking to the vanishing point
  for (let i = 0; i < 5; i++) {
    const t = i / 5, y = 640 - t * 250, hgt = 300 - t * 175;
    palm(cv, S(268 - t * 120), S(y), S(hgt), S(22 - t * 10), hex('#22103a'));
    palm(cv, S(612 + t * 120), S(y), S(hgt), S(-22 + t * 10), hex('#22103a'));
  }
  car(cv, S(440), S(566), SS * 1.3, hex('#ffb02e'), hex('#ff5e7a'));
  return cv.downsample(SS);
}

// Scene 4 — marina boardwalk at golden hour, masts and calm water.
function sceneMarina(): Canvas {
  const cv = new Canvas(W * SS, H * SS);
  const S = (v: number) => v * SS;
  cv.vGrad(0, S(330), hex('#274b7a'), hex('#e88ca0'));
  cv.vGrad(S(230), S(336), hex('#e88ca0'), hex('#ffd9a0'));
  cv.disc(S(240), S(322), S(46), hex('#ffedb8'));
  cv.disc(S(240), S(322), S(92), hex('#ffb37a'), 0.4);
  cv.vGrad(S(336), cv.h, hex('#2e7d9b'), hex('#123a56'));
  const rand = rng(51);
  for (let i = 0; i < 110; i++) {
    const y = S(350) + rand() * S(280);
    cv.rect(rand() * cv.w, y, rand() * cv.w + S(16 + rand() * 42), y + S(2), rand() > 0.4 ? hex('#ffd9a0') : hex('#bfe9ff'), 0.3);
  }
  // sailboats: hull, mast, two sails
  const boat = (bx: number, by: number, s: number, hull: RGB, sail: RGB) => {
    cv.stroke(S(bx), S(by - 118 * s), S(bx), S(by), S(3.4 * s), hex('#10222e'));
    cv.poly([[S(bx), S(by - 114 * s)], [S(bx), S(by - 14 * s)], [S(bx + 52 * s), S(by - 14 * s)]], sail);
    cv.poly([[S(bx - 4 * s), S(by - 104 * s)], [S(bx - 4 * s), S(by - 14 * s)], [S(bx - 40 * s), S(by - 14 * s)]], mix(sail, hex('#ffffff'), 0.25));
    cv.poly([[S(bx - 58 * s), S(by)], [S(bx + 62 * s), S(by)], [S(bx + 44 * s), S(by + 16 * s)], [S(bx - 40 * s), S(by + 16 * s)]], hull);
  };
  boat(560, 400, 1, hex('#f2f4f6'), hex('#ffffff'));
  boat(700, 428, 0.78, hex('#ff8f5c'), hex('#ffe9f2'));
  boat(392, 420, 0.62, hex('#37f2d4'), hex('#eafcff'));
  boat(150, 452, 0.5, hex('#ffd76e'), hex('#ffffff'));
  // boardwalk foreground
  cv.poly([[0, cv.h], [0, S(520)], [S(880), S(472)], [S(880), cv.h]], hex('#6e4526'));
  for (let i = 0; i < 7; i++) cv.stroke(0, S(528 + i * 20), cv.w, S(480 + i * 20), S(2.4), hex('#4c2d16'));
  cv.stroke(0, S(516), cv.w, S(468), S(7), hex('#3c2716'));
  for (let i = 0; i < 6; i++) {
    const x = 60 + i * 155;
    cv.rect(S(x), S(452 - i * 3), S(x + 9), S(520 - i * 3), hex('#3c2716'));
    cv.disc(S(x + 4), S(446 - i * 3), S(9), hex('#ffe9b0'));
    cv.disc(S(x + 4), S(446 - i * 3), S(20), hex('#ffd76e'), 0.3);
  }
  palm(cv, S(828), S(560), S(230), S(-34), hex('#2a1608'));
  return cv.downsample(SS);
}

// ---- Minimal baseline JPEG encoder (4:4:4, standard Annex K tables) ----

const ZIGZAG = [0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54, 47, 55, 62, 63];
const Q_LUM = [16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99];
const Q_CHR = [
  17, 18, 24, 47, 99, 99, 99, 99,
  18, 21, 26, 66, 99, 99, 99, 99,
  24, 26, 56, 99, 99, 99, 99, 99,
  47, 66, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99,
];
const DC_LUM_BITS = [0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
const DC_LUM_VALS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const DC_CHR_BITS = [0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
const DC_CHR_VALS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const AC_LUM_BITS = [0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d];
const AC_LUM_VALS = [0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa];
const AC_CHR_BITS = [0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 0x77];
const AC_CHR_VALS = [0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71, 0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91, 0xa1, 0xb1, 0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0, 0x15, 0x62, 0x72, 0xd1, 0x0a, 0x16, 0x24, 0x34, 0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa];

interface HuffTable { codes: Map<number, { code: number; len: number }>; }

function buildHuff(bits: number[], vals: number[]): HuffTable {
  const codes = new Map<number, { code: number; len: number }>();
  let code = 0, k = 0;
  for (let len = 1; len <= 16; len++) {
    for (let i = 0; i < bits[len - 1]; i++) {
      codes.set(vals[k++], { code, len });
      code++;
    }
    code <<= 1;
  }
  return { codes };
}

class BitWriter {
  bytes: number[] = [];
  acc = 0;
  nbits = 0;
  put(code: number, len: number) {
    this.acc = (this.acc << len) | code;
    this.nbits += len;
    while (this.nbits >= 8) {
      const byte = (this.acc >> (this.nbits - 8)) & 0xff;
      this.bytes.push(byte);
      if (byte === 0xff) this.bytes.push(0);
      this.nbits -= 8;
      this.acc &= (1 << this.nbits) - 1;
    }
  }
  finish() {
    if (this.nbits > 0) {
      const byte = ((this.acc << (8 - this.nbits)) | ((1 << (8 - this.nbits)) - 1)) & 0xff;
      this.bytes.push(byte);
      if (byte === 0xff) this.bytes.push(0);
    }
  }
}

const COS = Array.from({ length: 8 }, (_, u) => Array.from({ length: 8 }, (_, x) => Math.cos(((2 * x + 1) * u * Math.PI) / 16)));

function fdctQuant(block: Float64Array, q: number[]): number[] {
  const out = new Array(64).fill(0);
  for (let u = 0; u < 8; u++) for (let v = 0; v < 8; v++) {
    let sum = 0;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) sum += block[y * 8 + x] * COS[u][x] * COS[v][y];
    const cu = u === 0 ? Math.SQRT1_2 : 1;
    const cvv = v === 0 ? Math.SQRT1_2 : 1;
    out[v * 8 + u] = Math.round((sum * 0.25 * cu * cvv) / q[v * 8 + u]);
  }
  return ZIGZAG.map((src) => out[src]);
}

function encodeBlock(bw: BitWriter, zz: number[], prevDc: number, dcT: HuffTable, acT: HuffTable): number {
  const diff = zz[0] - prevDc;
  const size = diff === 0 ? 0 : 32 - Math.clz32(Math.abs(diff));
  const dcEntry = dcT.codes.get(size);
  if (!dcEntry) throw new Error('dc size');
  bw.put(dcEntry.code, dcEntry.len);
  if (size > 0) {
    const val = diff > 0 ? diff : diff + (1 << size) - 1;
    bw.put(val, size);
  }
  let run = 0;
  for (let i = 1; i < 64; i++) {
    if (zz[i] === 0) { run++; continue; }
    while (run > 15) {
      const zrl = acT.codes.get(0xf0);
      if (zrl) bw.put(zrl.code, zrl.len);
      run -= 16;
    }
    const v = zz[i];
    const sz = 32 - Math.clz32(Math.abs(v));
    const entry = acT.codes.get((run << 4) | sz);
    if (!entry) throw new Error('ac symbol run=' + run + ' sz=' + sz + ' v=' + v);
    bw.put(entry.code, entry.len);
    bw.put(v > 0 ? v : v + (1 << sz) - 1, sz);
    run = 0;
  }
  if (run > 0) {
    const eob = acT.codes.get(0);
    if (eob) bw.put(eob.code, eob.len);
  }
  return zz[0];
}

function encodeJpeg(cv: Canvas, quality = 88): Buffer {
  const scale = quality < 50 ? 5000 / quality : 200 - quality * 2;
  const qLum = Q_LUM.map((v) => Math.max(1, Math.min(255, Math.floor((v * scale + 50) / 100))));
  const qChr = Q_CHR.map((v) => Math.max(1, Math.min(255, Math.floor((v * scale + 50) / 100))));
  const dcL = buildHuff(DC_LUM_BITS, DC_LUM_VALS);
  const dcC = buildHuff(DC_CHR_BITS, DC_CHR_VALS);
  const acL = buildHuff(AC_LUM_BITS, AC_LUM_VALS);
  const acC = buildHuff(AC_CHR_BITS, AC_CHR_VALS);
  const bw = new BitWriter();
  let prevY = 0, prevCb = 0, prevCr = 0;
  const pw = Math.ceil(cv.w / 8) * 8, ph = Math.ceil(cv.h / 8) * 8;
  const channel = (bx: number, by: number, kind: number) => {
    const block = new Float64Array(64);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const sx = Math.min(cv.w - 1, bx + x), sy = Math.min(cv.h - 1, by + y);
      const i = (sy * cv.w + sx) * 3;
      const r = cv.px[i], g = cv.px[i + 1], b = cv.px[i + 2];
      if (kind === 0) block[y * 8 + x] = 0.299 * r + 0.587 * g + 0.114 * b - 128;
      else if (kind === 1) block[y * 8 + x] = -0.1687 * r - 0.3313 * g + 0.5 * b;
      else block[y * 8 + x] = 0.5 * r - 0.4187 * g - 0.0813 * b;
    }
    return block;
  };
  for (let by = 0; by < ph; by += 8) for (let bx = 0; bx < pw; bx += 8) {
    prevY = encodeBlock(bw, fdctQuant(channel(bx, by, 0), qLum), prevY, dcL, acL);
    prevCb = encodeBlock(bw, fdctQuant(channel(bx, by, 1), qChr), prevCb, dcC, acC);
    prevCr = encodeBlock(bw, fdctQuant(channel(bx, by, 2), qChr), prevCr, dcC, acC);
  }
  bw.finish();
  const out: number[] = [];
  const marker = (m: number, data: number[]) => { out.push(0xff, m, (data.length + 2) >> 8, (data.length + 2) & 0xff, ...data); };
  out.push(0xff, 0xd8);
  marker(0xe0, [0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]);
  marker(0xdb, [0, ...ZIGZAG.map((src) => qLum[src])]);
  marker(0xdb, [1, ...ZIGZAG.map((src) => qChr[src])]);
  marker(0xc0, [8, cv.h >> 8, cv.h & 0xff, cv.w >> 8, cv.w & 0xff, 3, 1, 0x11, 0, 2, 0x11, 1, 3, 0x11, 1]);
  const huffSeg = (cls: number, id: number, bits: number[], vals: number[]) => [(cls << 4) | id, ...bits, ...vals];
  marker(0xc4, [...huffSeg(0, 0, DC_LUM_BITS, DC_LUM_VALS), ...huffSeg(1, 0, AC_LUM_BITS, AC_LUM_VALS), ...huffSeg(0, 1, DC_CHR_BITS, DC_CHR_VALS), ...huffSeg(1, 1, AC_CHR_BITS, AC_CHR_VALS)]);
  marker(0xda, [3, 1, 0x00, 2, 0x11, 3, 0x11, 0, 63, 0]);
  out.push(...bw.bytes, 0xff, 0xd9);
  return Buffer.from(out);
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const scenes: Array<[string, () => Canvas]> = [
    ['street.jpg', sceneStreet],
    ['pier.jpg', scenePier],
    ['boulevard.jpg', sceneBoulevard],
    ['marina.jpg', sceneMarina],
  ];
  for (const [name, paint] of scenes) {
    const jpeg = encodeJpeg(paint(), 88);
    writeFileSync(join(OUT_DIR, name), jpeg);
    console.log(name, jpeg.length, 'bytes');
  }
}

main();
